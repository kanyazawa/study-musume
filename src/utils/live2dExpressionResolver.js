const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const getPoseEmotionKey = (pose = {}) =>
    String(pose.emotion || pose.expression || 'normal').trim().toLowerCase();

export const getSceneKey = (pose = {}) =>
    String(pose.scene || 'default').trim().toLowerCase();

export const isHomePose = (pose = {}) => getSceneKey(pose) === 'home';

export const getLive2DFaceAccentKey = (pose = {}) =>
    String(pose.live2dFaceAccent || pose.faceAccent || '').trim().toLowerCase();

export const getLive2DEmotionKey = (pose = {}, modelConfig = null) => {
    const explicitEmotion = String(pose.live2dEmotion || '').trim().toLowerCase();
    if (explicitEmotion) {
        return explicitEmotion;
    }

    const poseEmotion = getPoseEmotionKey(pose);
    const mappedEmotion = modelConfig?.emotionProfileMap?.[poseEmotion];
    return String(mappedEmotion || poseEmotion || 'normal').trim().toLowerCase();
};

export const resolveMappedExpression = (modelConfig, pose = {}) => {
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

export const getEmotionAnimationProfile = (pose = {}, modelConfig = null) => {
    const emotion = getLive2DEmotionKey(pose, modelConfig);
    const intensity = clamp(typeof pose.intensity === 'number' ? pose.intensity : 0.5, 0, 1);
    const sceneKey = getSceneKey(pose);
    const isCorrect = emotion === 'correct';
    const isReviewMistake = sceneKey === 'review' && emotion === 'angry';
    const isReviewSmile = sceneKey === 'review' && (emotion === 'happy' || emotion === 'smile' || isCorrect);
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

    if (isCorrect) {
        profile.mouthScale = 1.12;
        profile.mouthFlutterScale = 0.92;
        profile.mouthFormBase = 0.04;
        profile.mouthFormFlutterScale = 0.55;
        profile.mouthLimit = 0.9;
        profile.blinkIntervalScale = 0.9;
        profile.blinkHoldScale = 1.08;
        profile.blinkOpenScale = 0.94;
        profile.doubleBlinkChance = 0.48;
    } else if (isReviewMistake) {
        profile.mouthScale = 0.62;
        profile.mouthFlutterScale = 0.42;
        profile.mouthFormBase = 0.01;
        profile.mouthFormFlutterScale = 0.22;
        profile.mouthLimit = 0.035;
        profile.mouthFollowIn = 0.08;
        profile.mouthFollowOut = 0.74;
        profile.blinkIntervalScale = 1.14;
        profile.blinkCloseScale = 1.08;
        profile.doubleBlinkChance = 0.2;
    } else if (emotion === 'happy' || emotion === 'smile') {
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
    profile.mouthLimit = isReviewMistake
        ? profile.mouthLimit
        : clamp(profile.mouthLimit * (0.96 + intensity * 0.08), 0.72, 0.92);
    profile.mouthFormBase = clamp(profile.mouthFormBase * (0.88 + intensity * 0.2), 0, 0.35);

    return profile;
};

export const getEmotionParameterProfile = (pose = {}, modelConfig = null) => {
    if (pose.disableLive2DEmotionAdjustments) {
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
    const isReviewMistake = sceneKey === 'review' && emotion === 'angry';
    const reviewSmileBoost = sceneKey === 'review' && (emotion === 'happy' || emotion === 'smile')
        ? 1.26
        : 1;
    const matchSmileBoost = (sceneKey === 'match' || sceneKey === 'match-result') && (emotion === 'happy' || emotion === 'smile')
        ? 1.52
        : 1;
    const smileBoost = Math.max(reviewSmileBoost, matchSmileBoost);
    const mouthSmileBoost = matchSmileBoost > 1 ? matchSmileBoost : 1;
    const isReviewSmile = reviewSmileBoost > 1;

    if (emotion === 'correct') {
        return {
            browY: (0.16 + (intensity * 0.05)) * homeBoost,
            browForm: -((0.24 + (intensity * 0.06)) * homeBoost),
            angleX: (0.6 + (intensity * 1.1)) * homeBoost,
            angleY: -0.82 * homeBoost,
            angleZ: 2.4 * homeBoost,
            bodyAngleX: 0.2 * homeBoost,
            bodyAngleY: -0.22 * homeBoost,
            bodyAngleZ: 1.1 * homeBoost,
            eyeSmile: clamp(0.46 + (intensity * 0.16), 0, 1),
            eyeSquint: 0.03 + (intensity * 0.03),
            eyeOpen: 0.98,
            angry: 0,
            mouthOpen: 0.28 + (intensity * 0.14),
            mouthX: 0,
            mouthFunnel: 0.48 + (intensity * 0.16),
            mouthShrug: 0.04,
            mouthWiden: 0,
            jawOpen: 0.5 + (intensity * 0.18),
        };
    }

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
                ? 0.005
                : matchSmileBoost > 1
                ? 0.24 + (intensity * 0.12)
                : (0.11 + (intensity * 0.06)) * mouthSmileBoost,
            mouthX: 0,
            mouthFunnel: isReviewSmile
                ? 0.01
                : matchSmileBoost > 1
                ? 0.02
                : Math.max(0.03, (0.06 + (intensity * 0.04)) - ((mouthSmileBoost - 1) * 0.08)),
            mouthShrug: isReviewSmile
                ? 0.06
                : matchSmileBoost > 1
                ? 0.28 + (intensity * 0.12)
                : 0.18 + (intensity * 0.12 * mouthSmileBoost),
            mouthWiden: isReviewSmile
                ? 0.18
                : matchSmileBoost > 1
                ? Math.min(0.94, 0.7 + (intensity * 0.18))
                : Math.min(0.86, (0.48 + (intensity * 0.14)) * mouthSmileBoost),
            jawOpen: isReviewSmile
                ? 0
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
            mouthOpen: isReviewMistake ? 0.002 : 0.01,
            mouthX: isReviewMistake ? -(0.1 + (intensity * 0.05)) : 0,
            mouthFunnel: isReviewMistake ? 0.08 + (intensity * 0.03) : 0.14 + (intensity * 0.05),
            mouthShrug: isReviewMistake ? 0.1 + (intensity * 0.03) : 0.08 + (intensity * 0.04),
            mouthWiden: isReviewMistake ? 0.01 : 0,
            jawOpen: isReviewMistake ? 0.002 : 0.01,
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

export const resolveLive2DExpressionState = (pose = {}, modelConfig = null) => ({
    emotion: getLive2DEmotionKey(pose, modelConfig),
    expression: resolveMappedExpression(modelConfig, pose),
    faceAccent: getLive2DFaceAccentKey(pose),
    animationProfile: getEmotionAnimationProfile(pose, modelConfig),
    parameterProfile: getEmotionParameterProfile(pose, modelConfig),
});
