import { hasLive2DModelConfig } from './live2dModelRegistry';

export const resolveCharacterRenderer = ({
    preferredRenderer = 'auto',
    characterId = 'noah',
    skinId = 'default',
}) => {
    const hasLive2D = hasLive2DModelConfig(characterId, skinId);

    if (preferredRenderer === 'live2d') {
        return hasLive2D ? 'live2d' : 'image';
    }

    if (preferredRenderer === 'image') {
        return 'image';
    }

    if (hasLive2D) {
        return 'live2d';
    }

    return 'image';
};

export default resolveCharacterRenderer;
