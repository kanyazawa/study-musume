import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { buildPsdFromManifest } from './build-live2d-psd-from-manifest.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const defaultPresetPath = path.join(__dirname, 'presets', 'live2d-guide-sheet-default.json');

const neighbors = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],           [1, 0],
    [-1, 1],  [0, 1],  [1, 1],
];

const safeName = (value = '') =>
    String(value)
        .normalize('NFKD')
        .replace(/[^\w.-]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase();

const parseArgs = (argv) => {
    const options = {};
    const positionals = [];

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];
        if (!token.startsWith('--')) {
            positionals.push(token);
            continue;
        }

        const [rawKey, inlineValue] = token.split('=');
        const key = rawKey.replace(/^--/, '');
        if (inlineValue !== undefined) {
            options[key] = inlineValue;
            continue;
        }

        if (['help', 'no-psd'].includes(key)) {
            options[key] = true;
            continue;
        }

        const nextValue = argv[index + 1];
        if (!nextValue || nextValue.startsWith('--')) {
            options[key] = true;
            continue;
        }

        options[key] = nextValue;
        index += 1;
    }

    return { options, positionals };
};

const printUsage = () => {
    console.log(`Usage:
  node scripts/extract-live2d-guide-sheet.mjs <guide-image.png> [--preset scripts/presets/live2d-guide-sheet-default.json] [--output-dir output/live2d-guide/school-guide]

What it does:
  1. Detects non-white components inside the preset guide zones.
  2. Fills enclosed white interiors so pale clothes and skin survive better.
  3. Filters out frame-like components and writes PNG parts.
  4. Builds a layered PSD and preview PNG unless --no-psd is passed.
`);
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const resolveMaybeRelative = (baseDir, maybeRelativePath) => (
    path.isAbsolute(maybeRelativePath)
        ? maybeRelativePath
        : path.resolve(baseDir, maybeRelativePath)
);

const toAbsoluteRect = (rect, imageWidth, imageHeight) => {
    const left = Math.round(clamp(rect.left, 0, 1) * imageWidth);
    const top = Math.round(clamp(rect.top, 0, 1) * imageHeight);
    const right = Math.round(clamp(rect.left + rect.width, 0, 1) * imageWidth);
    const bottom = Math.round(clamp(rect.top + rect.height, 0, 1) * imageHeight);

    return {
        left,
        top,
        width: Math.max(1, right - left),
        height: Math.max(1, bottom - top),
    };
};

const toLocalIgnoreRects = (ignoreRects = [], width, height) => (
    ignoreRects.map((rect) => ({
        left: Math.round(clamp(rect.left, 0, 1) * width),
        top: Math.round(clamp(rect.top, 0, 1) * height),
        right: Math.round(clamp(rect.left + rect.width, 0, 1) * width),
        bottom: Math.round(clamp(rect.top + rect.height, 0, 1) * height),
    }))
);

const isIgnoredPoint = (x, y, ignoreRects) => (
    ignoreRects.some((rect) => x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom)
);

const buildForegroundMask = ({ raw, width, height, zone }) => {
    const mask = new Uint8Array(width * height);
    const excludeTopPx = Math.round((zone.excludeTopRatio || 0) * height);
    const ignoreRects = toLocalIgnoreRects(zone.ignoreRects, width, height);
    const whiteThreshold = zone.whiteThreshold || 244;

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            if (y < excludeTopPx || isIgnoredPoint(x, y, ignoreRects)) {
                continue;
            }

            const pixelIndex = ((y * width) + x) * 4;
            const alpha = raw[pixelIndex + 3];
            if (alpha === 0) {
                continue;
            }

            const red = raw[pixelIndex];
            const green = raw[pixelIndex + 1];
            const blue = raw[pixelIndex + 2];
            if (red < whiteThreshold || green < whiteThreshold || blue < whiteThreshold) {
                mask[(y * width) + x] = 1;
            }
        }
    }

    return mask;
};

