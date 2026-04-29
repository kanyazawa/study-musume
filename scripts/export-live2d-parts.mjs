import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import vm from 'node:vm';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const debugPort = 9350;
const serverPort = 4182;
const outputDir = path.join(repoRoot, 'output', 'live2d-parts', 'witch');
const tempDir = path.join(repoRoot, 'tmp', 'live2d-part-export');
const tempHtmlPath = path.join(tempDir, 'index.html');
const profileDir = path.join(tempDir, 'edge-profile');

const modelRoot = path.join(repoRoot, 'public', 'live2d', 'models', 'free-witch', '魔女');
const modelName = '魔女';
const modelId = 'export_model';
const modelResourcesPath = '/public/live2d/models/free-witch/';
const canvasWidth = 1800;
const canvasHeight = 2400;

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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const safeName = (value = '') =>
    String(value)
        .normalize('NFKD')
        .replace(/[^\w.-]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase();

const createStaticServer = (rootDir) => new Promise((resolve, reject) => {
    const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.css': 'text/css; charset=utf-8',
        '.moc3': 'application/octet-stream',
    };

    const server = http.createServer(async (req, res) => {
        try {
            const requested = decodeURIComponent((req.url || '/').split('?')[0] || '/');
            const relativePath = requested === '/' ? '/tmp/live2d-part-export/index.html' : requested;
            const absolutePath = path.join(rootDir, relativePath.replace(/^\/+/, ''));
            const normalized = path.normalize(absolutePath);

            if (!normalized.startsWith(rootDir)) {
                res.writeHead(403);
                res.end('Forbidden');
                return;
            }

            const content = await fs.readFile(normalized);
            const ext = path.extname(normalized).toLowerCase();
            res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
            res.end(content);
        } catch {
            res.writeHead(404);
            res.end('Not Found');
        }
    });

    server.on('error', reject);
    server.listen(serverPort, '127.0.0.1', () => resolve(server));
});

const getJson = (url) => new Promise((resolve, reject) => {
    http.get(url, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            body += chunk;
        });
        res.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
    }).on('error', reject);
});

const requestText = (url) => new Promise((resolve, reject) => {
    const req = http.request(url, { method: 'PUT' }, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            body += chunk;
        });
        res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.end();
});

const waitForDebug = async () => {
    for (let index = 0; index < 80; index += 1) {
        try {
            return await getJson(`http://127.0.0.1:${debugPort}/json/version`);
        } catch {
            await delay(100);
        }
    }
    throw new Error('Edge remote debugging endpoint did not start.');
};

const tryGetDebugVersion = async () => {
    try {
        return await getJson(`http://127.0.0.1:${debugPort}/json/version`);
    } catch {
        return null;
    }
};

const startEdge = (userDataDir) => new Promise((resolve, reject) => {
    const command = [
        `Start-Process '${edgePath.replace(/'/g, "''")}'`,
        '-ArgumentList',
        [
            "'--headless=new'",
            "'--disable-gpu'",
            "'--no-first-run'",
            "'--no-default-browser-check'",
            `'--remote-debugging-port=${debugPort}'`,
            `'--user-data-dir=${userDataDir.replace(/'/g, "''")}'`,
            "'about:blank'",
        ].join(','),
    ].join(' ');

    const shell = spawn('powershell.exe', ['-NoProfile', '-Command', command], {
        cwd: repoRoot,
        stdio: 'ignore',
        windowsHide: true,
    });

    shell.once('error', reject);
    shell.once('exit', (code) => {
        if (code === 0) {
            resolve();
            return;
        }
        reject(new Error(`Failed to start Edge (PowerShell exit code ${code ?? 'unknown'}).`));
    });
});

