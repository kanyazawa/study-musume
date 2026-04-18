import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
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
const FALLBACK_BODY_ANGLE_X_PARAM_NAMES = ['ParamBodyAngleX'];
const FALLBACK_BODY_ANGLE_Y_PARAM_NAMES = ['ParamBodyAngleY'];
const FALLBACK_BODY_ANGLE_Z_PARAM_NAMES = ['ParamBodyAngleZ'];
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

const resolveStageConfig = (modelConfig = null, pose = {}) => {
    const baseStage = modelConfig?.stage || {};
    const sceneKey = getSceneKey(pose);
    const sceneStageOverride = modelConfig?.stageOverrides?.[sceneKey];

    if (!sceneStageOverride) {
        return baseStage;
    }

    return {
        ...baseStage,
        ...sceneStageOverride,
    };
};

const getLive2DFaceAccentKey = (pose = {}) =>
    String(pose.live2dFaceAccent || pose.faceAccent || '').trim().toLowerCase();

const shouldDisableEmotionAdjustments = (pose = {}) =>
    Boolean(pose.disableLive2DEmotionAdjustments);

const getLive2DImpactMotionKey = (pose = {}) =>
    String(pose.live2dImpactMotion || '').trim().toLowerCase();

const getLive2DImpactVariant = (pose = {}) =>
    (pose && typeof pose.live2dImpactVariant === 'object' && pose.live2dImpactVariant)
        ? pose.live2dImpactVariant
        : {};

const sampleMotionCurve = (points, t) => {
    if (!Array.isArray(points) || points.length === 0) {
        return 0;
    }

    if (t <= points[0][0]) {
        return points[0][1];
    }

    for (let index = 1; index < points.length; index += 1) {
        const [nextT, nextValue] = points[index];
        const [prevT, prevValue] = points[index - 1];
        if (t <= nextT) {
            const span = nextT - prevT || 1;
            const localT = (t - prevT) / span;
            return prevValue + ((nextValue - prevValue) * localT);
        }
    }

    return points[points.length - 1][1];
};

const getLive2DImpactProfile = (pose = {}, nowMs = performance.now()) => {
    const motionKey = getLive2DImpactMotionKey(pose);
    const startedAt = Number(pose.live2dImpactStartedAt || 0);
    const durationMs = Number(pose.live2dImpactDurationMs || 0);

    if (!motionKey || !startedAt || durationMs <= 0) {
        return null;
    }

    const elapsedMs = nowMs - startedAt;
    if (elapsedMs < 0 || elapsedMs > durationMs) {
        return null;
    }

    const t = clamp(elapsedMs / durationMs, 0, 1);
    const variant = getLive2DImpactVariant(pose);
    const side = variant.side === -1 || variant.side === 1
        ? variant.side
        : (Math.floor(startedAt / 120) % 2 === 0 ? -1 : 1);

    if (motionKey === 'chest-flinch') {
        const intensity = clamp(Number(variant.intensity || 1), 0.78, 1.28);
        const lift = clamp(Number(variant.lift || 1), 0.74, 1.32);
        const twist = clamp(Number(variant.twist || 1), 0.74, 1.28);
        const settleAmount = clamp(Number(variant.settle || 1), 0.72, 1.28);
        const anticipation = clamp(Number(variant.anticipation || 1), 0.7, 1.35);
        const lag = clamp(Number(variant.lag || 1), 0.76, 1.26);
        const recoil = sampleMotionCurve([
            [0, 0],
            [0.06, -0.08 * anticipation],
            [0.16, 1 * intensity],
            [0.32, 0.42 * settleAmount],
            [0.56, 0.2 * settleAmount],
            [0.78, 0.08 * settleAmount],
            [0.9, 0.03 * settleAmount],
            [1, 0],
        ], t);
        const sway = sampleMotionCurve([
            [0, 0],
            [0.18, 1 * twist],
            [0.42, -0.38 * settleAmount],
            [0.7, 0.12 * settleAmount],
            [0.9, -0.035 * settleAmount],
            [1, 0],
        ], t) * side;
        const settle = sampleMotionCurve([
            [0, 0],
            [0.24, 0.11 * settleAmount],
            [0.58, -0.07 * settleAmount],
            [0.82, 0.025 * settleAmount],
            [1, 0],
        ], t);
        const breathCatch = sampleMotionCurve([
            [0, 0],
            [0.74, 0],
            [0.86, 0.1 * lag],
            [0.94, -0.05 * settleAmount],
            [1, 0],
        ], t);
        const afterBreath = sampleMotionCurve([
            [0, 0],
            [0.84, 0],
            [0.92, 0.045 * lag],
            [0.975, -0.022 * settleAmount],
            [1, 0],
        ], t);

        return {
            bodyAngleX: (-17 * recoil * lift) + (2.6 * settle) + (1.35 * afterBreath),
            bodyAngleY: (5.1 * sway) + (0.9 * breathCatch * side),
            bodyAngleZ: 6.4 * sway,
            angleX: (-6.2 * recoil * lag) + (0.95 * settle) + (0.55 * afterBreath),
            angleY: (2.1 * sway) + (0.8 * breathCatch * side),
            angleZ: 2.3 * sway,
            mouthOpen: Math.max(0, (0.018 * anticipation) + (0.085 * recoil * lag) + (0.032 * breathCatch) + (0.016 * afterBreath)),
            eyeOpen: 1 + Math.max(0, (0.085 * recoil) + (0.03 * breathCatch)),
        };
    }

    return null;
};