const extractConnectedComponents = (mask, width, height) => {
    const visited = new Uint8Array(width * height);
    const components = [];

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const seedIndex = (y * width) + x;
            if (!mask[seedIndex] || visited[seedIndex]) {
                continue;
            }

            const queue = [seedIndex];
            visited[seedIndex] = 1;
            let head = 0;
            let minX = x;
            let minY = y;
            let maxX = x;
            let maxY = y;
            const pixels = [];

            while (head < queue.length) {
                const current = queue[head];
                head += 1;

                const currentX = current % width;
                const currentY = Math.floor(current / width);
                pixels.push(current * 4);

                minX = Math.min(minX, currentX);
                minY = Math.min(minY, currentY);
                maxX = Math.max(maxX, currentX);
                maxY = Math.max(maxY, currentY);

                for (const [dx, dy] of neighbors) {
                    const nextX = currentX + dx;
                    const nextY = currentY + dy;
                    if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
                        continue;
                    }

                    const nextIndex = (nextY * width) + nextX;
                    if (!mask[nextIndex] || visited[nextIndex]) {
                        continue;
                    }

                    visited[nextIndex] = 1;
                    queue.push(nextIndex);
                }
            }

            components.push({
                pixels,
                bbox: {
                    minX,
                    minY,
                    maxX,
                    maxY,
                    width: maxX - minX + 1,
                    height: maxY - minY + 1,
                },
            });
        }
    }

    return components;
};

const buildComponentStats = ({ component, width, height, raw }) => {
    const { bbox, pixels } = component;
    const bboxArea = bbox.width * bbox.height;
    const fillRatio = bboxArea > 0 ? pixels.length / bboxArea : 0;
    const touchesEdge = bbox.minX <= 1
        || bbox.minY <= 1
        || bbox.maxX >= width - 2
        || bbox.maxY >= height - 2;
    const aspectRatio = Math.max(bbox.width / Math.max(1, bbox.height), bbox.height / Math.max(1, bbox.width));

    let lumaSum = 0;
    for (const offset of pixels) {
        const red = raw[offset];
        const green = raw[offset + 1];
        const blue = raw[offset + 2];
        lumaSum += (red * 0.2126) + (green * 0.7152) + (blue * 0.0722);
    }

    return {
        pixelCount: pixels.length,
        bboxArea,
        fillRatio,
        touchesEdge,
        aspectRatio,
        averageLuma: pixels.length > 0 ? lumaSum / pixels.length : 255,
    };
};

const isComponentAccepted = ({ component, zone, width, height, raw }) => {
    const stats = buildComponentStats({ component, width, height, raw });
    const minPixels = zone.minPixels || 80;
    const minWidth = zone.minWidth || 8;
    const minHeight = zone.minHeight || 8;
    const maxPixels = zone.maxPixels || Infinity;
    const minFillRatio = zone.minFillRatio ?? 0;
    const maxFillRatio = zone.maxFillRatio ?? 1;
    const frameMinArea = zone.frameMinArea || 4500;
    const frameMaxFillRatio = zone.frameMaxFillRatio ?? 0.12;
    const darkTextMaxPixels = zone.darkTextMaxPixels || 260;
    const darkTextMaxWidth = zone.darkTextMaxWidth || 28;
    const darkTextMaxHeight = zone.darkTextMaxHeight || 20;
    const darkTextMaxLuma = zone.darkTextMaxLuma || 125;

    if (stats.pixelCount < minPixels || stats.pixelCount > maxPixels) {
        return false;
    }

    if (component.bbox.width < minWidth || component.bbox.height < minHeight) {
        return false;
    }

    if (stats.fillRatio < minFillRatio || stats.fillRatio > maxFillRatio) {
        return false;
    }

    if (zone.rejectTouchingEdge && stats.touchesEdge) {
        return false;
    }

    if ((zone.rejectFrameLike ?? true)
        && stats.bboxArea >= frameMinArea
        && stats.fillRatio <= frameMaxFillRatio) {
        return false;
    }

    if (zone.rejectTinyDarkText
        && stats.pixelCount <= darkTextMaxPixels
        && component.bbox.width <= darkTextMaxWidth
        && component.bbox.height <= darkTextMaxHeight
        && stats.averageLuma <= darkTextMaxLuma) {
        return false;
    }

    if ((zone.maxAspectRatio || 0) > 0 && stats.aspectRatio > zone.maxAspectRatio) {
        return false;
    }

    return true;
};

