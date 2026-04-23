import { createHomePose } from './characterPoseUtils';
import { EXPRESSION_LAYER, createExpressionLayer, resolveExpressionLayers } from './expressionLayers';

export const getMatchFaceAccent = ({ answerFx = null, persistentEmotion = null, correctStreak = 0 } = {}) => {
    if (answerFx === 'wrong' || persistentEmotion === 'angry') {
        return 'angry';
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
    correctStreak = 0,
    isPoseSpeaking = false,
    matchEmotion = 'normal',
    persistentEmotion = null,
    phase = 'playing',
    resultFx = null,
} = {}) => {
    const scene = phase === 'result' ? 'match-result' : 'match';
    const basePose = createHomePose({ emotion: matchEmotion, text: '' }, { speaking: isPoseSpeaking });
    const matchFaceAccent = getMatchFaceAccent({ answerFx, persistentEmotion, correctStreak });
    const live2dFaceAccent = matchFaceAccent === 'angry' ? null : matchFaceAccent;
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
        answerFx
            ? createExpressionLayer(EXPRESSION_LAYER.FEEDBACK, {
                emotion: answerFx === 'correct' ? matchEmotion : 'angry',
                pose: {
                    expression: answerFx === 'correct' ? 'smile' : 'angry',
                    intensity: answerFx === 'correct' ? 0.95 : 0.86,
                    motion: answerFx === 'correct' ? 'talk_soft' : 'present_accept',
                    speaking: answerFx === 'correct',
                    effect: answerFx === 'correct' ? 'glow' : 'shake',
                    live2dEmotion: answerFx === 'correct' ? 'smile' : '',
                    live2dExpression: answerFx === 'correct' ? 'yj' : '',
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
