const scriptLoadCache = new Map();
const TYRANO_CANVAS_ID = 'live2d_canvas_tyrano';

const TYRANO_RUNTIME = 'tyrano-v4';

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

    // SDK は document.getElementById(TYRANO_CANVAS_ID) で canvas を探すため
    // React コンポーネントツリーの外（body直下）で管理し、クリーンアップで
    // 削除されないようにする。CSS で container に重ねて表示する。
    let canvas = document.getElementById(TYRANO_CANVAS_ID);
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = TYRANO_CANVAS_ID;
        canvas.style.position = 'fixed';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '1';
        document.body.appendChild(canvas);
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

    // 内部的な描画解像度（アスペクト比）は固定し、画面の縦横比が変わっても
    // Live2Dのプロジェクション（座標系）が崩れてキャラがずれないようにする
    if (!canvas.getAttribute('data-resolution-set')) {
        const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
        canvas.width = 1000 * dpr;
        canvas.height = 2000 * dpr;
        canvas.setAttribute('data-resolution-set', 'true');
    }

    // CSSでコンテナに合わせる。object-fit: cover と center 指定により、
    // ウィンドウサイズが変わっても常にキャンバスがコンテナの真ん中に追従する。
    canvas.style.width = `${Math.max(1, Math.round(rect.width))}px`;
    canvas.style.height = `${Math.max(1, Math.round(rect.height))}px`;
    canvas.style.left = `${rect.left}px`;
    canvas.style.top = `${rect.top}px`;
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
