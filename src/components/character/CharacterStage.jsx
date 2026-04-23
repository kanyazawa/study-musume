import React, { Suspense, lazy } from 'react';
import StaticCharacterImage from './StaticCharacterImage';

const Live2DViewer = lazy(() => import('./Live2DViewer'));

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
        />
    );

    if (effectiveRenderer === 'live2d') {
        return (
            <Suspense fallback={imageFallback}>
                <Live2DViewer
                    characterId={characterId}
                    skinId={skinId}
                    pose={stagedPose}
                    className={combinedClassName}
                    fallback={imageFallback}
                />
            </Suspense>
        );
    }

    return imageFallback;
};

export default CharacterStage;
