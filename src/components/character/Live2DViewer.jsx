import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getLive2DModelConfig } from '../../utils/live2dModelRegistry';
import { generateLipSyncTimeline, getCurrentVowel } from '../../utils/lipSync';
import {
    TYRANO_RUNTIME,
    destroyTyranoManager,
    ensureLive2DSdk,
    ensureTyranoManager,
    mountTyranoCanvas,
    probeAssetUrl,
    resizeTyranoCanvas,
    resolveLive2DStatusMessage,
    hideOldTyranoModels,
} from '../../utils/live2dRuntime';

const warnedKeys = new Set();
const VOWEL_OPEN_MAP = {
    aa: 0.72,
    ih: 0.44,
    ou: 0.6,
    ee: 0.54,
    oh: 0.66,
};
const FALLBACK_EYE_PARAM_NAMES = ['ParamEyeLOpen', 'ParamEyeROpen'];
const FALLBACK_EYE_SMILE_PARAM_NAMES = ['ParamEyeLSmile', 'ParamEyeRSmile'];
const FALLBACK_EYE_SQUINT_PARAM_NAMES = ['Param51', 'Param52'];
const FALLBACK_MOUTH_PARAM_NAMES = ['ParamMouthOpenY'];
const FALLBACK_MOUTH_FORM_PARAM_NAMES = ['ParamMouthForm'];
const FALLBACK_BROW_Y_PARAM_NAMES = ['ParamBrowLY', 'ParamBrowRY'];
const FALLBACK_BROW_FORM_PARAM_NAMES = ['ParamBrowLForm', 'ParamBrowRForm'];
const FALLBACK_ANGLE_X_PARAM_NAMES = ['ParamAngleX'];
const FALLBACK_ANGLE_Y_PARAM_NAMES = ['ParamAngleY'];
const FALLBACK_ANGLE_Z_PARAM_NAMES = ['ParamAngleZ'];
const FALLBACK_ANGER_PARAM_NAMES = ['Param53'];
const FALLBACK_MOUTH_X_PARAM_NAMES = ['Param20'];
const FALLBACK_MOUTH_FUNNEL_PARAM_NAMES = ['Param45'];
const FALLBACK_MOUTH_SHRUG_PARAM_NAMES = ['Param48'];
const FALLBACK_MOUTH_WIDEN_PARAM_NAMES = ['Param49'];
const FALLBACK_JAW_OPEN_PARAM_NAMES = ['Param50'];
const FALLBACK_STAR_EYE_PARAM_NAMES = ['Param59'];
const FALLBACK_HEART_EYE_PARAM_NAMES = ['Param60'];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getPoseEmotionKey = (pose = {}) =>
    String(pose.emotion || pose.expression || 'normal').trim().toLowerCase();

const isHomePose = (pose = {}) => String(pose.scene || '').trim().toLowerCase() === 'home';

const getSceneKey = (pose = {}) => String(pose.scene || 'default').trim().toLowerCase();

const getLive2DFaceAccentKey = (pose = {}) =>
    String(pose.live2dFaceAccent || pose.faceAccent || '').trim().toLowerCase();

