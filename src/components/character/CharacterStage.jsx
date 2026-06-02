import React from 'react';
import StaticCharacterImage from './StaticCharacterImage';
import Live2DViewer from './Live2DViewer';

const CharacterStage = ({
    characterId = 'noah',
    renderer = 'image',
    skinId = 'default',
    accessoryIds = [],
    pose = {},
    scene = 'default',
    className = '',
    imageClassName = '',
    imageStyle,
    sourceOverride,
    disableFaceEffects = false,
    chromaKey,
    alt = 'Character',
}) => {
    const effectiveRenderer = renderer;
    const combinedClassName = [className, imageClassName].filter(Boolean).join(' ');
    // Keep the resolved scene on both image and Live2D renderers so scene-specific
    // pose rules (for example home-only Live2D part overrides) can be applied reliably.
    const stagedPose = {
        ...pose,
        scene: pose?.scene || scene,
        accessoryIds: pose?.accessoryIds || accessoryIds,
    };
    const imageFallback = (
        <StaticCharacterImage
            characterId={characterId}
            skinId={skinId}
            pose={stagedPose}
            alt={alt}
            className={combinedClassName}
            style={imageStyle}
            sourceOverride={sourceOverride}
            disableFaceEffects={disableFaceEffects}
            chromaKey={chromaKey}
        />
    );

    if (effectiveRenderer === 'live2d') {
        return (
            <Live2DViewer
                characterId={characterId}
                skinId={skinId}
                pose={stagedPose}
                className={combinedClassName}
                fallback={imageFallback}
            />
        );
    }

    return imageFallback;
};

export default CharacterStage;