const connectToPage = (wsUrl) => new Promise((resolve, reject) => {
    const WebSocket = globalThis.WebSocket || require('ws');
    const ws = new WebSocket(wsUrl);
    let messageId = 0;
    const pending = new Map();

    const send = (method, params = {}) => new Promise((res, rej) => {
        messageId += 1;
        pending.set(messageId, { res, rej });
        ws.send(JSON.stringify({ id: messageId, method, params }));
    });

    ws.addEventListener('open', () => resolve({ ws, send }));
    ws.addEventListener('error', reject);
    ws.addEventListener('message', ({ data }) => {
        const payload = JSON.parse(data);
        if (!payload.id || !pending.has(payload.id)) {
            return;
        }
        const callbacks = pending.get(payload.id);
        pending.delete(payload.id);
        if (payload.error) {
            callbacks.rej(new Error(payload.error.message));
            return;
        }
        callbacks.res(payload.result);
    });
});

const createHtml = () => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Live2D Part Export</title>
  <style>
    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      overflow: hidden;
    }
    body {
      display: grid;
      place-items: center;
    }
    canvas {
      width: ${Math.round(canvasWidth / 2)}px;
      height: ${Math.round(canvasHeight / 2)}px;
      background: transparent;
    }
  </style>
</head>
<body>
  <canvas id="live2d_canvas_tyrano" width="${canvasWidth}" height="${canvasHeight}"></canvas>
  <script src="/public/live2d/sdk/tyrano/polyfill.min.js"></script>
  <script src="/public/live2d/sdk/cubism-5-r.4/Core/live2dcubismcore.min.js"></script>
  <script>
    window.tyranolive2dplugin = window.tyranolive2dplugin || {};
  </script>
  <script src="/public/live2d/sdk/tyrano/driver-index.js"></script>
  <script>
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const canvas = document.getElementById('live2d_canvas_tyrano');
    const state = {
      ready: false,
      error: '',
    };
    window.__partExporter = state;

    const getManager = () => window.tyranolive2dplugin.getTyranoManager();

    const getActiveLappModel = () => {
      const manager = getManager();
      const meta = manager.models['${modelId}'];
      if (!meta) {
        return null;
      }
      return manager.lappdelegate?.lapplive2dmanager?.getModel(meta.index) || null;
    };

    const getCubismModel = () => getActiveLappModel()?._model || null;
    const renderNow = () => {
      const manager = getManager();
      try {
        manager.lappdelegate?.getView?.()?.render?.();
        return;
      } catch {}
      try {
        manager.lappdelegate?._view?.render?.();
      } catch {}
    };

    const getPartIds = (model) => {
      const ids = model?._partIds;
      const result = [];
      if (!ids) {
        return result;
      }
      if (typeof ids.getSize === 'function' && typeof ids.at === 'function') {
        for (let index = 0; index < ids.getSize(); index += 1) {
          const value = ids.at(index);
          result.push(value?.getString?.() || value?.s || value?._id?.s || '');
        }
        return result;
      }
      return result;
    };

    const resolvePartIndex = (model, targetId) => {
      const ids = getPartIds(model);
      return ids.indexOf(targetId);
    };

    const setPartOpacity = (model, partId, opacity) => {
      const nextOpacity = Math.max(0, Math.min(1, opacity));
      const manager = window.Live2DCubismFramework?.CubismFramework?.getIdManager?.();
      const cubismId = manager?.getId?.(partId);

      try {
        if (cubismId && typeof model.setPartOpacityById === 'function') {
          model.setPartOpacityById(cubismId, nextOpacity);
          return;
        }
      } catch {}

      const index = resolvePartIndex(model, partId);
      if (index < 0) {
        return;
      }

      try {
        if (typeof model.setPartOpacityByIndex === 'function') {
          model.setPartOpacityByIndex(index, nextOpacity);
          return;
        }
      } catch {}

      if (model._partOpacities && typeof model._partOpacities[index] !== 'undefined') {
        model._partOpacities[index] = nextOpacity;
      }
    };

    const forceStaticPose = () => {
      const lappModel = getActiveLappModel();
      if (!lappModel) {
        return;
      }

      lappModel.pm.idle = '__none__';
      lappModel.pm.breath = 'false';
      lappModel.pm.blink = 'false';
      lappModel.pm.lip = 'false';
      lappModel._eyeBlink = null;
      lappModel._breath = null;
      try {
        lappModel._motionManager?.stopAllMotions?.();
        lappModel._expressionManager?.stopAllMotions?.();
      } catch {}
    };

    state.captureDefault = async () => {
      const model = getCubismModel();
      if (!model) {
        throw new Error('Cubism model is not ready.');
      }

      forceStaticPose();
      const ids = getPartIds(model);
      ids.forEach((partId) => setPartOpacity(model, partId, 1));
      for (let index = 0; index < 4; index += 1) {
        renderNow();
        await wait(40);
      }
      return true;
    };

    state.captureParts = async (partIds) => {
      const model = getCubismModel();
      if (!model) {
        throw new Error('Cubism model is not ready.');
      }

      forceStaticPose();
      const allPartIds = getPartIds(model);
      const visible = new Set(partIds);
      allPartIds.forEach((partId) => setPartOpacity(model, partId, visible.has(partId) ? 1 : 0));

      for (let index = 0; index < 4; index += 1) {
        renderNow();
        await wait(40);
      }
      return true;
    };

    (async () => {
      try {
        const manager = getManager();
        manager.setResourcesPath('${modelResourcesPath}');
        manager.addModel({
          name: '${modelId}',
          model_id: '${modelName}',
          idle: 'Idle',
          visible: 'true',
          breath: 'false',
          blink: 'false',
          lip: 'false',
          x: '0',
          y: '-0.8',
          scale: '8.5',
        });

        for (let attempt = 0; attempt < 240; attempt += 1) {
          const lappModel = getActiveLappModel();
          if (lappModel?._state === 22 && lappModel?._model) {
            forceStaticPose();
            state.ready = true;
            return;
          }
          await wait(100);
        }

        state.error = 'Timed out while waiting for the model to load.';
      } catch (error) {
        state.error = error?.message || String(error);
      }
    })();
  </script>
