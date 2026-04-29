import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { writePsdBuffer } from 'ag-psd';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const PNG_MIME = 'image/png';

const isGroup = (node) => Array.isArray(node?.children);

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

        if (['help', 'skip-preview'].includes(key)) {
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
  node scripts/build-live2d-psd-from-manifest.mjs <manifest.json> [--psd <output.psd>] [--preview <preview.png>]

Manifest shape:
  {
    "name": "school-guide",
    "canvas": { "width": 1147, "height": 1365 },
    "output": {
      "psd": "output/live2d-guide/school-guide.psd",
      "preview": "output/live2d-guide/school-guide-preview.png"
    },
    "children": [
      {
        "name": "01_face",
        "children": [
          {
            "name": "face_01",
            "source": "parts/face/face_01.png",
            "left": 123,
            "top": 234
          }
        ]
      }
    ]
  }`);
};

const resolveManifestPath = (baseDir, maybeRelativePath) => (
    path.isAbsolute(maybeRelativePath)
        ? maybeRelativePath
        : path.resolve(baseDir, maybeRelativePath)
);

const resolveOutputPath = (manifestDir, maybeRelativePath) => {
    if (path.isAbsolute(maybeRelativePath)) {
        return maybeRelativePath;
    }

    if (maybeRelativePath.startsWith('.\\')
        || maybeRelativePath.startsWith('./')
        || maybeRelativePath.startsWith('..\\')
        || maybeRelativePath.startsWith('../')) {
        return path.resolve(manifestDir, maybeRelativePath);
    }

    return path.resolve(repoRoot, maybeRelativePath);
};

const ensureDirForFile = async (filePath) => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
};

const toClampedArray = (buffer) => {
    const copied = new Uint8ClampedArray(buffer.length);
    copied.set(buffer);
    return copied;
};

const applyOpacityToRaw = (rgbaBuffer, opacity) => {
    if (opacity === undefined || opacity === null || opacity >= 1) {
        return rgbaBuffer;
    }

    const next = Buffer.from(rgbaBuffer);
    for (let index = 3; index < next.length; index += 4) {
        next[index] = Math.max(0, Math.min(255, Math.round(next[index] * opacity)));
    }
    return next;
};

const cropToCanvas = async ({ layer, source, canvas }) => {
    const sourceLeft = Math.max(0, 0 - layer.left);
    const sourceTop = Math.max(0, 0 - layer.top);
    const targetLeft = Math.max(0, layer.left);
    const targetTop = Math.max(0, layer.top);
    const width = Math.min(source.width - sourceLeft, canvas.width - targetLeft);
    const height = Math.min(source.height - sourceTop, canvas.height - targetTop);

    if (width <= 0 || height <= 0) {
        return null;
    }

    const raw = await sharp(source.raw, {
        raw: {
            width: source.width,
            height: source.height,
            channels: 4,
        },
    })
        .extract({
            left: sourceLeft,
            top: sourceTop,
            width,
            height,
        })
        .png()
        .toBuffer();

    return {
        input: raw,
        left: targetLeft,
        top: targetTop,
    };
};

const loadSourceImage = async (absoluteSourcePath, cache) => {
    if (!cache.has(absoluteSourcePath)) {
        const { data, info } = await sharp(absoluteSourcePath)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const png = await sharp(data, {
            raw: {
                width: info.width,
                height: info.height,
                channels: info.channels,
            },
        }).png().toBuffer();

        cache.set(absoluteSourcePath, {
            width: info.width,
            height: info.height,
            raw: data,
            png,
            mime: PNG_MIME,
        });
    }

    return cache.get(absoluteSourcePath);
};

const hydratePsdNode = async ({ node, manifestDir, imageCache }) => {
    if (isGroup(node)) {
        const children = [];
        for (const child of node.children) {
            children.push(await hydratePsdNode({ node: child, manifestDir, imageCache }));
        }

        return {
            name: node.name || 'Group',
            hidden: Boolean(node.hidden),
            opened: node.opened !== false,
            children,
        };
    }

    if (!node?.source) {
        throw new Error(`Leaf layer "${node?.name || 'unnamed'}" is missing a "source" path.`);
    }

    const absoluteSourcePath = resolveManifestPath(manifestDir, node.source);
    const source = await loadSourceImage(absoluteSourcePath, imageCache);
    const opacity = Number.isFinite(node.opacity) ? node.opacity : 1;

    return {
        name: node.name || path.basename(absoluteSourcePath, path.extname(absoluteSourcePath)),
        top: Math.round(node.top || 0),
        left: Math.round(node.left || 0),
        hidden: Boolean(node.hidden),
        opacity,
        blendMode: node.blendMode || 'normal',
        imageData: {
            width: source.width,
            height: source.height,
            data: toClampedArray(applyOpacityToRaw(source.raw, opacity)),
        },
    };
};

const collectRenderableLayers = (nodes, inheritedHidden = false) => {
    const layers = [];

    for (const node of nodes || []) {
        const hidden = inheritedHidden || Boolean(node.hidden);
        if (isGroup(node)) {
            layers.push(...collectRenderableLayers(node.children, hidden));
            continue;
        }

        if (hidden || !node?.source) {
            continue;
        }

        layers.push(node);
    }

    return layers;
};

const buildComposite = async ({ canvas, nodes, manifestDir, imageCache }) => {
    const renderableLayers = collectRenderableLayers(nodes);
    if (renderableLayers.length === 0) {
        return null;
    }

    const composites = [];
    for (const layer of [...renderableLayers].reverse()) {
        const absoluteSourcePath = resolveManifestPath(manifestDir, layer.source);
        const source = await loadSourceImage(absoluteSourcePath, imageCache);
        const opacity = Number.isFinite(layer.opacity) ? layer.opacity : 1;
        const sourceWithOpacity = opacity >= 1
            ? source
            : {
                ...source,
                raw: applyOpacityToRaw(source.raw, opacity),
            };

        const cropped = await cropToCanvas({
            layer: {
                left: Math.round(layer.left || 0),
                top: Math.round(layer.top || 0),
            },
            source: sourceWithOpacity,
            canvas,
        });
        if (cropped) {
            composites.push(cropped);
        }
    }

    if (composites.length === 0) {
        return null;
    }

    const composed = sharp({
        create: {
            width: canvas.width,
            height: canvas.height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    }).composite(composites);

    const pngBuffer = await composed.png().toBuffer();
    const { data, info } = await composed.raw().toBuffer({ resolveWithObject: true });

    return {
        pngBuffer,
        imageData: {
            width: info.width,
            height: info.height,
            data: toClampedArray(data),
        },
    };
};

const resolveOutputTargets = ({ manifest, manifestPath, overrides = {} }) => {
    const manifestDir = path.dirname(manifestPath);
    const outputBlock = manifest.output || {};
    const defaultStem = safeName(manifest.name || path.basename(manifestPath, path.extname(manifestPath)) || 'live2d-guide');
    const defaultDir = path.join(repoRoot, 'output', 'live2d-guide', defaultStem);

    const psdTarget = overrides.psd
        || outputBlock.psd
        || path.join(defaultDir, `${defaultStem}.psd`);
    const previewTarget = overrides.preview
        || outputBlock.preview
        || path.join(defaultDir, `${defaultStem}-preview.png`);

    return {
        psdPath: resolveOutputPath(manifestDir, psdTarget),
        previewPath: resolveOutputPath(manifestDir, previewTarget),
    };
};

export const loadManifest = async (manifestPath) => {
    const absoluteManifestPath = path.resolve(repoRoot, manifestPath);
    const manifest = JSON.parse(await fs.readFile(absoluteManifestPath, 'utf8'));

    if (!manifest?.canvas?.width || !manifest?.canvas?.height) {
        throw new Error('Manifest is missing canvas.width / canvas.height.');
    }

    return {
        manifest,
        manifestPath: absoluteManifestPath,
    };
};

export const buildPsdFromManifest = async (manifest, options = {}) => {
    const manifestPath = options.manifestPath
        ? path.resolve(options.manifestPath)
        : path.join(repoRoot, `${safeName(manifest.name || 'live2d-guide')}.manifest.json`);
    const manifestDir = options.manifestDir
        ? path.resolve(options.manifestDir)
        : path.dirname(manifestPath);
    const imageCache = new Map();
    const outputTargets = resolveOutputTargets({
        manifest,
        manifestPath,
        overrides: {
            psd: options.psdPath,
            preview: options.previewPath,
        },
    });

    const children = [];
    for (const child of manifest.children || []) {
        children.push(await hydratePsdNode({ node: child, manifestDir, imageCache }));
    }

    const composite = await buildComposite({
        canvas: manifest.canvas,
        nodes: manifest.children || [],
        manifestDir,
        imageCache,
    });

    const psdBuffer = writePsdBuffer({
        width: manifest.canvas.width,
        height: manifest.canvas.height,
        children,
        imageData: composite?.imageData,
        imageResources: {
            versionInfo: {
                hasRealMergedData: true,
                writerName: 'Codex Live2D PSD Builder',
                readerName: 'Adobe Photoshop',
                fileVersion: 1,
            },
        },
    }, {
        noBackground: true,
    });

    await ensureDirForFile(outputTargets.psdPath);
    await fs.writeFile(outputTargets.psdPath, psdBuffer);

    if (composite && !options.skipPreview) {
        await ensureDirForFile(outputTargets.previewPath);
        await fs.writeFile(outputTargets.previewPath, composite.pngBuffer);
    }

    return {
        psdPath: outputTargets.psdPath,
        previewPath: composite && !options.skipPreview ? outputTargets.previewPath : null,
        layerCount: collectRenderableLayers(manifest.children || []).length,
        documentSize: `${manifest.canvas.width}x${manifest.canvas.height}`,
    };
};

export const buildPsdFromManifestFile = async (manifestPath, options = {}) => {
    const loaded = await loadManifest(manifestPath);
    return buildPsdFromManifest(loaded.manifest, {
        ...options,
        manifestPath: loaded.manifestPath,
        manifestDir: path.dirname(loaded.manifestPath),
    });
};

const maybeRunCli = async () => {
    const { options, positionals } = parseArgs(process.argv.slice(2));

    if (options.help || positionals.length === 0) {
        printUsage();
        return;
    }

    const manifestPath = positionals[0];
    const result = await buildPsdFromManifestFile(manifestPath, {
        psdPath: options.psd,
        previewPath: options.preview,
        skipPreview: Boolean(options['skip-preview']),
    });

    console.log(`PSD: ${result.psdPath}`);
    if (result.previewPath) {
        console.log(`Preview: ${result.previewPath}`);
    }
    console.log(`Layers: ${result.layerCount}`);
    console.log(`Canvas: ${result.documentSize}`);
};

if (path.resolve(process.argv[1] || '') === __filename) {
    maybeRunCli().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
