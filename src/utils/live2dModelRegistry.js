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
            stageOverrides: {
                preview: {
                    y: -0.22,
                    scale: 6.4,
                },
                'preview-close': {
                    y: -0.58,
                    scale: 7.85,
                },
            },
            expressionMap: {
                angry: 'sq',
                correct: 'yj',
                happy: 'yj',
                smile: 'yj',
                sad: 'ku',
                serious: 'h',
                shy: 'zs1',
            },
            emotionProfileMap: {
                angry: 'happy',
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
            accessoryPartOpacityDefaults: {
                Part53: 0,
                Part42: 0,
                Part43: 0,
                Part45: 0,
                Part149: 0,
                ArtMesh201_Skinning: 0,
                Part71: 0,
                ArtMesh202_Skinning: 0,
                Part72: 0,
                ArtMesh203_Skinning: 0,
                Part73: 0,
            },
            accessoryPartOpacityOverrides: {
                accessory_glasses: {
                    Part53: 1,
                },
                accessory_witch_hat: {
                    Part42: 1,
                    Part43: 1,
                    Part45: 1,
                    Part149: 1,
                    ArtMesh201_Skinning: 1,
                    Part71: 1,
                    ArtMesh202_Skinning: 1,
                    Part72: 1,
                    ArtMesh203_Skinning: 1,
                    Part73: 1,
                },
            },
            sourceLabel: 'Free Witch Prototype',
        },
    },
    ren: {
        default: null,
    },
    sparkle: {
        default: {
            modelId: 'sparkle-prototype',
            modelJson: '/live2d/models/sparkle/Sparkle/Sparkle.model3.json',
            sdkScripts: [
                '/live2d/sdk/tyrano/polyfill.min.js',
                '/live2d/sdk/cubism-5-r.4/Core/live2dcubismcore.min.js',
                '/live2d/sdk/tyrano/driver-index.js',
            ],
            runtime: 'tyrano-v4',
            resourcesPath: '/live2d/models/sparkle/',
            modelName: 'Sparkle',
            idleMotion: '',
            stage: {
                x: 0,
                y: -0.76,
                scale: 6.9,
            },
            stageOverrides: {
                preview: {
                    y: -0.18,
                    scale: 5.1,
                },
                'preview-close': {
                    y: -0.5,
                    scale: 6.1,
                },
            },
            sourceLabel: 'Sparkle Prototype',
        },
    },
};

export const getLive2DModelConfig = (characterId = 'noah', skinId = 'default') => {
    const characterModels = LIVE2D_MODEL_REGISTRY[characterId];
    if (!characterModels) {
        return null;
    }
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

export const getAllLive2DModelConfigs = () => {
    const uniqueConfigs = new Map();

    Object.values(LIVE2D_MODEL_REGISTRY).forEach((characterModels) => {
        Object.values(characterModels || {}).forEach((config) => {
            if (!config?.modelJson) {
                return;
            }

            const key = config.modelJson || config.modelId || config.modelName;
            if (!uniqueConfigs.has(key)) {
                uniqueConfigs.set(key, config);
            }
        });
    });

    return Array.from(uniqueConfigs.values());
};

export default LIVE2D_MODEL_REGISTRY;
