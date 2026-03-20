const LIVE2D_MODEL_REGISTRY = {
    noah: {
        default: null,
    },
    ren: {
        default: null,
    },
};

export const getLive2DModelConfig = (characterId = 'noah', skinId = 'default') => {
    const characterModels = LIVE2D_MODEL_REGISTRY[characterId] || LIVE2D_MODEL_REGISTRY.noah;
    return characterModels[skinId] || characterModels.default || null;
};

export const hasLive2DModelConfig = (characterId = 'noah', skinId = 'default') =>
    Boolean(getLive2DModelConfig(characterId, skinId));

export const getLive2DModelStatusHints = (characterId = 'noah', skinId = 'default') => {
    const config = getLive2DModelConfig(characterId, skinId);
    if (!config) {
        return null;
    }

    return {
        modelJson: config.modelJson || '',
        sdkScripts: config.sdkScripts || [],
        modelId: config.modelId || `${characterId}:${skinId}`,
    };
};

export default LIVE2D_MODEL_REGISTRY;