const getEmotionAnimationProfile = (pose = {}) => {
    const emotion = String(pose.emotion || pose.expression || 'normal').toLowerCase();
    const intensity = clamp(typeof pose.intensity === 'number' ? pose.intensity : 0.5, 0, 1);
    const profile = {
        mouthScale: 1,
        mouthFlutterScale: 1,
        mouthLimit: 0.84,
        mouthFollowIn: 0.5,
        mouthFollowOut: 0.36,
        mouthFormBase: 0.08,
        mouthFormFlutterScale: 1,
        blinkIntervalScale: 1,
        blinkCloseScale: 1,
        blinkHoldScale: 1,
        blinkOpenScale: 1,
        doubleBlinkChance: 0.38,
    };

    if (emotion === 'happy' || emotion === 'smile') {
        profile.mouthScale = 1.08;
        profile.mouthFlutterScale = 1.12;
        profile.mouthFormBase = 0.15;
        profile.mouthFormFlutterScale = 0.92;
        profile.blinkIntervalScale = 0.88;
        profile.doubleBlinkChance = 0.46;
    } else if (emotion === 'shy' || emotion === 'relaxed') {
        profile.mouthScale = 0.97;
        profile.mouthFlutterScale = 1.08;
        profile.mouthFormBase = 0.18;
        profile.mouthFormFlutterScale = 0.98;
        profile.blinkIntervalScale = 0.9;
        profile.blinkHoldScale = 1.12;
        profile.doubleBlinkChance = 0.5;
    } else if (emotion === 'surprised') {
        profile.mouthScale = 1.12;
        profile.mouthFlutterScale = 0.92;
        profile.mouthFormBase = 0.04;
        profile.mouthFormFlutterScale = 0.55;
        profile.mouthLimit = 0.9;
        profile.blinkIntervalScale = 0.82;
        profile.doubleBlinkChance = 0.2;
    } else if (emotion === 'serious' || emotion === 'angry' || emotion === 'sad') {
        profile.mouthScale = 0.9;
        profile.mouthFlutterScale = 0.82;
        profile.mouthFollowOut = 0.28;
        profile.mouthFormBase = 0.02;
        profile.mouthFormFlutterScale = 0.55;
        profile.blinkIntervalScale = 1.14;
        profile.blinkCloseScale = 1.08;
        profile.doubleBlinkChance = 0.2;
    }

    const livelyBoost = 0.9 + (intensity * 0.18);
    profile.mouthScale *= livelyBoost;
    profile.mouthFlutterScale *= 0.94 + (intensity * 0.16);
    profile.mouthLimit = clamp(profile.mouthLimit * (0.96 + intensity * 0.08), 0.72, 0.92);
    profile.mouthFormBase = clamp(profile.mouthFormBase * (0.88 + intensity * 0.2), 0, 0.35);

    return profile;
};

const getVectorSize = (vector) => {
    if (!vector) {
        return 0;
    }
    if (typeof vector.getSize === 'function') {
        return vector.getSize();
    }
    return Array.isArray(vector) ? vector.length : 0;
};

const getVectorItem = (vector, index) => {
    if (!vector) {
        return null;
    }
    if (typeof vector.at === 'function') {
        return vector.at(index);
    }
    return Array.isArray(vector) ? vector[index] : null;
};

const getCubismIdName = (id) => {
    if (!id) {
        return '';
    }
    if (typeof id === 'string') {
        return id;
    }
    if (typeof id.getString === 'function') {
        const value = id.getString();
        if (typeof value === 'string') {
            return value;
        }
        if (typeof value?.s === 'string') {
            return value.s;
        }
    }
    if (typeof id.s === 'string') {
        return id.s;
    }
    if (typeof id._id?.s === 'string') {
        return id._id.s;
    }
    return '';
};

const resolveParameterIds = (model, preferredIds, fallbackNames = []) => {
    const resolvedIds = [];
    const resolvedNames = new Set();
    const fallbackNameSet = new Set(fallbackNames);

    const pushId = (id) => {
        if (!id) {
            return;
        }
        const name = getCubismIdName(id);
        const key = name || `anonymous_${resolvedIds.length}`;
        if (resolvedNames.has(key)) {
            return;
        }
        resolvedNames.add(key);
        resolvedIds.push(id);
    };

    const preferredSize = getVectorSize(preferredIds);
    for (let i = 0; i < preferredSize; i += 1) {
        pushId(getVectorItem(preferredIds, i));
    }

    const modelParameterIds = model?._parameterIds;
    const modelParameterCount = getVectorSize(modelParameterIds);
    for (let i = 0; i < modelParameterCount; i += 1) {
        const parameterId = getVectorItem(modelParameterIds, i);
        const name = getCubismIdName(parameterId);
        if (fallbackNameSet.has(name)) {
            pushId(parameterId);
        }
    }

    return resolvedIds;
};

