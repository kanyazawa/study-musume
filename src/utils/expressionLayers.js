export const EXPRESSION_LAYER = {
    BASE: 'base',
    SCENE: 'scene',
    REACTION: 'reaction',
    USER_INPUT: 'user-input',
    FEEDBACK: 'feedback',
    IMPACT: 'impact',
    FORCED: 'forced',
};

export const EXPRESSION_LAYER_PRIORITY = {
    [EXPRESSION_LAYER.BASE]: 0,
    [EXPRESSION_LAYER.SCENE]: 10,
    [EXPRESSION_LAYER.REACTION]: 20,
    [EXPRESSION_LAYER.USER_INPUT]: 40,
    [EXPRESSION_LAYER.FEEDBACK]: 50,
    [EXPRESSION_LAYER.IMPACT]: 60,
    [EXPRESSION_LAYER.FORCED]: 80,
};

const defaultNormalizeEmotion = (emotion) => emotion || 'normal';

const getLayerPriority = (layer) => {
    if (typeof layer?.priority === 'number') {
        return layer.priority;
    }

    return EXPRESSION_LAYER_PRIORITY[layer?.type] ?? EXPRESSION_LAYER_PRIORITY[EXPRESSION_LAYER.REACTION];
};

const isLayerActive = (layer, nowMs) => {
    if (!layer) {
        return false;
    }

    const expiresAt = Number(layer.expiresAt || 0);
    return !expiresAt || expiresAt > nowMs;
};

export const createExpressionLayer = (type, options = {}) => ({
    type,
    priority: options.priority ?? EXPRESSION_LAYER_PRIORITY[type],
    emotion: options.emotion,
    pose: options.pose || {},
    expiresAt: options.expiresAt || 0,
});

export const resolveExpressionLayers = ({
    baseEmotion = 'normal',
    basePose = {},
    layers = [],
    nowMs = Date.now(),
    normalizeEmotion = defaultNormalizeEmotion,
} = {}) => {
    const normalizedBaseEmotion = normalizeEmotion(baseEmotion);
    const baseLayer = createExpressionLayer(EXPRESSION_LAYER.BASE, {
        emotion: normalizedBaseEmotion,
        pose: {
            ...basePose,
            emotion: normalizedBaseEmotion,
        },
    });
    const activeLayers = [baseLayer, ...layers.filter((layer) => isLayerActive(layer, nowMs))]
        .sort((left, right) => getLayerPriority(left) - getLayerPriority(right));
    const pose = {};
    let emotion = normalizedBaseEmotion;
    let emotionSource = EXPRESSION_LAYER.BASE;

    activeLayers.forEach((layer) => {
        Object.assign(pose, layer.pose || {});

        if (layer.emotion) {
            emotion = normalizeEmotion(layer.emotion);
            emotionSource = layer.type;
        } else if (layer.pose?.emotion) {
            emotion = normalizeEmotion(layer.pose.emotion);
            emotionSource = layer.type;
        }

        pose.emotion = emotion;
    });

    return {
        emotion,
        emotionSource,
        pose,
        activeLayers,
    };
};