const fillComponentInterior = ({ component, zone, raw, width, height }) => {
    if (!zone.fillInterior) {
        return component;
    }

    const padding = zone.fillPadding ?? 1;
    const whiteFillThreshold = zone.whiteFillThreshold || 250;
    const bbox = {
        minX: Math.max(0, component.bbox.minX - padding),
        minY: Math.max(0, component.bbox.minY - padding),
        maxX: Math.min(width - 1, component.bbox.maxX + padding),
        maxY: Math.min(height - 1, component.bbox.maxY + padding),
    };
    bbox.width = bbox.maxX - bbox.minX + 1;
    bbox.height = bbox.maxY - bbox.minY + 1;

    const localSize = bbox.width * bbox.height;
    const occupied = new Uint8Array(localSize);
    for (const offset of component.pixels) {
        const pixelIndex = offset / 4;
        const sourceX = pixelIndex % width;
        const sourceY = Math.floor(pixelIndex / width);
        const localIndex = ((sourceY - bbox.minY) * bbox.width) + (sourceX - bbox.minX);
        occupied[localIndex] = 1;
    }

    const barrier = new Uint8Array(occupied);
    const barrierExpansion = zone.fillBarrierExpansion || 0;
    if (barrierExpansion > 0) {
        for (let localY = 0; localY < bbox.height; localY += 1) {
            for (let localX = 0; localX < bbox.width; localX += 1) {
                const localIndex = (localY * bbox.width) + localX;
                if (!occupied[localIndex]) {
                    continue;
                }

                for (let dy = -barrierExpansion; dy <= barrierExpansion; dy += 1) {
                    for (let dx = -barrierExpansion; dx <= barrierExpansion; dx += 1) {
                        const nextX = localX + dx;
                        const nextY = localY + dy;
                        if (nextX < 0 || nextX >= bbox.width || nextY < 0 || nextY >= bbox.height) {
                            continue;
                        }
                        barrier[(nextY * bbox.width) + nextX] = 1;
                    }
                }
            }
        }
    }

    const reachable = new Uint8Array(localSize);
    const queue = [];
    let head = 0;
    const maybePush = (localX, localY) => {
        if (localX < 0 || localX >= bbox.width || localY < 0 || localY >= bbox.height) {
            return;
        }
        const localIndex = (localY * bbox.width) + localX;
        if (reachable[localIndex] || barrier[localIndex]) {
            return;
        }

        const sourceX = bbox.minX + localX;
        const sourceY = bbox.minY + localY;
        const pixelIndex = ((sourceY * width) + sourceX) * 4;
        const alpha = raw[pixelIndex + 3];
        const red = raw[pixelIndex];
        const green = raw[pixelIndex + 1];
        const blue = raw[pixelIndex + 2];
        const isBackgroundLike = alpha > 0
            && red >= whiteFillThreshold
            && green >= whiteFillThreshold
            && blue >= whiteFillThreshold;

        if (!isBackgroundLike) {
            return;
        }

        reachable[localIndex] = 1;
        queue.push(localIndex);
    };

    for (let localX = 0; localX < bbox.width; localX += 1) {
        maybePush(localX, 0);
        maybePush(localX, bbox.height - 1);
    }
    for (let localY = 0; localY < bbox.height; localY += 1) {
        maybePush(0, localY);
        maybePush(bbox.width - 1, localY);
    }

    while (head < queue.length) {
        const current = queue[head];
        head += 1;
        const localX = current % bbox.width;
        const localY = Math.floor(current / bbox.width);

        maybePush(localX - 1, localY);
        maybePush(localX + 1, localY);
        maybePush(localX, localY - 1);
        maybePush(localX, localY + 1);
    }

    const nextPixels = [...component.pixels];
    for (let localIndex = 0; localIndex < localSize; localIndex += 1) {
        if (occupied[localIndex] || reachable[localIndex]) {
            continue;
        }

        const localX = localIndex % bbox.width;
        const localY = Math.floor(localIndex / bbox.width);
        const sourceX = bbox.minX + localX;
        const sourceY = bbox.minY + localY;
        const pixelIndex = ((sourceY * width) + sourceX) * 4;
        const alpha = raw[pixelIndex + 3];
        const red = raw[pixelIndex];
        const green = raw[pixelIndex + 1];
        const blue = raw[pixelIndex + 2];
        const isBackgroundLike = alpha > 0
            && red >= whiteFillThreshold
            && green >= whiteFillThreshold
            && blue >= whiteFillThreshold;

        if (isBackgroundLike) {
            nextPixels.push(pixelIndex);
        }
    }

    return {
        pixels: nextPixels,
        bbox: component.bbox,
    };
};