const setParameterValues = (model, parameterIds, value) => {
    if (!model?.setParameterValueById || !Array.isArray(parameterIds)) {
        return;
    }

    parameterIds.forEach((parameterId) => {
        try {
            model.setParameterValueById(parameterId, value);
        } catch {
            // Ignore unsupported parameter writes on prototype runtime.
        }
    });
};

// The prototype Tyrano runtime does not expose one stable part-opacity API across builds,
// so we try the public helpers first and then fall back to the raw part opacity buffer.
const resolvePartIndex = (model, partId) => {
    const modelPartIds = model?._partIds;
    const partCount = getVectorSize(modelPartIds);

    for (let index = 0; index < partCount; index += 1) {
        if (getCubismIdName(getVectorItem(modelPartIds, index)) === partId) {
            return index;
        }
    }

    return -1;
};

const setPartOpacity = (model, partId, opacity) => {
    if (!model || !partId || !Number.isFinite(opacity)) {
        return;
    }

    const nextOpacity = clamp(opacity, 0, 1);
    const globalIdManager = window.Live2DCubismFramework?.CubismFramework?.getIdManager?.();
    const cubismId = globalIdManager?.getId?.(partId);

    const trySetById = (id) => {
        if (!id || typeof model.setPartOpacityById !== 'function') {
            return false;
        }

        try {
            model.setPartOpacityById(id, nextOpacity);
            return true;
        } catch {
            return false;
        }
    };

    if (trySetById(cubismId) || trySetById(partId)) {
        return;
    }

    const partIndex = resolvePartIndex(model, partId);
    if (partIndex < 0) {
        return;
    }

    try {
        if (typeof model.setPartOpacityByIndex === 'function') {
            model.setPartOpacityByIndex(partIndex, nextOpacity);
            return;
        }
    } catch {
        // Fall back to direct array write below.
    }

    if (model._partOpacities && typeof model._partOpacities[partIndex] !== 'undefined') {
        model._partOpacities[partIndex] = nextOpacity;
    }
};

const applyPartOpacityOverrides = (model, modelConfig, pose = {}) => {
    const sceneKey = getSceneKey(pose);
    const sceneOverrides = modelConfig?.partOpacityOverrides?.[sceneKey];

    if (!sceneOverrides) {
        return;
    }

    Object.entries(sceneOverrides).forEach(([partId, opacity]) => {
        setPartOpacity(model, partId, opacity);
    });
};

const applyPosePartOpacityOverrides = (manager, modelName, modelConfig, pose = {}) => {
    const activeModel = getActiveTyranoModel(manager, modelName);
    const cubismModel = activeModel?._model;

    if (!cubismModel) {
        return false;
    }

    applyPartOpacityOverrides(cubismModel, modelConfig, pose);
    return true;
};

