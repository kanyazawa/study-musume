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
            // Home uses the same model as other scenes, but we hide the controller/prop hand
            // group here so future fixes can be made in config instead of inside viewer logic.
            partOpacityOverrides: {
                home: {
                    Part17: 0,
                    Part18: 0,
                    Part21: 0,
                    Part22: 0,
                    Part23: 0,
                    Part24: 0,
                    Part25: 0,
                    Part26: 0,
                    Part27: 0,
                    Part28: 0,
                    Part29: 0,
                    Part30: 0,
                    Part31: 0,
                    Part33: 0,
                    Part35: 1,
                    Part36: 1,
                    Part37: 1,
                    Part38: 1,
                    Part39: 1,
                    Part40: 1,
                    Part113: 1,
                    Part115: 1,
                },
                match: {
                    Part53: 0,
                },
                'match-result': {
                    Part53: 0,
                },
                review: {
                    Part53: 0,
                },
                study: {
                    Part53: 0,
                },
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