const getLive2DEmotionKey = (pose = {}, modelConfig = null) => {
    const explicitEmotion = String(pose.live2dEmotion || '').trim().toLowerCase();
    if (explicitEmotion) {
        return explicitEmotion;
    }

    const poseEmotion = getPoseEmotionKey(pose);
    const mappedEmotion = modelConfig?.emotionProfileMap?.[poseEmotion];
    return String(mappedEmotion || poseEmotion || 'normal').trim().toLowerCase();
};

const smoothToward = (current, target, riseRate = 0.16, fallRate = 0.12) => {
    const nextRate = Math.abs(target) > Math.abs(current) ? riseRate : fallRate;
    const nextValue = current + ((target - current) * nextRate);
    return Math.abs(target - nextValue) < 0.001 ? target : nextValue;
};

const createAnimationState = () => ({
    mouthValue: 0,
    mouthFormValue: 0,
    angleX: 0,
    angleY: 0,
    angleZ: 0,
    bodyAngleX: 0,
    bodyAngleY: 0,
    bodyAngleZ: 0,
});

const getEmotionAnimationProfile = (pose = {}, modelConfig = null) => {
    const emotion = getLive2DEmotionKey(pose, modelConfig);
    const intensity = clamp(typeof pose.intensity === 'number' ? pose.intensity : 0.5, 0, 1);
    const sceneKey = getSceneKey(pose);
    const isReviewSmile = sceneKey === 'review' && (emotion === 'happy' || emotion === 'smile');
    const isMatchSmile = (sceneKey === 'match' || sceneKey === 'match-result') && (emotion === 'happy' || emotion === 'smile');
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
        profile.mouthScale = isMatchSmile ? 1.52 : 1.08;
        profile.mouthFlutterScale = isMatchSmile ? 0.9 : 1.12;
        profile.mouthFormBase = isMatchSmile ? 0.32 : 0.15;
        profile.mouthFormFlutterScale = isMatchSmile ? 0.66 : 0.92;
        profile.mouthLimit = isMatchSmile ? 0.94 : profile.mouthLimit;
        profile.mouthFollowIn = isMatchSmile ? 0.64 : profile.mouthFollowIn;
        profile.blinkHoldScale = (isReviewSmile || isMatchSmile) ? 1.12 : profile.blinkHoldScale;
        profile.blinkOpenScale = isMatchSmile ? 0.9 : isReviewSmile ? 0.94 : profile.blinkOpenScale;
        profile.blinkIntervalScale = 0.88;
        profile.doubleBlinkChance = isMatchSmile ? 0.58 : isReviewSmile ? 0.54 : 0.46;
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

const getEmotionParameterProfile = (pose = {}, modelConfig = null) => {
    if (shouldDisableEmotionAdjustments(pose)) {
        return {
            browY: 0,
            browForm: 0,
            angleX: 0,
            angleY: 0,
            angleZ: 0,
            bodyAngleX: 0,
            bodyAngleY: 0,
            bodyAngleZ: 0,
            eyeSmile: 0,
            eyeSquint: 0,
            eyeOpen: 1,
            angry: 0,
            mouthOpen: 0,
            mouthX: 0,
            mouthFunnel: 0,
            mouthShrug: 0,
            mouthWiden: 0,
            jawOpen: 0,
        };
    }

    const emotion = getLive2DEmotionKey(pose, modelConfig);
    const intensity = clamp(typeof pose.intensity === 'number' ? pose.intensity : 0.5, 0, 1);
    const homeBoost = isHomePose(pose) ? 1.22 : 1;
    const sceneKey = getSceneKey(pose);
    const reviewSmileBoost = sceneKey === 'review' && (emotion === 'happy' || emotion === 'smile')
        ? 1.26
        : 1;
    const matchSmileBoost = (sceneKey === 'match' || sceneKey === 'match-result') && (emotion === 'happy' || emotion === 'smile')
        ? 1.52
        : 1;
    const smileBoost = Math.max(reviewSmileBoost, matchSmileBoost);
    const mouthSmileBoost = matchSmileBoost > 1 ? matchSmileBoost : 1;
    const isReviewSmile = reviewSmileBoost > 1;

    if (emotion === 'happy' || emotion === 'smile') {
        return {
            browY: (0.22 + (intensity * 0.08)) * homeBoost * smileBoost,
            browForm: -((0.34 + (intensity * 0.09)) * homeBoost * (1 + ((smileBoost - 1) * 0.42))),
            angleX: (1.6 + (intensity * 2.9)) * homeBoost * (1 + ((smileBoost - 1) * 0.3)),
            angleY: (matchSmileBoost > 1 ? -0.42 : -1.05) * homeBoost,
            angleZ: (1.8 + ((smileBoost - 1) * 6.4)) * homeBoost,
            bodyAngleX: (matchSmileBoost > 1 ? 0.4 : 0.62) * homeBoost,
            bodyAngleY: -0.34 * homeBoost,
            bodyAngleZ: (0.8 + ((smileBoost - 1) * 3.2)) * homeBoost,
            eyeSmile: clamp((0.62 + (intensity * 0.26)) * homeBoost * smileBoost, 0, 1),
            eyeSquint: 0.06 + ((smileBoost - 1) * 0.08),
            eyeOpen: matchSmileBoost > 1 ? 0.94 : 0.97,
            angry: 0,
            mouthOpen: isReviewSmile
                ? 0.01
                : matchSmileBoost > 1
                ? 0.24 + (intensity * 0.12)
                : (0.11 + (intensity * 0.06)) * mouthSmileBoost,
            mouthX: 0,
            mouthFunnel: matchSmileBoost > 1
                ? 0.02
                : Math.max(0.03, (0.06 + (intensity * 0.04)) - ((mouthSmileBoost - 1) * 0.08)),
            mouthShrug: matchSmileBoost > 1
                ? 0.28 + (intensity * 0.12)
                : 0.18 + (intensity * 0.12 * mouthSmileBoost),
            mouthWiden: matchSmileBoost > 1
                ? Math.min(0.94, 0.7 + (intensity * 0.18))
                : Math.min(0.86, (0.48 + (intensity * 0.14)) * mouthSmileBoost),
            jawOpen: isReviewSmile
                ? 0.01
                : matchSmileBoost > 1
                ? 0.46 + (intensity * 0.2)
                : (0.26 + (intensity * 0.13)) * (1 + ((mouthSmileBoost - 1) * 0.6)),
        };
    }

    if (emotion === 'angry') {
        return {
            browY: -((0.42 + (intensity * 0.16)) * homeBoost),
            browForm: 1.12 + (intensity * 0.24),
            angleX: 0,
            angleY: 1.5 * homeBoost,
            angleZ: 0,
            bodyAngleX: -1.8 * homeBoost,
            bodyAngleY: 1.2 * homeBoost,
            bodyAngleZ: 0,
            eyeSmile: 0,
            eyeSquint: 0.82 + (intensity * 0.12),
            eyeOpen: 0.84 - (intensity * 0.04),
            angry: 1.08 + (intensity * 0.12),
            mouthOpen: 0.01,
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
            bodyAngleX: -1.2 * homeBoost,
            bodyAngleY: 0.9 * homeBoost,
            bodyAngleZ: -0.8 * homeBoost,
            eyeSmile: 0,
            eyeSquint: 0.28 + (intensity * 0.12),
            eyeOpen: 0.92,
            angry: 0.7 + (intensity * 0.22),
            mouthOpen: 0.02,
            mouthX: -(0.1 + (intensity * 0.05)),
            mouthFunnel: 0.22 + (intensity * 0.1),
            mouthShrug: 0.24 + (intensity * 0.1),
            mouthWiden: 0.04,
            jawOpen: 0.02,
        };
    }

    if (emotion === 'surprised') {
        return {
            browY: (0.38 + (intensity * 0.18)) * homeBoost,
            browForm: -0.28,
            angleX: -((1.2 + intensity) * homeBoost),
            angleY: -((0.6 + (intensity * 0.4)) * homeBoost),
            angleZ: 0.8 * homeBoost,
            bodyAngleX: -((2.4 + (intensity * 1.6)) * homeBoost),
            bodyAngleY: -((0.8 + (intensity * 0.4)) * homeBoost),
            bodyAngleZ: 1.4 * homeBoost,
            eyeSmile: 0,
            eyeSquint: 0,
            eyeOpen: 1.12 + (intensity * 0.04),
            angry: 0,
            mouthOpen: 0.28 + (intensity * 0.14),
            mouthX: 0,
            mouthFunnel: 0.48 + (intensity * 0.16),
            mouthShrug: 0.04,
            mouthWiden: 0,
            jawOpen: 0.5 + (intensity * 0.18),
        };
    }

    return {
        browY: 0,
        browForm: 0,
        angleX: 0,
        angleY: 0,
        angleZ: 0,
        bodyAngleX: 0,
        bodyAngleY: 0,
        bodyAngleZ: 0,
        eyeSmile: 0,
        eyeSquint: 0,
        eyeOpen: 1,
        angry: 0,
        mouthOpen: 0,
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
    const explicitExpression = String(pose.live2dExpression || '').trim().toLowerCase();
    if (explicitExpression === 'none') {
        return '';
    }

    if (explicitExpression) {
        return explicitExpression;
    }

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

const createTyranoModelParams = ({ characterId, skinId, modelConfig, pose, onFinishLoad }) => {
    const stageConfig = resolveStageConfig(modelConfig, pose);

    return {
        name: `prototype_${characterId}_${skinId}`.replace(/[^a-zA-Z0-9_]/g, '_'),
        model_id: modelConfig.modelName || modelConfig.modelId || characterId,
        idle: modelConfig.idleMotion || 'Idle',
        visible: 'true',
        breath: 'true',
        blink: 'true',
        lip: 'true',
        x: String(stageConfig.x ?? 0),
        y: String(stageConfig.y ?? 0),
        scale: String(stageConfig.scale ?? 1.8),
        onFinishLoad,
    };
};

const Live2DViewer = ({
    characterId = 'noah',
    skinId = 'default',
    pose = {},
    className = '',
    fallback = null,
}) => {
    const isNativePlatform = Capacitor.isNativePlatform();
    const rootRef = useRef(null);
    const managerRef = useRef(null);
    const modelNameRef = useRef('');
    const readyTimerRef = useRef(null);
    const initTimerRef = useRef(null);
    const lipSyncRef = useRef({ timeline: [], startedAt: 0, totalDuration: 0 });
    const animationStateRef = useRef(createAnimationState());
    const impactAnimationRef = useRef(null);
    const appliedExpressionRef = useRef('');
    const poseRef = useRef(pose);
    const modelConfigRef = React.useRef(null);
    modelConfigRef.current = getLive2DModelConfig(characterId, skinId);
    poseRef.current = pose;
    const modelConfig = modelConfigRef.current;
    const [status, setStatus] = useState(() => (modelConfig ? 'checking' : 'missing-config'));
    const [statusDetail, setStatusDetail] = useState('');
    const statusMessage = useMemo(() => resolveLive2DStatusMessage(status, statusDetail), [status, statusDetail]);
    const shouldShowStaticFallback = status !== 'ready';
    const shouldShowFallbackStatus = status === 'missing-config'
        || status === 'missing-model'
        || status === 'missing-sdk'
        || status === 'sdk-load-failed'
        || status === 'init-failed';

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
        const readyCheckStartedAt = Date.now();

        const monitorReadyState = () => {
            window.clearTimeout(readyTimerRef.current);
            readyTimerRef.current = window.setTimeout(() => {
                if (cancelled) {
                    return;
                }

                const modelMeta = managerRef.current?.models?.[modelNameRef.current];
                const model = typeof modelMeta?.index === 'number'
                    ? managerRef.current?.lappdelegate?.lapplive2dmanager?.getModel(modelMeta.index)
                    : null;

                if (model?._state === 22) {
                    setStatus('ready');
                    setStatusDetail('');
                    return;
                }

                if (Date.now() - readyCheckStartedAt >= (isNativePlatform ? 5000 : 3000)) {
                    setStatus('init-failed');
                    setStatusDetail('Live2Dの読み込みが完了しませんでした。');
                    return;
                }

                monitorReadyState();
            }, isNativePlatform ? 320 : 220);
        };

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
                        pose,
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
                    const existingModelMeta = manager.models?.[modelNameRef.current];
                    const existingModel = typeof existingModelMeta?.index === 'number'
                        ? manager.lappdelegate?.lapplive2dmanager?.getModel(existingModelMeta.index)
                        : null;

                    if (existingModel) {
                        if (existingModel._state !== 22) {
                            // Recover from stale Tyrano cache entries that never completed loading.
                            // Re-adding the model is safer than waiting indefinitely in standby.
                            hideOldTyranoModels(manager);
                        } else {
                            applyPosePartOpacityOverrides(
                                managerRef.current || window.__tyranolive2d_manager_instance__,
                                modelNameRef.current,
                                modelConfigRef.current,
                                poseRef.current,
                            );
                            setStatus('ready');
                            setStatusDetail('');
                            return;
                        }
                    }

                    // 本番環境の CsmVector を壊さずに二重描画を回避するため、
                    // 古いモデルのスケールを 0 にして画面から透明化・除外する
                    hideOldTyranoModels(manager);

                    manager.addModel(modelParams);
                    setStatus('loading-model');
                    setStatusDetail(modelConfig.sourceLabel || modelConfig.modelId || '');
                    monitorReadyState();
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

        if (isNativePlatform) {
            initTimerRef.current = window.setTimeout(() => {
                initialize();
            }, 180);
        } else {
            initialize();
        }

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
            window.clearTimeout(initTimerRef.current);
            window.clearTimeout(readyTimerRef.current);
            impactAnimationRef.current?.cancel?.();
            impactAnimationRef.current = null;
            destroyTyranoManager();
        };
    // modelConfig は LIVE2D_MODEL_REGISTRY の固定参照なので characterId/skinId のみで十分
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [characterId, isNativePlatform, skinId]);

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
    }, [pose?.speaking, pose?.text, pose?.speechNonce]);

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
    }, [status, modelConfig, pose?.emotion, pose?.expression, pose?.live2dExpression]);

    useEffect(() => {
        if (status !== 'ready' || modelConfig?.runtime !== TYRANO_RUNTIME) {
            impactAnimationRef.current?.cancel?.();
            impactAnimationRef.current = null;
            return undefined;
        }

        const rootElement = rootRef.current;
        const motionKey = getLive2DImpactMotionKey(pose);
        const durationMs = Number(pose?.live2dImpactDurationMs || 0);

        if (!rootElement || motionKey !== 'chest-flinch' || durationMs <= 0 || typeof rootElement.animate !== 'function') {
            return undefined;
        }

        impactAnimationRef.current?.cancel?.();
        const variant = getLive2DImpactVariant(pose);
        const side = variant.side === -1 || variant.side === 1
            ? variant.side
            : (Math.floor(Number(pose?.live2dImpactStartedAt || 0) / 120) % 2 === 0 ? -1 : 1);
        const intensity = clamp(Number(variant.intensity || 1), 0.78, 1.28);
        const lift = clamp(Number(variant.lift || 1), 0.74, 1.32);
        const twist = clamp(Number(variant.twist || 1), 0.74, 1.28);
        const settleAmount = clamp(Number(variant.settle || 1), 0.72, 1.28);
        const anticipation = clamp(Number(variant.anticipation || 1), 0.7, 1.35);
        const anticipX = Math.round(side * (1 + (1.8 * anticipation)));
        const anticipY = Math.round(2 + (1.6 * anticipation));
        const escapeX = Math.round(side * ((10.5 * intensity) + (2.8 * twist)));
        const escapeY = Math.round((-16 * lift) - (5 * intensity));
        const recoilX = Math.round(side * (-(4.5 * settleAmount) - 1.5));
        const recoilY = Math.round((3.5 * settleAmount) + 1.5);
        const secondaryX = Math.round(side * ((2.4 * settleAmount) + 0.8));
        const secondaryY = Math.round((-4.5 * settleAmount) - 1.4);
        const settleX = Math.round(side * -0.8);
        const settleY = 1;
        impactAnimationRef.current = rootElement.animate(
            [
                { transform: 'translate3d(0px, 0px, 0) rotate(0deg)' },
                { offset: 0.08, transform: `translate3d(${anticipX}px, ${anticipY}px, 0) rotate(${(side * 0.24 * anticipation).toFixed(2)}deg)` },
                { offset: 0.18, transform: `translate3d(${escapeX}px, ${escapeY}px, 0) rotate(${(side * -2.05 * twist).toFixed(2)}deg)` },
                { offset: 0.44, transform: `translate3d(${recoilX}px, ${recoilY}px, 0) rotate(${(side * 1.18 * settleAmount).toFixed(2)}deg)` },
                { offset: 0.71, transform: `translate3d(${secondaryX}px, ${secondaryY}px, 0) rotate(${(side * -0.62 * settleAmount).toFixed(2)}deg)` },
                { offset: 0.88, transform: `translate3d(${settleX}px, ${settleY}px, 0) rotate(${(side * 0.14).toFixed(2)}deg)` },
                { offset: 0.95, transform: `translate3d(${Math.round(settleX * -0.35)}px, 2px, 0) rotate(${(side * -0.08).toFixed(2)}deg)` },
                { transform: 'translate3d(0px, 0px, 0) rotate(0deg)' },
            ],
            {
                duration: durationMs + 200,
                easing: 'cubic-bezier(0.16, 0.78, 0.2, 1)',
                fill: 'none',
            },
        );

        return () => {
            impactAnimationRef.current?.cancel?.();
            impactAnimationRef.current = null;
        };
    }, [modelConfig?.runtime, pose?.live2dImpactDurationMs, pose?.live2dImpactMotion, pose?.live2dImpactStartedAt, status]);

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
                const profile = getEmotionAnimationProfile(poseRef.current, modelConfigRef.current);
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
                            const profile = getEmotionAnimationProfile(currentPose, modelConfigRef.current);
                            const emotionProfile = getEmotionParameterProfile(currentPose, modelConfigRef.current);
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
                            const resolvedBodyAngleXIds = resolveParameterIds(model, null, FALLBACK_BODY_ANGLE_X_PARAM_NAMES);
                            const resolvedBodyAngleYIds = resolveParameterIds(model, null, FALLBACK_BODY_ANGLE_Y_PARAM_NAMES);
                            const resolvedBodyAngleZIds = resolveParameterIds(model, null, FALLBACK_BODY_ANGLE_Z_PARAM_NAMES);
                            const resolvedAngryIds = resolveParameterIds(model, null, FALLBACK_ANGER_PARAM_NAMES);
                            const resolvedMouthXIds = resolveParameterIds(model, null, FALLBACK_MOUTH_X_PARAM_NAMES);
                            const resolvedMouthFunnelIds = resolveParameterIds(model, null, FALLBACK_MOUTH_FUNNEL_PARAM_NAMES);
                            const resolvedMouthShrugIds = resolveParameterIds(model, null, FALLBACK_MOUTH_SHRUG_PARAM_NAMES);
                            const resolvedMouthWidenIds = resolveParameterIds(model, null, FALLBACK_MOUTH_WIDEN_PARAM_NAMES);
                            const resolvedJawOpenIds = resolveParameterIds(model, null, FALLBACK_JAW_OPEN_PARAM_NAMES);
                            const resolvedStarEyeIds = resolveParameterIds(model, null, FALLBACK_STAR_EYE_PARAM_NAMES);
                            const resolvedHeartEyeIds = resolveParameterIds(model, null, FALLBACK_HEART_EYE_PARAM_NAMES);
                            const faceAccentKey = getLive2DFaceAccentKey(currentPose);
                            const impactProfile = getLive2DImpactProfile(currentPose, performance.now());

                            if (model?.setParameterValueById) {
                                let targetMouthValue = 0;
                                let targetMouthFormValue = 0;
                                let blinkValue = 1;

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
                                const mouthValue = clamp(
                                    Math.max(animationState.mouthValue, emotionProfile.mouthOpen || 0),
                                    0,
                                    profile.mouthLimit,
                                );
                                setParameterValues(model, resolvedLipIds, mouthValue);

                                const mouthFormFollowRate = targetMouthFormValue > animationState.mouthFormValue ? 0.2 : 0.15;
                                animationState.mouthFormValue += (targetMouthFormValue - animationState.mouthFormValue) * mouthFormFollowRate;
                                const mouthFormValue = clamp(animationState.mouthFormValue, 0, 0.28);
                                animationState.angleX = smoothToward(animationState.angleX, emotionProfile.angleX);
                                animationState.angleY = smoothToward(animationState.angleY, emotionProfile.angleY);
                                animationState.angleZ = smoothToward(animationState.angleZ, emotionProfile.angleZ, 0.14, 0.1);
                                animationState.bodyAngleX = smoothToward(animationState.bodyAngleX, emotionProfile.bodyAngleX, 0.14, 0.1);
                                animationState.bodyAngleY = smoothToward(animationState.bodyAngleY, emotionProfile.bodyAngleY, 0.14, 0.1);
                                animationState.bodyAngleZ = smoothToward(animationState.bodyAngleZ, emotionProfile.bodyAngleZ, 0.14, 0.1);
                                if (resolvedEyeIds.length > 0) {
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
                                }

                                const applyCustomParameters = () => {
                                    setParameterValues(model, resolvedLipIds, mouthValue);
                                    setParameterValues(model, resolvedMouthFormIds, mouthFormValue);
                                    setParameterValues(model, resolvedBrowYIds, emotionProfile.browY);
                                    setParameterValues(model, resolvedEyeSmileIds, emotionProfile.eyeSmile);
                                    setParameterValues(model, resolvedEyeSquintIds, emotionProfile.eyeSquint);
                                    setParameterValues(model, resolvedBrowFormIds, emotionProfile.browForm);
                                    setParameterValues(model, resolvedAngleXIds, animationState.angleX + (impactProfile?.angleX || 0));
                                    setParameterValues(model, resolvedAngleYIds, animationState.angleY + (impactProfile?.angleY || 0));
                                    setParameterValues(model, resolvedAngleZIds, animationState.angleZ + (impactProfile?.angleZ || 0));
                                    setParameterValues(model, resolvedBodyAngleXIds, animationState.bodyAngleX + (impactProfile?.bodyAngleX || 0));
                                    setParameterValues(model, resolvedBodyAngleYIds, animationState.bodyAngleY + (impactProfile?.bodyAngleY || 0));
                                    setParameterValues(model, resolvedBodyAngleZIds, animationState.bodyAngleZ + (impactProfile?.bodyAngleZ || 0));
                                    setParameterValues(model, resolvedAngryIds, emotionProfile.angry);
                                    setParameterValues(model, resolvedMouthXIds, emotionProfile.mouthX);
                                    setParameterValues(model, resolvedMouthFunnelIds, emotionProfile.mouthFunnel);
                                    setParameterValues(model, resolvedMouthShrugIds, emotionProfile.mouthShrug);
                                    setParameterValues(model, resolvedMouthWidenIds, emotionProfile.mouthWiden);
                                    setParameterValues(model, resolvedJawOpenIds, emotionProfile.jawOpen);
                                    setParameterValues(model, resolvedStarEyeIds, faceAccentKey === 'star' ? 30 : 0);
                                    setParameterValues(model, resolvedHeartEyeIds, faceAccentKey === 'heart' ? 30 : 0);
                                    const eyeOpenValue = isBlinking
                                        ? blinkValue
                                        : Math.max(emotionProfile.eyeOpen ?? 1, impactProfile?.eyeOpen ?? 1);
                                    setParameterValues(
                                        model,
                                        resolvedLipIds,
                                        clamp(Math.max(mouthValue, impactProfile?.mouthOpen || 0), 0, profile.mouthLimit),
                                    );
                                    setParameterValues(model, resolvedEyeIds, eyeOpenValue);
                                    applyPartOpacityOverrides(model, modelConfigRef.current, currentPose);
                                };

                                applyCustomParameters();

                                if (typeof model.update === 'function') {
                                    model.update();
                                }

                                // Some prototype expressions/motions rewrite parameters and part opacities
                                // during update, so re-apply our mouth/face sync after the internal pass.
                                applyCustomParameters();
                            }
                        };
                        lappModel._patchedForSync = true;
                    }
                }
            } catch {
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
            {shouldShowStaticFallback && (
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
            {shouldShowFallbackStatus && (
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
