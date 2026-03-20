import React, { Suspense, lazy } from 'react';
import StaticCharacterImage from './StaticCharacterImage';

const VrmViewer = lazy(() => import('../VrmViewer'));
const Live2DViewer = lazy(() => import('./Live2DViewer'));

const CharacterStage = ({
    characterId = 'noah',
    renderer = 'image',
    skinId = 'default',
    pose = {},
    scene = 'default',
    className = '',
    imageClassName = '',
    imageStyle,
    alt = 'Character',
}) => {
    const effectiveRenderer = renderer;
    const vrmClassName = className || `vrm-${scene}`;
    const imageFallback = (
        <StaticCharacterImage
            characterId={characterId}
            skinId={skinId}
            pose={pose}
            alt={alt}
            className={imageClassName}
            style={imageStyle}
        />
    );

    if (effectiveRenderer === 'live2d') {
        return (
            <Suspense fallback={imageFallback}>
                <Live2DViewer
                    characterId={characterId}
                    skinId={skinId}
                    pose={pose}
                    className={[className, imageClassName].filter(Boolean).join(' ')}
                    fallback={imageFallback}
                />
            </Suspense>
        );
    }

    if (effectiveRenderer === 'vrm') {
        return (
            <Suspense fallback={null}>
                <VrmViewer
                    emotion={pose.expression || pose.emotion || 'normal'}
                    text={pose.text || ''}
                    isSpeaking={Boolean(pose.speaking)}
                    className={vrmClassName}
                />
            </Suspense>
        );
    }

    return imageFallback;
};

export default CharacterStage;
