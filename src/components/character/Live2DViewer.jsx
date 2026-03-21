import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getLive2DModelConfig } from '../../utils/live2dModelRegistry';
import {
    TYRANO_RUNTIME,
    destroyTyranoManager,
    ensureLive2DSdk,
    ensureTyranoManager,
    getTyranoManagerSnapshot,
    mountTyranoCanvas,
    probeAssetUrl,
    resizeTyranoCanvas,
    resolveLive2DStatusMessage,
    clearTyranoModels,
} from '../../utils/live2dRuntime';

const warnedKeys = new Set();

const createTyranoModelParams = ({ characterId, skinId, modelConfig, onFinishLoad }) => ({
    name: `prototype_${characterId}_${skinId}`.replace(/[^a-zA-Z0-9_]/g, '_'),
    model_id: modelConfig.modelName || modelConfig.modelId || characterId,
    idle: modelConfig.idleMotion || 'Idle',
    visible: 'true',
    breath: 'true',
    blink: 'true',
    lip: 'true',
    x: String(modelConfig.stage?.x ?? 0),
    y: String(modelConfig.stage?.y ?? 0),
    scale: String(modelConfig.stage?.scale ?? 1.8),
    onFinishLoad,
});

const Live2DViewer = ({
    characterId = 'noah',
    skinId = 'default',
    pose = {},
    className = '',
    fallback = null,
}) => {
    const rootRef = useRef(null);
    const managerRef = useRef(null);
    const modelNameRef = useRef('');
    const readyTimerRef = useRef(null);
    const modelConfigRef = React.useRef(null);
    modelConfigRef.current = getLive2DModelConfig(characterId, skinId);
    const modelConfig = modelConfigRef.current;
    const [status, setStatus] = useState(() => (modelConfig ? 'checking' : 'missing-config'));
    const [statusDetail, setStatusDetail] = useState('');
    const [runtimeDebug, setRuntimeDebug] = useState(null);
    const statusMessage = useMemo(() => resolveLive2DStatusMessage(status, statusDetail), [status, statusDetail]);

    useEffect(() => {
        if (!modelConfig) {
            const warnKey = `${characterId}:${skinId}`;
            if (!warnedKeys.has(warnKey)) {
                warnedKeys.add(warnKey);
                console.info(`[Live2DViewer] No model config found for ${warnKey}. Falling back until Live2D assets are connected.`);
            }
            setStatus('missing-config');
            setStatusDetail('');
            return undefined;
        }

        const rootElement = rootRef.current;
        if (!rootElement) {
            return undefined;
        }

        let cancelled = false;

        const initialize = async () => {
            setStatus('checking');
            setStatusDetail('');

            if (modelConfig.modelJson) {
                const modelProbe = await probeAssetUrl(modelConfig.modelJson);
                if (!modelProbe.ok) {
                    if (!cancelled) {
                        setStatus('missing-model');
                        setStatusDetail(modelConfig.modelJson);
                    }
                    return;
                }
            }

            if (Array.isArray(modelConfig.sdkScripts) && modelConfig.sdkScripts.length > 0) {
                for (const scriptUrl of modelConfig.sdkScripts) {
                    const sdkProbe = await probeAssetUrl(scriptUrl);
                    if (!sdkProbe.ok) {
                        if (!cancelled) {
                            setStatus('missing-sdk');
                            setStatusDetail(scriptUrl);
                        }
                        return;
                    }
                }
            }

            try {
                if (modelConfig.runtime === TYRANO_RUNTIME) {
                    destroyTyranoManager();

                    const canvas = mountTyranoCanvas(rootElement);
                    resizeTyranoCanvas(canvas, rootElement);

                    const manager = await ensureTyranoManager({
                        sdkScripts: modelConfig.sdkScripts,
                        resourcesPath: modelConfig.resourcesPath,
                        canvas,
                    });

                    if (cancelled) {
                        destroyTyranoManager();
                        return;
                    }

                    managerRef.current = manager;
                    setStatus('loading-model');

                    // 古いモデルの残存による二重描画を防ぐため、追加前にすべてのモデルをクリアする
                    clearTyranoModels(manager);

                    const modelParams = createTyranoModelParams({
                        characterId,
                        skinId,
                        modelConfig,
                        onFinishLoad: () => {
                            if (cancelled) {
                                return;
                            }

                            setStatus('ready');
                            setStatusDetail('');
                            setRuntimeDebug(getTyranoManagerSnapshot(managerRef.current, modelNameRef.current));
                        },
                    });

                    modelNameRef.current = modelParams.name;
                    manager.addModel(modelParams);
                    setStatus('loading-model');
                    setStatusDetail(modelConfig.sourceLabel || modelConfig.modelId || '');

                    window.clearTimeout(readyTimerRef.current);
                    readyTimerRef.current = window.setTimeout(() => {
                        if (!cancelled) {
                            const snapshot = getTyranoManagerSnapshot(managerRef.current, modelNameRef.current);
                            setRuntimeDebug(snapshot);
                            if (snapshot?.modelState === 22) {
                                setStatus('ready');
                                setStatusDetail('');
                            }
                        }
                    }, 1200);
                    return;
                }

                await ensureLive2DSdk(modelConfig.sdkScripts);
                if (!cancelled) {
                    setStatus('ready');
                }
            } catch (error) {
                if (!cancelled) {
                    setStatus(modelConfig.runtime === TYRANO_RUNTIME ? 'init-failed' : 'sdk-load-failed');
                    setStatusDetail(error instanceof Error ? error.message : String(error));
                }
            }
        };

        initialize();

        return () => {
            cancelled = true;

            const manager = managerRef.current;
            const modelName = modelNameRef.current;
            if (manager && modelName && typeof manager.setLipValue === 'function') {
                try {
                    manager.setLipValue(modelName, 0);
                } catch {
                    // Ignore teardown race conditions in prototype mode.
                }
            }

            managerRef.current = null;
            modelNameRef.current = '';
            setRuntimeDebug(null);
            window.clearTimeout(readyTimerRef.current);
            destroyTyranoManager();
        };
    // modelConfig は LIVE2D_MODEL_REGISTRY の固定参照なので characterId/skinId のみで十分
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [characterId, skinId]);

    useEffect(() => {
        const rootElement = rootRef.current;
        if (!rootElement || modelConfig?.runtime !== TYRANO_RUNTIME) {
            return undefined;
        }

        const resize = () => {
            const canvas = rootElement.querySelector('canvas') || document.getElementById('live2d_canvas_tyrano');
            if (canvas) {
                resizeTyranoCanvas(canvas, rootElement);
            }
        };

        resize();


        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', resize);
            return () => window.removeEventListener('resize', resize);
        }

        const observer = new ResizeObserver(resize);
        observer.observe(rootElement);
        window.addEventListener('resize', resize);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', resize);
        };
    }, [modelConfig?.runtime, status]);

    useEffect(() => {
        const manager = managerRef.current;
        const modelName = modelNameRef.current;

        if (!manager || !modelName || status !== 'ready' || modelConfig?.runtime !== TYRANO_RUNTIME) {
            return undefined;
        }

        if (!pose.speaking) {
            manager.setLipValue?.(modelName, 0);
            return undefined;
        }

        const tick = () => {
            const nextValue = 0.2 + (Math.random() * 0.8);
            manager.setLipValue?.(modelName, nextValue);
        };

        tick();
        const intervalId = window.setInterval(tick, 90);

        return () => {
            window.clearInterval(intervalId);
            manager.setLipValue?.(modelName, 0);
        };
    }, [modelConfig?.runtime, pose.speaking, pose.text, status]);

    // 手動まばたき＆ウインクロジック（自動まばたきが機能しない環境向けの強制制御）
    useEffect(() => {
        if (status !== 'ready' || modelConfig?.runtime !== TYRANO_RUNTIME) {
            return undefined;
        }

        let timeoutId;
        let intervalId;
        let isBlinking = false;
        let blinkEnd = 0;
        let blinkMode = 'both'; // 'both', 'left', 'right'

        // Live2Dの内部ループで毎フレームパラメータがリセットされる場合があるため、
        // まばたき/ウインク中は高頻度で上書きし続ける
        const forceEyeTick = () => {
            if (isBlinking && Date.now() < blinkEnd) {
                try {
                    const rawManager = window.__tyranolive2d_manager_instance__;
                    const modelsContainer = rawManager?.lappdelegate?.lapplive2dmanager?._models;
                    // CsmVector型は [0] ではなく .at(0) でアクセスする必要がある
                    const lappModel = (typeof modelsContainer?.at === 'function')
                        ? modelsContainer.at(0)
                        : modelsContainer?.[0];
                    const cubismModel = lappModel?._model;
                    if (cubismModel && typeof cubismModel.setParameterValueById === 'function') {
                        if (blinkMode === 'both' || blinkMode === 'left') {
                            cubismModel.setParameterValueById('ParamEyeLOpen', 0);
                        }
                        if (blinkMode === 'both' || blinkMode === 'right') {
                            cubismModel.setParameterValueById('ParamEyeROpen', 0);
                        }
                    }
                } catch (e) {
                    // Ignore transient errors
                }
            }
        };

        // 16msごとに監視（60fps相当）
        intervalId = window.setInterval(forceEyeTick, 16);

        const doBlink = () => {
            isBlinking = true;
            blinkEnd = Date.now() + 150; // 0.15秒間目を閉じる

            // 約20%の確率でウインク（片目だけ閉じる）にする
            const r = Math.random();
            if (r < 0.1) {
                blinkMode = 'left';
            } else if (r < 0.2) {
                blinkMode = 'right';
            } else {
                blinkMode = 'both';
            }

            window.setTimeout(() => {
                isBlinking = false; // 目を開ける
                blinkMode = 'both';
            }, 150);

            // 次のまばたきを2秒〜7秒後にセット
            timeoutId = window.setTimeout(doBlink, Math.random() * 5000 + 2000);
        };

        // 初回のまばたきをセット
        timeoutId = window.setTimeout(doBlink, Math.random() * 5000 + 2000);

        return () => {
            window.clearTimeout(timeoutId);
            window.clearInterval(intervalId);
        };
    }, [modelConfig?.runtime, status]);

    useEffect(() => {
        if (modelConfig?.runtime !== TYRANO_RUNTIME) {
            return undefined;
        }

        const updateSnapshot = () => {
            setRuntimeDebug(getTyranoManagerSnapshot(managerRef.current, modelNameRef.current));
        };

        updateSnapshot();
        const intervalId = window.setInterval(updateSnapshot, 400);

        return () => window.clearInterval(intervalId);
    }, [modelConfig?.runtime, status]);

    if (!modelConfig) {
        return fallback;
    }

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {!['loading-model', 'ready'].includes(status) && (
                <div style={{ position: 'absolute', inset: 0 }}>
                    {fallback}
                </div>
            )}
            <div
                ref={rootRef}
                className={className}
                data-character-id={characterId}
                data-skin-id={skinId}
                data-live2d-ready={status === 'ready' ? 'true' : 'false'}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1,
                    overflow: 'visible',
                    transform: 'none',
                    opacity: ['loading-model', 'ready'].includes(status) ? 1 : 0,
                }}
            />
            {(status !== 'ready' || runtimeDebug) && (
                <div
                    style={{
                        position: 'absolute',
                        left: '12px',
                        right: '12px',
                        bottom: '12px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: 'rgba(20, 24, 34, 0.82)',
                        color: '#fff',
                        fontSize: '12px',
                        lineHeight: 1.45,
                        backdropFilter: 'blur(6px)',
                    }}
                >
                    <strong style={{ display: 'block', marginBottom: '4px' }}>Live2D standby</strong>
                    <span>{statusMessage}</span>
                    {statusDetail && (
                        <span style={{ display: 'block', marginTop: '4px', color: 'rgba(255,255,255,0.75)' }}>
                            {statusDetail}
                        </span>
                    )}
                    {runtimeDebug && (
                        <span style={{ display: 'block', marginTop: '6px', color: 'rgba(255,255,255,0.75)' }}>
                            {`canvas ${runtimeDebug.canvasWidth}x${runtimeDebug.canvasHeight} / GL ${runtimeDebug.hasGl ? 'ok' : 'ng'} / model ${runtimeDebug.modelStateLabel}`}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default Live2DViewer;