const getEmotionParameterProfile = (pose = {}) => {
    const emotion = getPoseEmotionKey(pose);
    const intensity = clamp(typeof pose.intensity === 'number' ? pose.intensity : 0.5, 0, 1);
    const homeBoost = isHomePose(pose) ? 1.22 : 1;

    if (emotion === 'happy' || emotion === 'smile') {
        return {
            browY: (0.22 + (intensity * 0.08)) * homeBoost,
            browForm: -((0.32 + (intensity * 0.08)) * homeBoost),
            angleX: (2 + (intensity * 3)) * homeBoost,
            angleY: -1.4 * homeBoost,
            angleZ: 1.2 * homeBoost,
            eyeSmile: clamp((0.62 + (intensity * 0.22)) * homeBoost, 0, 1),
            eyeSquint: 0,
            angry: 0,
            mouthX: 0,
            mouthFunnel: 0.12 + (intensity * 0.08),
            mouthShrug: 0.08 + (intensity * 0.06),
            mouthWiden: 0.42 + (intensity * 0.12),
            jawOpen: 0.1 + (intensity * 0.05),
        };
    }

    if (emotion === 'angry') {
        return {
            browY: -((0.42 + (intensity * 0.16)) * homeBoost),
            browForm: 1.12 + (intensity * 0.24),
            angleX: 0,
            angleY: 1.5 * homeBoost,
            angleZ: 0,
            eyeSmile: 0,
            eyeSquint: 0.82 + (intensity * 0.12),
            angry: 1.08 + (intensity * 0.12),
            mouthX: 0,
            mouthFunnel: 0.14 + (intensity * 0.05),
            mouthShrug: 0.08 + (intensity * 0.04),
            mouthWiden: 0,
            jawOpen: 0.01,
        };
    }

    if (emotion === 'serious' || emotion === 'sad') {
        return {
            browY: -((0.18 + (intensity * 0.1)) * homeBoost),
            browForm: 0.7 + (intensity * 0.18),
            angleX: -((2 + (intensity * 2)) * homeBoost),
            angleY: 1.2 * homeBoost,
            angleZ: -((1.2 + intensity) * homeBoost),
            eyeSmile: 0,
            eyeSquint: 0.28 + (intensity * 0.12),
            angry: 0.7 + (intensity * 0.22),
            mouthX: -(0.1 + (intensity * 0.05)),
            mouthFunnel: 0.22 + (intensity * 0.1),
            mouthShrug: 0.24 + (intensity * 0.1),
            mouthWiden: 0.04,
            jawOpen: 0.02,
        };
    }

    if (emotion === 'surprised') {
        return {
            browY: (0.28 + (intensity * 0.08)) * homeBoost,
            browForm: -0.18,
            angleX: 0,
            angleY: -((1.8 + intensity) * homeBoost),
            angleZ: 0,
            eyeSmile: 0,
            eyeSquint: 0,
            angry: 0,
            mouthX: 0,
            mouthFunnel: 0.36 + (intensity * 0.1),
            mouthShrug: 0.08,
            mouthWiden: 0.08,
            jawOpen: 0.35 + (intensity * 0.16),
        };
    }

    return {
        browY: 0,
        browForm: 0,
        angleX: 0,
        angleY: 0,
        angleZ: 0,
        eyeSmile: 0,
        eyeSquint: 0,
        angry: 0,
        mouthX: 0,
        mouthFunnel: 0,
        mouthShrug: 0,
        mouthWiden: 0,
        jawOpen: 0,
    };
};

const getActiveTyranoModel = (manager, modelName) => {
    const activeManager = manager || window.__tyranolive2d_manager_instance__;
    const activeModelMeta = activeManager?.models?.[modelName];
    const live2dManager = activeManager?.lappdelegate?.lapplive2dmanager;
    const modelIndex = typeof activeModelMeta?.index === 'number'
        ? activeModelMeta.index
        : null;
    const modelsContainer = live2dManager?._models;
    const fallbackIndex = Math.max(0, getVectorSize(modelsContainer) - 1);

    if (modelIndex !== null && typeof live2dManager?.getModel === 'function') {
        return live2dManager.getModel(modelIndex);
    }

    return getVectorItem(modelsContainer, fallbackIndex);
};

const clearActiveExpression = (model) => {
    if (!model?._expressionManager) {
        return;
    }

    try {
        if (typeof model._expressionManager.stopAllMotions === 'function') {
            model._expressionManager.stopAllMotions();
        }
    } catch {
        // Ignore prototype runtime expression reset failures.
    }
};

