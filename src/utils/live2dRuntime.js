import { Capacitor } from '@capacitor/core';

const scriptLoadCache = new Map();
const assetProbeCache = new Map();
const TYRANO_CANVAS_ID = 'live2d_canvas_tyrano';

const TYRANO_RUNTIME = 'tyrano-v4';

/**
 * Live2D canvas のホストを、まずキャラのステージ近辺に寄せて決める。
 * ここを .mobile-content 直下に置くと、ホーム内 UI とは別レイヤーになって
 * ボタンより前に見えることがあるため、可能ならローカルなステージ配下へ載せる。
 */
const getLive2dCanvasHost = (container) =>
    container?.closest('.character-touch-target')
    || container?.parentElement
    || document.querySelector('.mobile-content')
    || document.getElementById('root')
    || document.body;

const getAbsoluteUrl = (url) => {
    try {
        return new URL(url, window.location.origin).toString();
    } catch {
        return url;
    }
};

export const probeAssetUrl = async (url) => {
    if (!url) {
        return { ok: false, status: 0 };
    }

    const absoluteUrl = getAbsoluteUrl(url);
    if (assetProbeCache.has(absoluteUrl)) {
        return assetProbeCache.get(absoluteUrl);
    }

    const probePromise = (async () => {
        try {
            const response = await fetch(absoluteUrl, { method: 'HEAD' });
            if (response.ok) {
                return { ok: true, status: response.status };
            }
        } catch {
            // Some static servers do not support HEAD. We retry with GET below.
        }

        try {
            const response = await fetch(absoluteUrl, { method: 'GET' });
            return { ok: response.ok, status: response.status };
        } catch {
            return { ok: false, status: 0 };
        }
    })();

    assetProbeCache.set(absoluteUrl, probePromise);
    return probePromise;
};

