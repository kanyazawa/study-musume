const LIVE2D_MODEL_REGISTRY = {
    noah: {
        default: {
            modelId: 'free-witch-prototype',
            modelJson: '/live2d/models/free-witch/%E9%AD%94%E5%A5%B3/%E9%AD%94%E5%A5%B3.model3.json',
            sdkScripts: [
                '/live2d/sdk/tyrano/polyfill.min.js',
                '/live2d/sdk/cubism-5-r.4/Core/live2dcubismcore.min.js',
                '/live2d/sdk/tyrano/driver-index.js',
            ],
            runtime: 'tyrano-v4',
            resourcesPath: '/live2d/models/free-witch/',
            modelName: '魔女',
            idleMotion: 'Idle',
            stage: {
                x: 0,
                y: -0.8,
                scale: 8.5,
            },
            expressionMap: {
                angry: 'sq',
                happy: 'yj',
                smile: 'yj',
                sad: 'ku',
                serious: 'h',
                shy: 'zs1',
                surprised: 'xx',
            },
            sourceLabel: 'Free Witch Prototype',
        },
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
