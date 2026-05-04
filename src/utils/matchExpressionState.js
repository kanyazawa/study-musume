import { createHomePose } from './characterPoseUtils';
import { EXPRESSION_LAYER, createExpressionLayer, resolveExpressionLayers } from './expressionLayers';

const MATCH_FEEDBACK_CONFIG = {
    correct: {
        emotion: 'smile',
        expression: 'smile',
        intensity: 0.95,
        motion: 'talk_soft',
        speaking: true,
        effect: 'glow',
        live2dEmotion: 'smile',
        live2dExpression: 'yj',
    },
    chain_correct: {
        emotion: 'happy',
        expression: 'smile',
        intensity: 1,
        motion: 'present_happy',
        speaking: true,
        effect: 'glow',
        live2dEmotion: 'smile',
        live2dExpression: 'yj',
    },
    comeback_correct: {
        emotion: 'happy',
        expression: 'happy',
        intensity: 1.04,
        motion: 'present_happy',
        speaking: true,
        effect: 'glow',
        live2dEmotion: 'smile',
        live2dExpression: 'yj',
    },
    clutch_correct: {
        emotion: 'surprised',
        expression: 'surprised',
        intensity: 1.02,
        motion: 'present_happy',
        speaking: true,
        effect: 'glow',
        live2dEmotion: 'smile',
        live2dExpression: 'yj',
    },
    incorrect: {
        emotion: 'angry',
        expression: 'angry',
        intensity: 0.86,
        motion: 'present_accept',
        speaking: false,
        effect: 'shake',
        live2dEmotion: '',
        live2dExpression: '',
    },
    timeout: {
        emotion: 'serious',
        expression: 'serious',
        intensity: 0.72,
        motion: 'present_accept',
        speaking: false,
        effect: '',
        live2dEmotion: '',
        live2dExpression: '',
    },
};

const getMatchFeedbackConfig = ({ answerFx = null, answerTone = null, matchEmotion = 'normal' } = {}) => {
    if (answerFx === 'correct') {
        if (answerTone === 'chain_correct') return MATCH_FEEDBACK_CONFIG.chain_correct;
        if (answerTone === 'comeback_correct') return MATCH_FEEDBACK_CONFIG.comeback_correct;
        if (answerTone === 'clutch_correct') return MATCH_FEEDBACK_CONFIG.clutch_correct;
        return {
            ...MATCH_FEEDBACK_CONFIG.correct,
            emotion: matchEmotion,
        };
    }

    if (answerFx === 'wrong') {
        if (answerTone === 'timeout') return MATCH_FEEDBACK_CONFIG.timeout;
        return MATCH_FEEDBACK_CONFIG.incorrect;
    }

    return null;
};

export const getMatchFaceAccent = ({ answerFx = null, answerTone = null, persistentEmotion = null, correctStreak = 0 } = {}) => {
    if (answerTone === 'timeout') {
        return null;
    }

    if (answerTone === 'comeback_correct' || answerTone === 'chain_correct') {
        return 'heart';
    }

    if (answerTone === 'correct' || answerTone === 'clutch_correct') {
        return 'star';
    }

    if (answerFx === 'wrong' || persistentEmotion === 'angry') {
        return 'angry';
    }

    if (persistentEmotion === 'serious') {
        return null;
    }

    if (answerFx === 'correct') {
        return persistentEmotion === 'happy' || correctStreak >= 2 ? 'heart' : 'star';
    }

    if (persistentEmotion === 'happy') {
        return 'heart';
    }

    if (persistentEmotion === 'smile') {
        return 'star';
    }

    return null;
};

export const resolveMatchCharacterPose = ({
    answerFx = null,
    answerTone = null,
    correctStreak = 0,
    isPoseSpeaking = false,
    matchEmotion = 'normal',
    persistentEmotion = null,
    phase = 'playing',
    resultFx = null,
} = {}) => {
    const scene = phase === 'result' ? 'match-result' : 'match';
    const basePose = createHomePose({ emotion: matchEmotion, text: '' }, { speaking: isPoseSpeaking });
    const matchFaceAccent = getMatchFaceAccent({ answerFx, answerTone, persistentEmotion, correctStreak });
    const live2dFaceAccent = matchFaceAccent === 'angry' ? null : matchFaceAccent;
    const matchFeedbackConfig = getMatchFeedbackConfig({ answerFx, answerTone, matchEmotion });
    const expressionLayers = [
        persistentEmotion
            ? createExpressionLayer(EXPRESSION_LAYER.REACTION, {
                emotion: persistentEmotion,
                pose: {
                    live2dFaceAccent,
                },
            })
            : null,
        resultFx === 'victory'
            ? createExpressionLayer(EXPRESSION_LAYER.FEEDBACK, {
                emotion: 'happy',
                pose: {
                    intensity: 0.92,
                    motion: 'present_happy',
                    effect: 'glow',
                },
            })
            : null,
        matchFeedbackConfig
            ? createExpressionLayer(EXPRESSION_LAYER.FEEDBACK, {
                emotion: matchFeedbackConfig.emotion,
                pose: {
                    expression: matchFeedbackConfig.expression,
                    intensity: matchFeedbackConfig.intensity,
                    motion: matchFeedbackConfig.motion,
                    speaking: matchFeedbackConfig.speaking,
                    effect: matchFeedbackConfig.effect,
                    live2dEmotion: matchFeedbackConfig.live2dEmotion,
                    live2dExpression: matchFeedbackConfig.live2dExpression,
                    live2dFaceAccent,
                },
            })
            : null,
    ].filter(Boolean);
    const expressionState = resolveExpressionLayers({
        baseEmotion: matchEmotion,
        basePose: {
            ...basePose,
            scene,
        },
        layers: expressionLayers,
    });

    return {
        expressionState,
        matchFaceAccent,
        visibleFaceAccent: matchFaceAccent,
        matchPose: {
            ...expressionState.pose,
            emotion: expressionState.emotion,
            expression: expressionState.pose.expression || expressionState.emotion,
            intensity: expressionState.pose.intensity
                ?? (matchEmotion === 'happy' || matchEmotion === 'smile'
                    ? 0.72
                    : matchEmotion === 'serious' || matchEmotion === 'angry' || matchEmotion === 'surprised'
                        ? 0.68
                        : basePose.intensity),
            motion: expressionState.pose.motion || (isPoseSpeaking
                ? basePose.motion
                : phase === 'countdown'
                    ? 'talk'
                    : 'idle_home'),
            speaking: Boolean(expressionState.pose.speaking || basePose.speaking),
            effect: expressionState.pose.effect || '',
            live2dEmotion: expressionState.pose.live2dEmotion || '',
            live2dExpression: expressionState.pose.live2dExpression || '',
            live2dFaceAccent: expressionState.pose.live2dFaceAccent,
        },
    };
};
