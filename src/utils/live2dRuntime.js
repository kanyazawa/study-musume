const scriptLoadCache = new Map();

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

export const resolveLive2DStatusMessage = (status, detail) => {
    switch (status) {
        case 'missing-config':
            return 'Live2Dモデル設定がありません。';
        case 'checking':
            return 'Live2Dアセットを確認中...';
        case 'missing-model':
            return 'model3.json が見つかりません。';
        case 'missing-sdk':
            return 'SDKスクリプトが見つかりません。';
        case 'sdk-load-failed':
            return detail || 'SDKの読み込みに失敗しました。';
        case 'ready':
            return 'Live2Dアセット準備完了。';
        default:
            return 'Live2Dの状態を確認できませんでした。';
    }
};