const resolveMappedExpression = (modelConfig, pose = {}) => {
    const expressionMap = modelConfig?.expressionMap;
    if (!expressionMap) {
        return '';
    }

    const emotionKey = getPoseEmotionKey(pose);
    const sceneKey = getSceneKey(pose);

    if ((sceneKey === 'match' || sceneKey === 'match-result') && (emotionKey === 'happy' || emotionKey === 'smile')) {
        return '';
    }

    if (isHomePose(pose) && emotionKey === 'normal') {
        return '';
    }

    return expressionMap[emotionKey] || '';
};

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
    const lipSyncRef = useRef({ timeline: [], startedAt: 0, totalDuration: 0 });
    const animationStateRef = useRef({ mouthValue: 0, mouthFormValue: 0 });
    const appliedExpressionRef = useRef('');
    const poseRef = useRef(pose);
    const modelConfigRef = React.useRef(null);
    modelConfigRef.current = getLive2DModelConfig(characterId, skinId);
    poseRef.current = pose;
    const modelConfig = modelConfigRef.current;
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

                    const modelParams = createTyranoModelParams({
                        characterId,
                        skinId,
                        modelConfig,
                        onFinishLoad: () => {
                            if (cancelled) return;
                            // Apply scene-specific part overrides immediately on load to avoid
                            // a one-frame flash of the model's default hand-held prop pose.
                            applyPosePartOpacityOverrides(
                                managerRef.current || window.__tyranolive2d_manager_instance__,
                                modelNameRef.current,
                                modelConfigRef.current,
                                poseRef.current,
                            );
                            setStatus('ready');
                            setStatusDetail('');
                        },
                    });

                    modelNameRef.current = modelParams.name;

                    // 本番環境の CsmVector を壊さずに二重描画を回避するため、
                    // 古いモデルのスケールを 0 にして画面から透明化・除外する
                    hideOldTyranoModels(manager);

                    manager.addModel(modelParams);
                    setStatus('loading-model');
                    setStatusDetail(modelConfig.sourceLabel || modelConfig.modelId || '');

                    window.clearTimeout(readyTimerRef.current);
                    readyTimerRef.current = window.setTimeout(() => {
                        if (!cancelled) {
                            const modelMeta = managerRef.current?.models?.[modelNameRef.current];
                            const model = typeof modelMeta?.index === 'number'
                                ? managerRef.current?.lappdelegate?.lapplive2dmanager?.getModel(modelMeta.index)
                                : null;
                            if (model?._state === 22) {
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
            appliedExpressionRef.current = '';
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
        if (!pose?.speaking) {
            lipSyncRef.current = { timeline: [], startedAt: 0, totalDuration: 0 };
            animationStateRef.current.mouthValue = 0;
            animationStateRef.current.mouthFormValue = 0;
            return;
        }

        const timeline = generateLipSyncTimeline(pose.text || '');
        const lastEntry = timeline[timeline.length - 1];
        lipSyncRef.current = {
            timeline,
            startedAt: performance.now(),
            totalDuration: lastEntry ? lastEntry.time + lastEntry.duration : 0,
        };
    }, [pose?.speaking, pose?.text]);

    useEffect(() => {
        if (
            modelConfig?.runtime !== TYRANO_RUNTIME
            || (status !== 'loading-model' && status !== 'ready')
        ) {
            return undefined;
        }

        let cancelled = false;

        const applyExpression = () => {
            if (cancelled) {
                return true;
            }

            const manager = managerRef.current || window.__tyranolive2d_manager_instance__;
            const modelName = modelNameRef.current;
            if (!manager || !modelName) {
                return false;
            }

            const model = getActiveTyranoModel(manager, modelName);
            if (!model) {
                return false;
            }

            const nextExpression = resolveMappedExpression(modelConfig, poseRef.current);
            if (appliedExpressionRef.current === nextExpression) {
                return true;
            }

            if (!nextExpression) {
                clearActiveExpression(model);
                appliedExpressionRef.current = '';
                return true;
            }

            if (typeof manager.setExpression === 'function') {
                manager.setExpression(modelName, nextExpression);
                appliedExpressionRef.current = nextExpression;
                return true;
            }

            return false;
        };

        if (applyExpression()) {
            return undefined;
        }

        const retryId = window.setInterval(() => {
            if (applyExpression()) {
                window.clearInterval(retryId);
            }
        }, 250);

        return () => {
            cancelled = true;
            window.clearInterval(retryId);
        };
    }, [status, modelConfig, pose?.emotion, pose?.expression]);

    // リップシンク・まばたきを Live2D の内部レンダリングループに同期して適用する
    useEffect(() => {
        if (status !== 'ready' || modelConfig?.runtime !== TYRANO_RUNTIME) {
            return undefined;
        }

        let blinkScheduleId;
        let blinkResetId;
        let isBlinking = false;
        let blinkStartedAt = 0;
        let blinkCloseMs = 90;
        let blinkHoldMs = 24;
        let blinkOpenMs = 120;

        const startBlink = (delayMs = 0, allowDoubleBlink = true) => {
            blinkScheduleId = window.setTimeout(() => {
                const profile = getEmotionAnimationProfile(poseRef.current);
                blinkCloseMs = (58 + Math.random() * 22) * profile.blinkCloseScale;
                blinkHoldMs = (18 + Math.random() * 20) * profile.blinkHoldScale;
                blinkOpenMs = (125 + Math.random() * 55) * profile.blinkOpenScale;
                isBlinking = true;
                blinkStartedAt = performance.now();
                const totalBlinkMs = blinkCloseMs + blinkHoldMs + blinkOpenMs;

                blinkResetId = window.setTimeout(() => {
                    isBlinking = false;
                    if (allowDoubleBlink && Math.random() < profile.doubleBlinkChance) {
                        startBlink(70 + Math.random() * 120, false);
                        return;
                    }
                    startBlink((1600 + Math.random() * 2400) * profile.blinkIntervalScale, true);
                }, totalBlinkMs);
            }, delayMs);
        };

        startBlink(1200 + Math.random() * 1600, true);

        let patchedModel = null;
        let originalUpdate = null;
        let originalEyeBlink = null;
        let originalLipSyncFlag = null;
        let originalPmBlink = null;
        let originalPmLip = null;

        const tryPatch = () => {
            try {
                const activeManager = managerRef.current || window.__tyranolive2d_manager_instance__;
                const activeModelName = modelNameRef.current;
                const lappModel = getActiveTyranoModel(activeManager, activeModelName);
                const cubismModel = lappModel?._model;

                if (lappModel && cubismModel && typeof lappModel.update === 'function') {
                    applyPartOpacityOverrides(cubismModel, modelConfigRef.current, poseRef.current);

                    if (!lappModel._patchedForSync) {
                        originalUpdate = lappModel.update.bind(lappModel);
                        patchedModel = lappModel;
                        originalEyeBlink = lappModel._eyeBlink;
                        originalLipSyncFlag = lappModel._lipsync;
                        originalPmBlink = lappModel.pm?.blink;
                        originalPmLip = lappModel.pm?.lip;

                        if (lappModel.pm) {
                            lappModel.pm.blink = 'false';
                            lappModel.pm.lip = 'false';
                        }
                        lappModel._eyeBlink = null;
                        lappModel._lipsync = false;

                        lappModel.update = function () {
                            originalUpdate();

                            const model = this._model;
                            const currentPose = poseRef.current || {};
                            const { timeline, startedAt, totalDuration } = lipSyncRef.current;
                            const animationState = animationStateRef.current;
                            const profile = getEmotionAnimationProfile(currentPose);
                            const emotionProfile = getEmotionParameterProfile(currentPose);
                            const resolvedEyeIds = resolveParameterIds(model, this._eyeBlinkIds, FALLBACK_EYE_PARAM_NAMES);
                            const resolvedLipIds = resolveParameterIds(model, this._lipSyncIds, FALLBACK_MOUTH_PARAM_NAMES);
                            const resolvedMouthFormIds = resolveParameterIds(model, null, FALLBACK_MOUTH_FORM_PARAM_NAMES);
                            const resolvedBrowYIds = resolveParameterIds(model, null, FALLBACK_BROW_Y_PARAM_NAMES);
                            const resolvedEyeSmileIds = resolveParameterIds(model, null, FALLBACK_EYE_SMILE_PARAM_NAMES);
                            const resolvedEyeSquintIds = resolveParameterIds(model, null, FALLBACK_EYE_SQUINT_PARAM_NAMES);
                            const resolvedBrowFormIds = resolveParameterIds(model, null, FALLBACK_BROW_FORM_PARAM_NAMES);
                            const resolvedAngleXIds = resolveParameterIds(model, null, FALLBACK_ANGLE_X_PARAM_NAMES);
                            const resolvedAngleYIds = resolveParameterIds(model, null, FALLBACK_ANGLE_Y_PARAM_NAMES);
                            const resolvedAngleZIds = resolveParameterIds(model, null, FALLBACK_ANGLE_Z_PARAM_NAMES);
                            const resolvedAngryIds = resolveParameterIds(model, null, FALLBACK_ANGER_PARAM_NAMES);
                            const resolvedMouthXIds = resolveParameterIds(model, null, FALLBACK_MOUTH_X_PARAM_NAMES);
                            const resolvedMouthFunnelIds = resolveParameterIds(model, null, FALLBACK_MOUTH_FUNNEL_PARAM_NAMES);
                            const resolvedMouthShrugIds = resolveParameterIds(model, null, FALLBACK_MOUTH_SHRUG_PARAM_NAMES);
                            const resolvedMouthWidenIds = resolveParameterIds(model, null, FALLBACK_MOUTH_WIDEN_PARAM_NAMES);
                            const resolvedJawOpenIds = resolveParameterIds(model, null, FALLBACK_JAW_OPEN_PARAM_NAMES);
                            const resolvedStarEyeIds = resolveParameterIds(model, null, FALLBACK_STAR_EYE_PARAM_NAMES);
                            const resolvedHeartEyeIds = resolveParameterIds(model, null, FALLBACK_HEART_EYE_PARAM_NAMES);
                            const faceAccentKey = getLive2DFaceAccentKey(currentPose);

                            if (model?.setParameterValueById) {
                                let targetMouthValue = 0;
                                let targetMouthFormValue = 0;

                                if (currentPose.speaking && resolvedLipIds.length > 0) {
                                    const elapsed = Math.max(0, (performance.now() - startedAt) / 1000);
                                    const lookupTime = totalDuration > 0 ? (elapsed % totalDuration) : elapsed;
                                    const vowel = timeline.length > 0 ? getCurrentVowel(timeline, lookupTime) : null;
                                    const baseOpen = (vowel ? (VOWEL_OPEN_MAP[vowel] ?? 0.5) : 0.14) * profile.mouthScale;
                                    const flutter = vowel
                                        ? ((Math.sin(elapsed * 12.8) * 0.05) + (Math.sin(elapsed * 8.4 + 0.8) * 0.034)) * profile.mouthFlutterScale
                                        : 0;
                                    targetMouthValue = clamp(baseOpen + flutter, 0, profile.mouthLimit);
                                    const mouthFormFlutter = vowel
                                        ? ((Math.sin(elapsed * 4.4 + 0.3) + 1) * 0.025 * profile.mouthFormFlutterScale)
                                        : 0;
                                    targetMouthFormValue = clamp(profile.mouthFormBase + mouthFormFlutter, 0, 0.28);
                                }

                                const mouthFollowRate = targetMouthValue > animationState.mouthValue
                                    ? profile.mouthFollowIn
                                    : profile.mouthFollowOut;
                                animationState.mouthValue += (targetMouthValue - animationState.mouthValue) * mouthFollowRate;
                                const mouthValue = clamp(animationState.mouthValue, 0, profile.mouthLimit);
                                setParameterValues(model, resolvedLipIds, mouthValue);

                                const mouthFormFollowRate = targetMouthFormValue > animationState.mouthFormValue ? 0.2 : 0.15;
                                animationState.mouthFormValue += (targetMouthFormValue - animationState.mouthFormValue) * mouthFormFollowRate;
                                const mouthFormValue = clamp(animationState.mouthFormValue, 0, 0.28);
                                setParameterValues(model, resolvedMouthFormIds, mouthFormValue);
                                setParameterValues(model, resolvedBrowYIds, emotionProfile.browY);
                                setParameterValues(model, resolvedEyeSmileIds, emotionProfile.eyeSmile);
                                setParameterValues(model, resolvedEyeSquintIds, emotionProfile.eyeSquint);
                                setParameterValues(model, resolvedBrowFormIds, emotionProfile.browForm);
                                setParameterValues(model, resolvedAngleXIds, emotionProfile.angleX);
                                setParameterValues(model, resolvedAngleYIds, emotionProfile.angleY);
                                setParameterValues(model, resolvedAngleZIds, emotionProfile.angleZ);
                                setParameterValues(model, resolvedAngryIds, emotionProfile.angry);
                                setParameterValues(model, resolvedMouthXIds, emotionProfile.mouthX);
                                setParameterValues(model, resolvedMouthFunnelIds, emotionProfile.mouthFunnel);
                                setParameterValues(model, resolvedMouthShrugIds, emotionProfile.mouthShrug);
                                setParameterValues(model, resolvedMouthWidenIds, emotionProfile.mouthWiden);
                                setParameterValues(model, resolvedJawOpenIds, emotionProfile.jawOpen);
                                setParameterValues(model, resolvedStarEyeIds, faceAccentKey === 'star' ? 30 : 0);
                                setParameterValues(model, resolvedHeartEyeIds, faceAccentKey === 'heart' ? 30 : 0);
                                applyPartOpacityOverrides(model, modelConfigRef.current, currentPose);

                                if (resolvedEyeIds.length > 0) {
                                    let blinkValue = 1;

                                    if (isBlinking) {
                                        const elapsedMs = performance.now() - blinkStartedAt;
                                        if (elapsedMs < blinkCloseMs) {
                                            blinkValue = 1 - (elapsedMs / blinkCloseMs);
                                        } else if (elapsedMs < blinkCloseMs + blinkHoldMs) {
                                            blinkValue = 0;
                                        } else {
                                            const openElapsed = elapsedMs - blinkCloseMs - blinkHoldMs;
                                            blinkValue = openElapsed / blinkOpenMs;
                                        }
                                        blinkValue = Math.max(0, Math.min(1, blinkValue));
                                    }

                                    setParameterValues(model, resolvedEyeIds, blinkValue);
                                }

                                if (typeof model.update === 'function') {
                                    model.update();
                                }

                                // Some prototype expressions/motions rewrite part opacities during update,
                                // so re-apply scene overrides after the model finishes its internal pass.
                                applyPartOpacityOverrides(model, modelConfigRef.current, currentPose);
                            }
                        };
                        lappModel._patchedForSync = true;
                    }
                }
            } catch (e) {
                // Ignore transient errors
            }
        };

        // 継続的にモデルのロードを監視してパッチを当てる
        const patchInterval = window.setInterval(tryPatch, 50);
        tryPatch();

        return () => {
            window.clearTimeout(blinkScheduleId);
            window.clearTimeout(blinkResetId);
            window.clearInterval(patchInterval);
            if (patchedModel && originalUpdate) {
                try {
                    patchedModel.update = originalUpdate;
                    patchedModel._eyeBlink = originalEyeBlink;
                    patchedModel._lipsync = originalLipSyncFlag;
                    if (patchedModel.pm) {
                        patchedModel.pm.blink = originalPmBlink;
                        patchedModel.pm.lip = originalPmLip;
                    }
                    patchedModel._patchedForSync = false;
                } catch {
                    // Ignore teardown errors
                }
            }
        };
    }, [modelConfig?.runtime, status]);

    if (!modelConfig) {
        return fallback;
    }

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {status !== 'ready' && (
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
                    opacity: status === 'ready' ? 1 : 0,
                }}
            />
            {status !== 'ready' && (
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
            )}
        </div>
    );
};

export default Live2DViewer;
