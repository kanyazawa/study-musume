import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const atlasOutputRoot = path.join(repoRoot, 'output', 'live2d-parts', 'witch', 'atlas-components');
const textures = ['texture_00', 'texture_01'];
const maxItemsPerTexture = 60;
const columns = 4;
const thumbWidth = 240;
const thumbHeight = 240;
const labelHeight = 44;
const padding = 18;

const escapeXml = (value = '') =>
    String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');

const buildLabelSvg = ({ width, height, title, subtitle }) => Buffer.from(`
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#f7f1e6" />
  <text x="10" y="16" font-size="14" font-family="Arial, sans-serif" fill="#1b1b1b">${escapeXml(title)}</text>
  <text x="10" y="33" font-size="12" font-family="Arial, sans-serif" fill="#5c5446">${escapeXml(subtitle)}</text>
</svg>`);

const buildSheet = async (textureName) => {
    const dir = path.join(atlasOutputRoot, textureName);
    const manifest = JSON.parse(await fs.readFile(path.join(dir, 'manifest.json'), 'utf8'));
    const items = manifest.slice(0, maxItemsPerTexture);
    const rows = Math.ceil(items.length / columns);
    const sheetWidth = (columns * (thumbWidth + (padding * 2)));
    const sheetHeight = rows * ((thumbHeight + labelHeight) + (padding * 2));

    const composites = [];

    for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const col = index % columns;
        const row = Math.floor(index / columns);
        const left = col * (thumbWidth + (padding * 2)) + padding;
        const top = row * ((thumbHeight + labelHeight) + (padding * 2)) + padding;

        const imageBuffer = await sharp(item.file)
            .resize(thumbWidth, thumbHeight, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 },
            })
            .png()
            .toBuffer();

        composites.push({
            input: imageBuffer,
            left,
            top,
        });

        composites.push({
            input: buildLabelSvg({
                width: thumbWidth,
                height: labelHeight,
                title: `#${item.componentIndex}  ${item.pixelCount.toLocaleString()} px`,
                subtitle: `${item.bbox.width}x${item.bbox.height}`,
            }),
            left,
            top: top + thumbHeight,
        });
    }

    const outputPath = path.join(atlasOutputRoot, `${textureName}_contact_sheet.png`);
    await sharp({
        create: {
            width: sheetWidth,
            height: sheetHeight,
            channels: 4,
            background: { r: 252, g: 247, b: 240, alpha: 1 },
        },
    })
        .composite(composites)
        .png()
        .toFile(outputPath);

    return outputPath;
};

const main = async () => {
    const outputs = [];
    for (const textureName of textures) {
        outputs.push(await buildSheet(textureName));
    }

    console.log(outputs.join('\n'));
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
