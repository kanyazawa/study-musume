import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const debugPort = 9350;
const pageWsUrl = `ws://127.0.0.1:${debugPort}/devtools/page/849A816D1EAF13FC4833732D8C3105B2`;
const outputDir = path.join(repoRoot, 'output', 'live2d-parts', 'witch');
const modelRoot = path.join(repoRoot, 'public', 'live2d', 'models', 'free-witch', '魔女');

const EXPORT_TARGETS = [
    { slug: 'hat', label: 'Hat', partIds: ['Part42'] },
    { slug: 'earrings', label: 'Earrings', partIds: ['Part47'] },
    { slug: 'bangs', label: 'Bangs', partIds: ['Part54'] },
    { slug: 'bang_bow', label: 'Bang Bow', partIds: ['Part55'] },
    { slug: 'face', label: 'Face', partIds: ['Part94'] },
    { slug: 'left_eye', label: 'Left Eye', partIds: ['Part91'] },
    { slug: 'right_eye', label: 'Right Eye', partIds: ['Part90'] },
    { slug: 'mouth', label: 'Mouth', partIds: ['Part92'] },
    { slug: 'glasses', label: 'Glasses', partIds: ['Part53'] },
    { slug: 'angry_overlay', label: 'Angry Overlay', partIds: ['Part63'] },
    { slug: 'tear_overlay', label: 'Tear Overlay', partIds: ['Part64'] },
    { slug: 'heart_eyes_overlay', label: 'Heart Eyes Overlay', partIds: ['Part67'] },
    { slug: 'star_eyes_overlay', label: 'Star Eyes Overlay', partIds: ['Part68'] },
    { slug: 'braid', label: 'Braid', partIds: ['Part51'] },
    { slug: 'back_hair', label: 'Back Hair', partIds: ['Part139'] },
    { slug: 'short_hair', label: 'Short Hair', partIds: ['Part140'] },
    { slug: 'long_hair', label: 'Long Hair', partIds: ['Part145'] },
    { slug: 'upper_body', label: 'Upper Body', partIds: ['Part97'] },
    { slug: 'waist_decor', label: 'Waist Decor', partIds: ['Part96'] },
    { slug: 'lower_body', label: 'Lower Body', partIds: ['Part117'] },
    { slug: 'staff', label: 'Staff', partIds: ['Part84'] },
    { slug: 'ghost_fire', label: 'Ghost Fire', partIds: ['Part85'] },
    { slug: 'small_ghost', label: 'Small Ghost', partIds: ['Part2'] },
    { slug: 'pendant', label: 'Pendant', partIds: ['Part88'] },
];

const connectToPage = (wsUrl) => new Promise((resolve, reject) => {
    const WebSocketImpl = globalThis.WebSocket || require('ws');
    const ws = new WebSocketImpl(wsUrl);
    let id = 0;
    const pending = new Map();

    const send = (method, params = {}) => new Promise((res, rej) => {
        id += 1;
        pending.set(id, { res, rej });
        ws.send(JSON.stringify({ id, method, params }));
    });

    ws.addEventListener('open', () => resolve({ ws, send }));
    ws.addEventListener('error', reject);
    ws.addEventListener('message', ({ data }) => {
        const message = JSON.parse(data);
        if (!message.id || !pending.has(message.id)) {
            return;
        }
        const callbacks = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) {
            callbacks.rej(new Error(message.error.message));
            return;
        }
        callbacks.res(message.result);
    });
});

const loadCubismCore = async () => {
    const corePath = path.join(repoRoot, 'public', 'live2d', 'sdk', 'tyrano', 'live2dcubismcore.min.js');
    const source = await fs.readFile(corePath, 'utf8');
    const atob = (value) => Buffer.from(value, 'base64').toString('binary');
    const sandbox = {
        console,
        process,
        require,
        __dirname: path.dirname(corePath),
        __filename: corePath,
        Buffer,
        TextDecoder,
        setTimeout,
        clearTimeout,
        atob,
        global: {},
        globalThis: {},
        module: { exports: {} },
        exports: {},
    };
    sandbox.global = sandbox;
    sandbox.globalThis = sandbox;
    vm.runInNewContext(source, sandbox, { filename: corePath });
    const core = sandbox.Live2DCubismCore || sandbox.module.exports || {};

    await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timed out while initializing Live2D core.')), 10000);
        const emModule = sandbox.module?.exports;
        if (typeof emModule?.then === 'function') {
            emModule.then(() => {
                clearTimeout(timeout);
                resolve();
            });
            return;
        }
        clearTimeout(timeout);
        resolve();
    });

    return core;
};

