import { EXPRESSION_LAYER, createExpressionLayer, resolveExpressionLayers } from './expressionLayers';

export const getReviewFaceAccent = ({ feedback = null, persistentEmotion = null, correctStreak = 0 } = {}) => {
    if (feedback === 'incorrect' || persistentEmotion === 'angry') {
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
    persistentEmotion = null,
    correctStreak = 0,
    wrongCount = 0,
    priority = 'later',
} = {}) => {
    const reviewFaceAccent = getReviewFaceAccent({ feedback, persistentEmotion, correctStreak });
    const baseReviewEmotion = getBaseReviewEmotion({ renderer, wrongCount, priority });
    const reviewExpressionLayers = [
        persistentEmotion
            ? createExpressionLayer(EXPRESSION_LAYER.REACTION, {
                emotion: persistentEmotion === 'angry'
                    ? 'angry'
                    : persistentEmotion === 'happy'
                        ? 'correct'
                        : renderer === 'live2d' ? 'smile' : 'happy',
                pose: {
                    live2dFaceAccent: reviewFaceAccent,
                },
            })
            : null,
        feedback
            ? createExpressionLayer(EXPRESSION_LAYER.FEEDBACK, {
                emotion: feedback === 'correct' ? 'correct' : 'angry',
                pose: {
                    expression: feedback === 'correct' ? 'correct' : 'angry',
                    intensity: feedback === 'correct' ? 0.74 : 0.46,
                    speaking: feedback === 'correct',
                    effect: feedback === 'correct' ? 'glow' : 'shake',
                    live2dEmotion: feedback === 'correct' ? 'correct' : '',
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
