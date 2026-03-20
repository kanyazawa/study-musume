import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getLive2DModelConfig } from '../../utils/live2dModelRegistry';
import { ensureLive2DSdk, probeAssetUrl, resolveLive2DStatusMessage } from '../../utils/live2dRuntime';

const warnedKeys = new Set();

const Live2DViewer = ({
    characterId = 'noah',
    skinId = 'default',
    pose = {},
    className = '',
    fallback = null,
}) => {
    const rootRef = useRef(null);
    const modelConfig = getLive2DModelConfig(characterId, skinId);
    const [status, setStatus] = useState(() => (modelConfig ? 'checking' : 'missing-config'));
    const [statusDetail, setStatusDetail] = useState('');
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

                try {
                    await ensureLive2DSdk(modelConfig.sdkScripts);
                } catch (error) {
                    if (!cancelled) {
                        setStatus('sdk-load-failed');
                        setStatusDetail(error instanceof Error ? error.message : String(error));
                    }
                    return;
                }
            }

            if (!cancelled) {
                setStatus('ready');
            }
        };

        initialize();

        // Placeholder hook point for future Cubism SDK initialization.
        const rootElement = rootRef.current;
        if (!rootElement) return undefined;

        rootElement.dataset.live2dModel = modelConfig.modelId || `${characterId}:${skinId}`;
        if (modelConfig.modelJson) {
            rootElement.dataset.live2dModelJson = modelConfig.modelJson;
        }
        rootElement.dataset.live2dEmotion = pose.expression || pose.emotion || 'normal';

        return () => {
            cancelled = true;
            delete rootElement.dataset.live2dModel;
            delete rootElement.dataset.live2dModelJson;
            delete rootElement.dataset.live2dEmotion;
        };
    }, [characterId, skinId, modelConfig, pose.emotion, pose.expression]);

    if (!modelConfig) {
        return fallback;
    }

    if (status !== 'ready') {
        return (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {fallback}
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
                </div>
            </div>
        );
    }

    return (
        <div
            ref={rootRef}
            className={className}
            data-character-id={characterId}
            data-skin-id={skinId}
            data-live2d-ready="false"
        />
    );
};

export default Live2DViewer;