const loadPartMetadata = async () => {
    const cdiPath = path.join(modelRoot, '魔女.cdi3.json');
    const cdi = JSON.parse(await fs.readFile(cdiPath, 'utf8'));
    const nameById = new Map((cdi.Parts || []).map((entry) => [entry.Id, entry.Name]));

    const core = await loadCubismCore();
    const mocBuffer = await fs.readFile(path.join(modelRoot, '魔女.moc3'));
    const moc = core.Moc.fromArrayBuffer(mocBuffer.buffer.slice(
        mocBuffer.byteOffset,
        mocBuffer.byteOffset + mocBuffer.byteLength,
    ));
    const model = core.Model.fromMoc(moc);

    const parts = model.parts.ids.map((id, index) => ({
        id,
        index,
        name: nameById.get(id) || id,
        parentIndex: Number(model.parts.parentIndices[index] ?? -1),
    }));

    model.release();
    moc._release();

    const partById = new Map(parts.map((part) => [part.id, part]));
    const childrenById = new Map(parts.map((part) => [part.id, []]));
    parts.forEach((part) => {
        if (part.parentIndex >= 0 && parts[part.parentIndex]) {
            childrenById.get(parts[part.parentIndex].id)?.push(part.id);
        }
    });

    const collectSubtree = (rootId) => {
        const visited = new Set();
        const queue = [rootId];
        while (queue.length > 0) {
            const currentId = queue.shift();
            if (!currentId || visited.has(currentId)) {
                continue;
            }
            visited.add(currentId);
            (childrenById.get(currentId) || []).forEach((childId) => queue.push(childId));
        }
        return visited;
    };

    const collectAncestors = (id) => {
        const visited = new Set();
        let current = partById.get(id);
        while (current && current.parentIndex >= 0 && parts[current.parentIndex]) {
            const parent = parts[current.parentIndex];
            if (visited.has(parent.id)) {
                break;
            }
            visited.add(parent.id);
            current = parent;
        }
        return visited;
    };

    return { partById, collectSubtree, collectAncestors };
};

const trimAndSavePng = async (inputBuffer, outputPath) => {
    const image = sharp(inputBuffer);
    const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let minX = info.width;
    let minY = info.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < info.height; y += 1) {
        for (let x = 0; x < info.width; x += 1) {
            const alpha = data[((y * info.width) + x) * info.channels + 3];
            if (alpha === 0) {
                continue;
            }
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
    }

    if (maxX < minX || maxY < minY) {
        await fs.writeFile(outputPath, inputBuffer);
        return { blank: true, width: info.width, height: info.height };
    }

    const padding = 20;
    const left = Math.max(0, minX - padding);
    const top = Math.max(0, minY - padding);
    const width = Math.min(info.width - left, (maxX - minX + 1) + (padding * 2));
    const height = Math.min(info.height - top, (maxY - minY + 1) + (padding * 2));

    await sharp(inputBuffer)
        .extract({ left, top, width, height })
        .png()
        .toFile(outputPath);

    return { blank: false, width, height };
};

const main = async () => {
    await fs.mkdir(path.join(outputDir, 'parts'), { recursive: true });
    const metadata = await loadPartMetadata();
    const page = await connectToPage(pageWsUrl);
    const manifest = [];

    try {
        await page.send('Runtime.enable');
        await page.send('Page.enable');
        await page.send('Emulation.setDefaultBackgroundColorOverride', {
            color: { r: 0, g: 0, b: 0, a: 0 },
        });

        const state = await page.send('Runtime.evaluate', {
            expression: 'JSON.stringify(window.__partExporter)',
            returnByValue: true,
        });
        console.log(`page_state=${state.result.value}`);

        console.log('capture_default:start');
        await page.send('Runtime.evaluate', {
            expression: 'window.__partExporter.captureDefault()',
            awaitPromise: true,
            returnByValue: true,
        });
        console.log('capture_default:done');
        console.log('screenshot_full:start');
        const fullShot = await page.send('Page.captureScreenshot', {
            format: 'png',
            fromSurface: true,
            captureBeyondViewport: false,
        });
        console.log(`screenshot_full:done bytes=${fullShot.data.length}`);
        console.log('trim_full:start');
        const fullStats = await trimAndSavePng(Buffer.from(fullShot.data, 'base64'), path.join(outputDir, 'full.png'));
        console.log('trim_full:done');
        manifest.push({ slug: 'full', file: path.join(outputDir, 'full.png'), size: fullStats });
        console.log('saved full.png');

        for (const target of EXPORT_TARGETS) {
            const visiblePartIds = new Set();
            for (const partId of target.partIds) {
                metadata.collectSubtree(partId).forEach((id) => visiblePartIds.add(id));
                metadata.collectAncestors(partId).forEach((id) => visiblePartIds.add(id));
            }

            console.log(`capture_${target.slug}:start`);
            await page.send('Runtime.evaluate', {
                expression: `window.__partExporter.captureParts(${JSON.stringify(Array.from(visiblePartIds))})`,
                awaitPromise: true,
                returnByValue: true,
            });
            console.log(`capture_${target.slug}:done`);
            console.log(`screenshot_${target.slug}:start`);
            const screenshot = await page.send('Page.captureScreenshot', {
                format: 'png',
                fromSurface: true,
                captureBeyondViewport: false,
            });
            console.log(`screenshot_${target.slug}:done bytes=${screenshot.data.length}`);
            const outputPath = path.join(outputDir, 'parts', `${target.slug}.png`);
            console.log(`trim_${target.slug}:start`);
            const stats = await trimAndSavePng(Buffer.from(screenshot.data, 'base64'), outputPath);
            console.log(`trim_${target.slug}:done`);
            manifest.push({
                slug: target.slug,
                file: outputPath,
                size: stats,
                roots: target.partIds,
                names: Array.from(visiblePartIds).map((id) => metadata.partById.get(id)?.name || id),
            });
            console.log(`saved ${target.slug}.png`);
        }

        await fs.writeFile(path.join(outputDir, 'part-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
        console.log('saved manifest');
    } finally {
        page.ws.close();
    }
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
