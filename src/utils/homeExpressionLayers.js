import {
    EXPRESSION_LAYER,
    EXPRESSION_LAYER_PRIORITY,
    createExpressionLayer,
    resolveExpressionLayers,
} from './expressionLayers';

export const HOME_EXPRESSION_LAYER = {
    BASE: EXPRESSION_LAYER.BASE,
    REACTION: EXPRESSION_LAYER.REACTION,
    USER_INPUT: EXPRESSION_LAYER.USER_INPUT,
    IMPACT: EXPRESSION_LAYER.IMPACT,
    FORCED: EXPRESSION_LAYER.FORCED,
};

export const HOME_EXPRESSION_LAYER_PRIORITY = EXPRESSION_LAYER_PRIORITY;

export const toVisibleHomeEmotion = (emotion) => {
    switch (emotion) {
        case 'smile':
            return 'happy';
        case 'sad':
            return 'serious';
        default:
            return emotion || 'normal';
    }
};

export const inferHomeEmotion = ({ emotion, speech, tp, maxTp, affectionLevel, examDate }) => {
    if (emotion && emotion !== 'normal') {
        return emotion;
    }

    const normalizedSpeech = String(speech || '').toLowerCase();
    const tpRatio = maxTp > 0 ? tp / maxTp : 0;

    if (tpRatio <= 0.25) {
        return 'serious';
    }

    if (examDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(`${examDate}T00:00:00`);
        if (!Number.isNaN(target.getTime())) {
            const remainingDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (remainingDays >= 0 && remainingDays <= 7) {
                return 'serious';
            }
        }
    }

    if (
        normalizedSpeech.includes('嬉') ||
        normalizedSpeech.includes('安心') ||
        normalizedSpeech.includes('ありがと') ||
        normalizedSpeech.includes('一緒') ||
        normalizedSpeech.includes('いい感じ') ||
        normalizedSpeech.includes('落ち着')
    ) {
        return 'happy';
    }

    if (
        normalizedSpeech.includes('深呼吸') ||
        normalizedSpeech.includes('無理') ||
        normalizedSpeech.includes('休') ||
        normalizedSpeech.includes('集中')
    ) {
        return 'serious';
    }

    if (affectionLevel >= 5) {
        return 'happy';
    }

    return 'normal';
};

export const createHomeExpressionLayer = createExpressionLayer;

export const resolveHomeExpressionLayers = ({
    baseEmotion = 'normal',
    speech = '',
    tp = 0,
    maxTp = 100,
    affectionLevel = 0,
    examDate = '',
    layers = [],
    nowMs = Date.now(),
} = {}) => {
    const inferredBaseEmotion = toVisibleHomeEmotion(inferHomeEmotion({
        emotion: baseEmotion,
        speech,
        tp,
        maxTp,
        affectionLevel,
        examDate,
    }));
    return resolveExpressionLayers({
        baseEmotion: inferredBaseEmotion,
        layers,
        nowMs,
        normalizeEmotion: toVisibleHomeEmotion,
    });
};