const sortComponents = (components, zoneHeight, rowToleranceRatio = 0.045) => {
    const rowTolerance = Math.max(8, Math.round(zoneHeight * rowToleranceRatio));
    return [...components].sort((left, right) => {
        const leftCenterY = left.bbox.minY + (left.bbox.height / 2);
        const rightCenterY = right.bbox.minY + (right.bbox.height / 2);
        const deltaY = leftCenterY - rightCenterY;
        if (Math.abs(deltaY) <= rowTolerance) {
            const leftCenterX = left.bbox.minX + (left.bbox.width / 2);
            const rightCenterX = right.bbox.minX + (right.bbox.width / 2);
            return leftCenterX - rightCenterX;
        }
        return deltaY;
    });
};

const saveComponentPng = async ({ raw, width, component, outputPath }) => {
    const { bbox } = component;
    const buffer = Buffer.alloc(bbox.width * bbox.height * 4);

    for (const offset of component.pixels) {
        const sourcePixelIndex = offset / 4;
        const sourceX = sourcePixelIndex % width;
        const sourceY = Math.floor(sourcePixelIndex / width);
        const localX = sourceX - bbox.minX;
        const localY = sourceY - bbox.minY;
        const targetOffset = ((localY * bbox.width) + localX) * 4;

        buffer[targetOffset] = raw[offset];
        buffer[targetOffset + 1] = raw[offset + 1];
        buffer[targetOffset + 2] = raw[offset + 2];
        buffer[targetOffset + 3] = raw[offset + 3];
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await sharp(buffer, {
        raw: {
            width: bbox.width,
            height: bbox.height,
            channels: 4,
        },
    }).png().toFile(outputPath);
};

const extractZone = async ({ sourcePath, zone, imageMeta, outputDir }) => {
    const zoneRect = toAbsoluteRect(zone.rect, imageMeta.width, imageMeta.height);
    const zoneSlug = safeName(zone.id || zone.partPrefix || zone.name || 'zone');
    const partPrefix = safeName(zone.partPrefix || zone.id || zone.name || 'part');
    const zoneOutputDir = path.join(outputDir, 'parts', zoneSlug);
    const { data, info } = await sharp(sourcePath)
        .extract(zoneRect)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const mask = buildForegroundMask({
        raw: data,
        width: info.width,
        height: info.height,
        zone,
    });

    const components = [];
    for (const component of extractConnectedComponents(mask, info.width, info.height)) {
        if (!isComponentAccepted({
            component,
            zone,
            width: info.width,
            height: info.height,
            raw: data,
        })) {
            continue;
        }

        const maybeFilled = fillComponentInterior({
            component,
            zone,
            raw: data,
            width: info.width,
            height: info.height,
        });

        if (!isComponentAccepted({
            component: maybeFilled,
            zone,
            width: info.width,
            height: info.height,
            raw: data,
        })) {
            continue;
        }

        components.push(maybeFilled);
    }

    const sorted = sortComponents(
        components,
        info.height,
        zone.rowToleranceRatio,
    );
    const limited = Number.isFinite(zone.maxComponents) ? sorted.slice(0, zone.maxComponents) : sorted;

    const layers = [];
    for (let index = 0; index < limited.length; index += 1) {
        const component = limited[index];
        const fileStem = `${partPrefix}_${String(index + 1).padStart(2, '0')}`;
        const outputPath = path.join(zoneOutputDir, `${fileStem}.png`);
        await saveComponentPng({
            raw: data,
            width: info.width,
            component,
            outputPath,
        });

        layers.push({
            name: fileStem,
            source: path.relative(outputDir, outputPath),
            left: zoneRect.left + component.bbox.minX,
            top: zoneRect.top + component.bbox.minY,
            metadata: {
                zone: zone.id,
                pixelCount: component.pixels.length,
                bbox: component.bbox,
            },
        });
    }

    return {
        groupId: zone.groupId || zone.id,
        groupName: zone.groupName || zone.groupId || zone.name || zone.id,
        order: zone.order || 0,
        layers,
        metadata: {
            zoneRect,
            detectedCount: layers.length,
            zoneId: zone.id,
        },
    };
};

const buildManifest = ({ sourcePath, preset, presetPath, psdPath, previewPath, imageMeta, groups }) => ({
    name: `${safeName(path.basename(sourcePath, path.extname(sourcePath)))}-guide`,
    extractedAt: new Date().toISOString(),
    sourceImage: sourcePath,
    preset: path.relative(repoRoot, presetPath),
    canvas: {
        width: imageMeta.width,
        height: imageMeta.height,
    },
    output: {
        psd: psdPath,
        preview: previewPath,
    },
    children: [
        {
            name: '00_reference',
            opened: true,
            children: [
                {
                    name: 'guide_sheet_reference',
                    source: sourcePath,
                    left: 0,
                    top: 0,
                    hidden: true,
                    opacity: 0.35,
                },
            ],
        },
        ...groups,
    ],
    metadata: {
        presetName: preset.name,
        zoneCount: preset.zones.length,
    },
});

const main = async () => {
    const { options, positionals } = parseArgs(process.argv.slice(2));
    if (options.help || positionals.length === 0) {
        printUsage();
        return;
    }

    const sourcePath = resolveMaybeRelative(repoRoot, positionals[0]);
    const presetPath = resolveMaybeRelative(repoRoot, options.preset || defaultPresetPath);
    const preset = JSON.parse(await fs.readFile(presetPath, 'utf8'));
    const imageMeta = await sharp(sourcePath).metadata();

    if (!imageMeta.width || !imageMeta.height) {
        throw new Error(`Could not read image size for ${sourcePath}`);
    }

    const sourceStem = safeName(path.basename(sourcePath, path.extname(sourcePath)) || 'guide');
    const outputDir = resolveMaybeRelative(
        repoRoot,
        options['output-dir'] || path.join('output', 'live2d-guide', sourceStem),
    );
    const manifestPath = resolveMaybeRelative(
        repoRoot,
        options.manifest || path.join(outputDir, `${sourceStem}-manifest.json`),
    );
    const psdPath = resolveMaybeRelative(
        repoRoot,
        options.psd || path.join(outputDir, `${sourceStem}.psd`),
    );
    const previewPath = resolveMaybeRelative(
        repoRoot,
        options.preview || path.join(outputDir, `${sourceStem}-preview.png`),
    );

    await fs.mkdir(outputDir, { recursive: true });

    const groupsById = new Map();
    for (const zone of preset.zones || []) {
        const result = await extractZone({
            sourcePath,
            zone,
            imageMeta,
            outputDir,
        });

        if (!groupsById.has(result.groupId)) {
            groupsById.set(result.groupId, {
                name: result.groupName,
                opened: true,
                order: result.order,
                children: [],
                metadata: {
                    subzones: [],
                },
            });
        }

        const group = groupsById.get(result.groupId);
        group.children.push(...result.layers);
        group.metadata.subzones.push(result.metadata);
    }

    const groups = [...groupsById.values()]
        .sort((left, right) => (left.order || 0) - (right.order || 0))
        .map(({ order, ...group }) => group);

    const manifest = buildManifest({
        sourcePath,
        preset,
        presetPath,
        psdPath,
        previewPath,
        imageMeta,
        groups,
    });

    await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.log(`Manifest: ${manifestPath}`);

    if (!options['no-psd']) {
        const buildResult = await buildPsdFromManifest(manifest, {
            manifestPath,
            manifestDir: path.dirname(manifestPath),
            psdPath,
            previewPath,
        });
        console.log(`PSD: ${buildResult.psdPath}`);
        if (buildResult.previewPath) {
            console.log(`Preview: ${buildResult.previewPath}`);
        }
    }
};

if (path.resolve(process.argv[1] || '') === __filename) {
    main().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
