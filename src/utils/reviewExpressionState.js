import { EXPRESSION_LAYER, createExpressionLayer, resolveExpressionLayers } from './expressionLayers';

const REVIEW_FEEDBACK_CONFIG = {
    correct: {
        emotion: 'correct',
        expression: 'correct',
        intensity: 0.74,
        speaking: true,
        effect: 'glow',
        live2dEmotion: 'correct',
    },
    chain_correct: {
        emotion: 'correct',
        expression: 'correct',
        intensity: 0.84,
        speaking: true,
        effect: 'glow',
        live2dEmotion: 'correct',
    },
    hard_correct: {
        emotion: 'happy',
        expression: 'happy',
        intensity: 0.86,
        speaking: true,
        effect: 'glow',
        live2dEmotion: 'correct',
    },
    comeback_correct: {
        emotion: 'happy',
        expression: 'happy',
        intensity: 0.92,
        speaking: true,
        effect: 'glow',
        live2dEmotion: 'correct',
    },
    incorrect: {
        emotion: 'angry',
        expression: 'angry',
        intensity: 0.46,
        speaking: false,
        effect: 'shake',
        live2dEmotion: '',
    },
    hard_incorrect: {
        emotion: 'serious',
        expression: 'serious',
        intensity: 0.38,
        speaking: false,
        effect: '',
        live2dEmotion: '',
    },
    timeout: {
        emotion: 'serious',
        expression: 'serious',
        intensity: 0.4,
        speaking: false,
        effect: '',
        live2dEmotion: '',
    },
};

const getReviewReactionEmotion = (persistentEmotion, renderer) => {
    if (persistentEmotion === 'happy') {
        return 'correct';
    }

    if (persistentEmotion === 'smile') {
        return renderer === 'live2d' ? 'smile' : 'happy';
    }

    return persistentEmotion;
};

const getReviewFeedbackConfig = ({ feedback = null, feedbackTone = null } = {}) => {
    if (feedback === 'correct') {
        return REVIEW_FEEDBACK_CONFIG[feedbackTone] || REVIEW_FEEDBACK_CONFIG.correct;
    }

    if (feedback === 'incorrect') {
        return REVIEW_FEEDBACK_CONFIG[feedbackTone] || REVIEW_FEEDBACK_CONFIG.incorrect;
    }

    return null;
};

export const getReviewFaceAccent = ({ feedback = null, feedbackTone = null, persistentEmotion = null, correctStreak = 0 } = {}) => {
    if (feedbackTone === 'incorrect' || feedbackTone === 'hard_incorrect' || feedbackTone === 'timeout') {
        return null;
    }

    if (feedbackTone === 'comeback_correct' || feedbackTone === 'chain_correct') {
        return 'heart';
    }

    if (feedbackTone === 'correct' || feedbackTone === 'hard_correct') {
        return 'star';
    }

    if (feedback === 'incorrect' || persistentEmotion === 'angry' || persistentEmotion === 'serious') {
        return null;
    }

    if (feedback === 'correct' || correctStreak >= 2 || persistentEmotion === 'happy') {
        return 'heart';
    }

    if (correctStreak === 1 || persistentEmotion === 'smile') {
        return 'star';
    }

    return null;
};

const getBaseReviewEmotion = ({ renderer = 'image', wrongCount = 0, priority = 'later' } = {}) => {
    if (renderer === 'live2d') {
        return 'normal';
    }

    if (wrongCount >= 3) {
        return 'serious';
    }

    if (priority === 'urgent') {
        return 'surprised';
    }

    return 'relaxed';
};

export const resolveReviewCharacterPose = ({
    renderer = 'image',
    feedback = null,
    feedbackTone = null,
    persistentEmotion = null,
    correctStreak = 0,
    wrongCount = 0,
    priority = 'later',
} = {}) => {
    const reviewFaceAccent = getReviewFaceAccent({ feedback, feedbackTone, persistentEmotion, correctStreak });
    const baseReviewEmotion = getBaseReviewEmotion({ renderer, wrongCount, priority });
    const reviewFeedbackConfig = getReviewFeedbackConfig({ feedback, feedbackTone });
    const reviewExpressionLayers = [
        persistentEmotion
            ? createExpressionLayer(EXPRESSION_LAYER.REACTION, {
                emotion: getReviewReactionEmotion(persistentEmotion, renderer),
                pose: {
                    live2dFaceAccent: reviewFaceAccent,
                },
            })
            : null,
        reviewFeedbackConfig
            ? createExpressionLayer(EXPRESSION_LAYER.FEEDBACK, {
                emotion: reviewFeedbackConfig.emotion,
                pose: {
                    expression: reviewFeedbackConfig.expression,
                    intensity: reviewFeedbackConfig.intensity,
                    speaking: reviewFeedbackConfig.speaking,
                    effect: reviewFeedbackConfig.effect,
                    live2dEmotion: reviewFeedbackConfig.live2dEmotion,
                    live2dFaceAccent: reviewFaceAccent,
                },
            })
            : null,
    ].filter(Boolean);
    const expressionState = resolveExpressionLayers({
        baseEmotion: baseReviewEmotion,
        layers: reviewExpressionLayers,
    });

    return {
        reviewFaceAccent,
        visibleReviewFaceAccent: renderer === 'live2d' ? null : reviewFaceAccent,
        expressionState,
        characterPose: {
            emotion: expressionState.emotion,
            expression: expressionState.pose.expression || expressionState.emotion,
            scene: 'review',
            intensity: expressionState.pose.intensity
                ?? (wrongCount >= 3 ? 0.42 : priority === 'urgent' ? 0.4 : 0.32),
            motion: null,
            idle: 'gentle',
            gaze: 'camera',
            speaking: Boolean(expressionState.pose.speaking),
            text: '',
            effect: expressionState.pose.effect || '',
            live2dEmotion: expressionState.pose.live2dEmotion || '',
            live2dFaceAccent: expressionState.pose.live2dFaceAccent,
        },
    };
};