</body>
</html>
`;

const ensureTempHtml = async () => {
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(tempHtmlPath, createHtml(), 'utf8');
};

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
        const handleReady = () => {
            clearTimeout(timeout);
            resolve();
        };

        const emModule = sandbox.module?.exports;
        if (typeof emModule?.then === 'function') {
            emModule.then(handleReady);
            return;
        }

        setTimeout(handleReady, 0);
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

    if (!moc) {
        throw new Error('Failed to read the Live2D moc3 file.');
    }

    const model = core.Model.fromMoc(moc);
    if (!model) {
        throw new Error('Failed to initialize the Live2D model from moc3.');
    }

    const parts = model.parts.ids.map((id, index) => ({
        id,
        index,
        name: nameById.get(id) || id,
        parentIndex: Number(model.parts.parentIndices[index] ?? -1),
    }));

    model.release();
    moc._release();

    const childrenById = new Map(parts.map((part) => [part.id, []]));
    parts.forEach((part) => {
        if (part.parentIndex >= 0 && parts[part.parentIndex]) {
            childrenById.get(parts[part.parentIndex].id)?.push(part.id);
        }
    });

    const partById = new Map(parts.map((part) => [part.id, part]));

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

    return { parts, partById, collectSubtree, collectAncestors };
};

const ensureOutputDirs = async () => {
    await fs.mkdir(path.join(outputDir, 'parts'), { recursive: true });
};

const decodeBase64Png = (base64Value) => Buffer.from(base64Value, 'base64');

const trimAndSavePng = async (inputBuffer, outputPath) => {
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
        throw new Error('Could not inspect the PNG size.');
    }

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
        return { width: metadata.width, height: metadata.height, blank: true };
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

    return { width, height, blank: false };
};

const saveManifest = async (manifest) => {
    await fs.writeFile(
        path.join(outputDir, 'part-manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf8',
    );
};

const main = async () => {
    if (!existsSync(edgePath)) {
        throw new Error(`Microsoft Edge was not found at ${edgePath}`);
    }

    await ensureOutputDirs();
    await ensureTempHtml();

    const metadata = await loadPartMetadata();
    const manifest = {
        generatedAt: new Date().toISOString(),
        model: modelName,
        outputDir,
        captures: [],
    };

    const server = await createStaticServer(repoRoot);
    await fs.rm(profileDir, { recursive: true, force: true });
    await fs.mkdir(profileDir, { recursive: true });

    try {
        let browserVersion = await tryGetDebugVersion();
        if (!browserVersion) {
            await startEdge(profileDir);
            browserVersion = await waitForDebug();
        }
        const target = JSON.parse(await requestText(`http://127.0.0.1:${debugPort}/json/new?about:blank`));
        const page = await connectToPage(target.webSocketDebuggerUrl);

        await page.send('Runtime.enable');
        await page.send('Page.enable');
        await page.send('Emulation.setDeviceMetricsOverride', {
            width: Math.round(canvasWidth / 2),
            height: Math.round(canvasHeight / 2),
            deviceScaleFactor: 1,
            mobile: false,
        });
        await page.send('Emulation.setDefaultBackgroundColorOverride', {
            color: { r: 0, g: 0, b: 0, a: 0 },
        });

        await page.send('Page.navigate', { url: `http://127.0.0.1:${serverPort}/` });
        await delay(2500);

        const readyResult = await page.send('Runtime.evaluate', {
            expression: `
                (async () => {
                  for (let index = 0; index < 240; index += 1) {
                    if (window.__partExporter?.ready) {
                      return { ready: true, error: '' };
                    }
                    if (window.__partExporter?.error) {
                      return { ready: false, error: window.__partExporter.error };
                    }
                    await new Promise((resolve) => setTimeout(resolve, 100));
                  }
                  return { ready: false, error: 'Timed out while waiting in the page.' };
                })();
            `,
            awaitPromise: true,
            returnByValue: true,
        });

        const readyPayload = readyResult.result?.value;
        if (!readyPayload?.ready) {
            throw new Error(readyPayload?.error || 'The export page did not become ready.');
        }

        await page.send('Runtime.evaluate', {
            expression: `window.__partExporter.captureDefault()`,
            awaitPromise: true,
            returnByValue: true,
        });
        const fullScreenshot = await page.send('Page.captureScreenshot', {
            format: 'png',
            fromSurface: true,
            captureBeyondViewport: false,
        });
        const fullOutputPath = path.join(outputDir, 'full.png');
        const fullStats = await trimAndSavePng(decodeBase64Png(fullScreenshot.data), fullOutputPath);
        manifest.captures.push({
            slug: 'full',
            label: 'Full Model',
            file: fullOutputPath,
            size: fullStats,
            partIds: [],
            partNames: [],
        });

        for (const targetConfig of EXPORT_TARGETS) {
            const visiblePartIds = new Set();
            for (const partId of targetConfig.partIds) {
                metadata.collectSubtree(partId).forEach((id) => visiblePartIds.add(id));
                metadata.collectAncestors(partId).forEach((id) => visiblePartIds.add(id));
            }

            const serializedIds = JSON.stringify(Array.from(visiblePartIds));
            await page.send('Runtime.evaluate', {
                expression: `window.__partExporter.captureParts(${serializedIds})`,
                awaitPromise: true,
                returnByValue: true,
            });
            const screenshot = await page.send('Page.captureScreenshot', {
                format: 'png',
                fromSurface: true,
                captureBeyondViewport: false,
            });

            const fileName = `${targetConfig.slug}.png`;
            const outputPath = path.join(outputDir, 'parts', fileName);
            const stats = await trimAndSavePng(decodeBase64Png(screenshot.data), outputPath);

            manifest.captures.push({
                slug: targetConfig.slug,
                label: targetConfig.label,
                file: outputPath,
                size: stats,
                partIds: Array.from(visiblePartIds),
                partNames: Array.from(visiblePartIds).map((id) => metadata.partById.get(id)?.name || id),
                roots: targetConfig.partIds,
            });
        }

        await saveManifest(manifest);
        page.ws.close();

        if (browserVersion?.webSocketDebuggerUrl) {
            const browser = await connectToPage(browserVersion.webSocketDebuggerUrl);
            try {
                await browser.send('Browser.close');
            } catch {
                // Ignore shutdown races.
            }
            browser.ws.close();
        }
    } finally {
        server.close();
    }

    console.log(`Saved Live2D part exports to ${outputDir}`);
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