export const loadExternalScript = (url) => {
    if (!url) {
        return Promise.reject(new Error('Script URL is required.'));
    }

    const absoluteUrl = getAbsoluteUrl(url);
    if (scriptLoadCache.has(absoluteUrl)) {
        return scriptLoadCache.get(absoluteUrl);
    }

    const promise = new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[data-live2d-script="${absoluteUrl}"]`);
        if (existing?.dataset.loaded === 'true') {
            resolve();
            return;
        }

        const script = existing || document.createElement('script');
        script.src = absoluteUrl;
        script.async = true;
        script.dataset.live2dScript = absoluteUrl;

        const handleLoad = () => {
            script.dataset.loaded = 'true';
            resolve();
        };

        const handleError = () => {
            scriptLoadCache.delete(absoluteUrl);
            reject(new Error(`Failed to load script: ${absoluteUrl}`));
        };

        script.addEventListener('load', handleLoad, { once: true });
        script.addEventListener('error', handleError, { once: true });

        if (!existing) {
            document.body.appendChild(script);
        }
    });

    scriptLoadCache.set(absoluteUrl, promise);
    return promise;
};

export const ensureLive2DSdk = async (sdkScripts = []) => {
    for (const scriptUrl of sdkScripts) {
        await loadExternalScript(scriptUrl);
    }
};

const ensureTyranoGlobal = () => {
    if (typeof window === 'undefined') {
        return;
    }

    if (!window.tyranolive2dplugin) {
        window.tyranolive2dplugin = {};
    }
};

export const mountTyranoCanvas = (container) => {
    if (!container) {
        return null;
    }

    // SDK は document.getElementById(TYRANO_CANVAS_ID) で canvas を探す。
    // 可能ならキャラステージ配下に載せ、ホーム内 UI と同じ重なり順で扱う。
    const host = getLive2dCanvasHost(container);
    let canvas = document.getElementById(TYRANO_CANVAS_ID);
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = TYRANO_CANVAS_ID;
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '1';
        host.appendChild(canvas);
    } else if (canvas.parentElement !== host) {
        host.appendChild(canvas);
    }

    // container 位置に合わせて canvas を重ねる
    canvas._tyranoContainer = container;
    canvas.style.display = 'block';

    return canvas;
};

export const resizeTyranoCanvas = (canvas, container) => {
    if (!canvas || !container) {
        return;
    }

    const rect = container.getBoundingClientRect();
    const host = canvas.parentElement || document.body;
    const hostRect = host.getBoundingClientRect();
    const useViewportFixed = host === document.body;

    // 内部的な描画解像度（アスペクト比）は固定し、画面の縦横比が変わっても
    // Live2Dのプロジェクション（座標系）が崩れてキャラがずれないようにする
    const isNativePlatform = Capacitor.isNativePlatform();
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, isNativePlatform ? 1 : 2));
    const targetCanvasWidth = isNativePlatform
        ? Math.max(480, Math.min(720, Math.round(rect.width * dpr)))
        : 1000 * dpr;
    const targetCanvasHeight = isNativePlatform
        ? Math.max(900, Math.min(1280, Math.round(rect.height * dpr)))
        : 2000 * dpr;

    if (canvas.width !== targetCanvasWidth || canvas.height !== targetCanvasHeight) {
        canvas.width = targetCanvasWidth;
        canvas.height = targetCanvasHeight;
        canvas.setAttribute('data-resolution-set', 'true');
    }

    canvas.style.width = `${Math.max(1, Math.round(rect.width))}px`;
    canvas.style.height = `${Math.max(1, Math.round(rect.height))}px`;

    if (useViewportFixed) {
        // フォールバック: ホストが取れない環境では従来どおり viewport 固定
        canvas.style.position = 'fixed';
        canvas.style.left = `${Math.round(rect.left)}px`;
        canvas.style.top = `${Math.round(rect.top)}px`;
    } else {
        // .mobile-content は position: relative。スクロール時も追従するよう host の scroll を加算
        canvas.style.position = 'absolute';
        canvas.style.left = `${Math.round(rect.left - hostRect.left + host.scrollLeft)}px`;
        canvas.style.top = `${Math.round(rect.top - hostRect.top + host.scrollTop)}px`;
    }
    canvas.style.objectFit = 'cover';
    canvas.style.objectPosition = 'center center';
};



// SDK マネージャーを window レベルでキャッシュ（HMR でもリセットされない）
const TYRANO_MANAGER_CACHE_KEY = '__tyranolive2d_manager_instance__';

export const ensureTyranoManager = async ({ sdkScripts = [], resourcesPath = '', canvas = null } = {}) => {
    ensureTyranoGlobal();
    await ensureLive2DSdk(sdkScripts);

    // window レベルでキャッシュされた既存マネージャーがあれば再利用する（HMR 対策）
    const cached = window[TYRANO_MANAGER_CACHE_KEY];
    if (cached) {
        if (resourcesPath && typeof cached.setResourcesPath === 'function') {
            cached.setResourcesPath(resourcesPath);
        }
        return cached;
    }

    // canvas が DOM に存在することを保証してから SDK を初期化する
    if (canvas && !document.getElementById(TYRANO_CANVAS_ID)) {
        if (!canvas.parentElement) {
            document.body.appendChild(canvas);
        }
    }

    const plugin = window.tyranolive2dplugin;
    if (!plugin?.getTyranoManager) {
        throw new Error('Tyrano Live2D runtime is not available.');
    }

    const manager = plugin.getTyranoManager();
    if (!manager) {
        throw new Error('Failed to create Tyrano Live2D manager.');
    }

    // window キャッシュに保存（HMR 後も再利用される）
    window[TYRANO_MANAGER_CACHE_KEY] = manager;

    if (resourcesPath && typeof manager.setResourcesPath === 'function') {
        manager.setResourcesPath(resourcesPath);
    }

    return manager;
};




export const destroyTyranoManager = () => {
    if (typeof window === 'undefined') {
        return;
    }

    // SDK のリリースは行わない（再初期化でシングルトンが壊れるため）
    // canvas は body レベルで永続管理するため削除せず非表示にする
    const canvas = document.getElementById(TYRANO_CANVAS_ID);
    if (canvas) {
        canvas.style.display = 'none';
    }
};

export const clearTyranoModels = (manager) => {
    if (!manager) return;

    if (manager.models) {
        manager.models = {};
    }

    const live2dManager = manager.lappdelegate?.lapplive2dmanager;
    if (live2dManager && Array.isArray(live2dManager._models)) {
        live2dManager._models.forEach(model => {
            if (model && typeof model.release === 'function') {
                try {
                    model.release();
                } catch (e) {
                    console.warn("Failed to release Live2D model", e);
                }
            } else if (model && typeof model.releaseModel === 'function') {
                try {
                    model.releaseModel();
                } catch {
                    // Ignore teardown errors from partially loaded models.
                }
            }
        });
        live2dManager._models = [];
    }
};



export const hideOldTyranoModels = (manager) => {
    if (!manager) return;

    if (manager.models) {
        manager.models = {};
    }

    const live2dManager = manager.lappdelegate?.lapplive2dmanager;
    if (!live2dManager || !live2dManager._models) return;

    const models = live2dManager._models;
    const isCsmVector = typeof models.getSize === 'function' && typeof models.at === 'function';
    const count = isCsmVector ? models.getSize() : (models.length || 0);

    for (let i = 0; i < count; i++) {
        const model = isCsmVector ? models.at(i) : models[i];
        if (model && model._modelMatrix) {
            // スケールを0にして画面から物理的に消す（不透明度やクリア処理の代わり）
            if (typeof model._modelMatrix.scale === 'function') {
                model._modelMatrix.scale(0, 0);
            }
        }
    }
};

export const resolveLive2DStatusMessage = (status, detail) => {
    switch (status) {
        case 'missing-config':
            return 'Live2Dモデル設定がありません。';
        case 'checking':
            return 'Live2Dアセットを確認中...';
        case 'loading-model':
            return 'Live2Dモデルを読み込み中...';
        case 'missing-model':
            return 'model3.json が見つかりません。';
        case 'missing-sdk':
            return 'SDKスクリプトが見つかりません。';
        case 'sdk-load-failed':
            return detail || 'SDKの読み込みに失敗しました。';
        case 'init-failed':
            return detail || 'Live2Dの初期化に失敗しました。';
        case 'ready':
            return 'Live2Dアセット準備完了。';
        default:
            return 'Live2Dの状態を確認できませんでした。';
    }
};

const TYRANO_MODEL_STATE_LABELS = {
    0: 'LoadAssets',
    1: 'LoadModel',
    2: 'WaitLoadModel',
    3: 'LoadExpression',
    4: 'WaitLoadExpression',
    5: 'LoadPhysics',
    6: 'WaitLoadPhysics',
    7: 'LoadPose',
    8: 'WaitLoadPose',
    9: 'SetupEyeBlink',
    10: 'SetupBreath',
    11: 'LoadUserData',
    12: 'WaitLoadUserData',
    13: 'SetupEyeBlinkIds',
    14: 'SetupLipSyncIds',
    15: 'SetupLayout',
    16: 'LoadMotion',
    17: 'WaitLoadMotion',
    18: 'CompleteInitialize',
    19: 'CompleteSetupModel',
    20: 'LoadTexture',
    21: 'WaitLoadTexture',
    22: 'CompleteSetup',
};

export const getTyranoManagerSnapshot = (manager, modelName) => {
    if (!manager) {
        return null;
    }

    const modelMeta = manager.models?.[modelName];
    const canvas = manager.lappdelegate?.canvas;
    const model =
        typeof modelMeta?.index === 'number'
            ? manager.lappdelegate?.lapplive2dmanager?.getModel(modelMeta.index)
            : null;

    return {
        hasGl: Boolean(manager.lappdelegate?.gl),
        canvasWidth: canvas?.width || 0,
        canvasHeight: canvas?.height || 0,
        modelState: typeof model?._state === 'number' ? model._state : null,
        modelStateLabel:
            typeof model?._state === 'number'
                ? (TYRANO_MODEL_STATE_LABELS[model._state] || `State${model._state}`)
                : 'missing-model',
        hasModel: Boolean(model),
        isInitialized: Boolean(model?._initialized),
        isUpdating: Boolean(model?._updating),
    };
};

export { TYRANO_CANVAS_ID, TYRANO_RUNTIME };
