import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const atlasRoot = path.join(repoRoot, 'public', 'live2d', 'models', 'free-witch', '魔女', '魔女.8192');
const outputRoot = path.join(repoRoot, 'output', 'live2d-parts', 'witch', 'atlas-components');
const alphaThreshold = 4;
const minPixels = 80;

const textureFiles = ['texture_00.png', 'texture_01.png'];
const neighbors = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],            [1, 0],
    [-1, 1],  [0, 1],  [1, 1],
];

const saveComponent = async ({ outputDir, textureName, componentIndex, bbox, pixels, sourceData }) => {
    const width = bbox.maxX - bbox.minX + 1;
    const height = bbox.maxY - bbox.minY + 1;
    const buffer = Buffer.alloc(width * height * 4);

    for (const offset of pixels) {
        const pixelIndex = offset / 4;
        const sourceX = pixelIndex % bbox.sourceWidth;
        const sourceY = Math.floor(pixelIndex / bbox.sourceWidth);
        const localX = sourceX - bbox.minX;
        const localY = sourceY - bbox.minY;
        const targetOffset = ((localY * width) + localX) * 4;

        buffer[targetOffset] = sourceData[offset];
        buffer[targetOffset + 1] = sourceData[offset + 1];
        buffer[targetOffset + 2] = sourceData[offset + 2];
        buffer[targetOffset + 3] = sourceData[offset + 3];
    }

    const fileName = `${textureName.replace('.png', '')}_component_${String(componentIndex).padStart(3, '0')}.png`;
    const outputPath = path.join(outputDir, fileName);

    await sharp(buffer, {
        raw: {
            width,
            height,
            channels: 4,
        },
    }).png().toFile(outputPath);

    return outputPath;
};

const extractComponents = async (textureFile) => {
    const inputPath = path.join(atlasRoot, textureFile);
    const textureName = path.basename(textureFile);
    const outputDir = path.join(outputRoot, textureName.replace('.png', ''));

    await fs.mkdir(outputDir, { recursive: true });

    const { data, info } = await sharp(inputPath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const visited = new Uint8Array(info.width * info.height);
    const manifest = [];
    let componentIndex = 0;

    for (let y = 0; y < info.height; y += 1) {
        for (let x = 0; x < info.width; x += 1) {
            const pixelIndex = (y * info.width) + x;
            if (visited[pixelIndex]) {
                continue;
            }

            visited[pixelIndex] = 1;
            const offset = pixelIndex * 4;
            if (data[offset + 3] <= alphaThreshold) {
                continue;
            }

            const queue = [pixelIndex];
            const pixels = [];
            let head = 0;
            let minX = x;
            let minY = y;
            let maxX = x;
            let maxY = y;

            while (head < queue.length) {
                const current = queue[head];
                head += 1;

                const currentOffset = current * 4;
                const currentX = current % info.width;
                const currentY = Math.floor(current / info.width);

                pixels.push(currentOffset);
                minX = Math.min(minX, currentX);
                minY = Math.min(minY, currentY);
                maxX = Math.max(maxX, currentX);
                maxY = Math.max(maxY, currentY);

                for (const [dx, dy] of neighbors) {
                    const nextX = currentX + dx;
                    const nextY = currentY + dy;
                    if (nextX < 0 || nextX >= info.width || nextY < 0 || nextY >= info.height) {
                        continue;
                    }

                    const nextIndex = (nextY * info.width) + nextX;
                    if (visited[nextIndex]) {
                        continue;
                    }

                    visited[nextIndex] = 1;
                    const nextOffset = nextIndex * 4;
                    if (data[nextOffset + 3] <= alphaThreshold) {
                        continue;
                    }

                    queue.push(nextIndex);
                }
            }

            if (pixels.length < minPixels) {
                continue;
            }

            componentIndex += 1;
            const bbox = { minX, minY, maxX, maxY, sourceWidth: info.width };
            const outputPath = await saveComponent({
                outputDir,
                textureName,
                componentIndex,
                bbox,
                pixels,
                sourceData: data,
            });

            manifest.push({
                texture: textureName,
                componentIndex,
                file: outputPath,
                pixelCount: pixels.length,
                bbox: { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 },
            });
        }
    }

    manifest.sort((a, b) => b.pixelCount - a.pixelCount);
    await fs.writeFile(
        path.join(outputDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf8',
    );

    return { texture: textureName, componentCount: manifest.length, manifestPath: path.join(outputDir, 'manifest.json') };
};

const main = async () => {
    await fs.mkdir(outputRoot, { recursive: true });
    const summary = [];

    for (const textureFile of textureFiles) {
        console.log(`Extracting ${textureFile}...`);
        summary.push(await extractComponents(textureFile));
    }

    await fs.writeFile(
        path.join(outputRoot, 'summary.json'),
        JSON.stringify(summary, null, 2),
        'utf8',
    );

    console.log(`Saved atlas components to ${outputRoot}`);
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
