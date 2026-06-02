import React from 'react';
import './SceneStageLayout.css';

const joinClassNames = (...values) => values.filter(Boolean).join(' ');

const SceneStageLayout = ({
    rootClassName = '',
    rootStyle,
    backgroundClassName = '',
    backgroundStyle,
    characterLayerClassName = '',
    character,
    children,
    beforeCharacter = null,
    afterCharacter = null,
    onClick,
}) => (
    <div className={joinClassNames('scene-stage-layout', rootClassName)} style={rootStyle} onClick={onClick}>
        <div className={joinClassNames('scene-stage-background', backgroundClassName)} style={backgroundStyle} />
        {beforeCharacter}
        {character && (
            <div className={joinClassNames('scene-stage-character-layer', characterLayerClassName)}>
                {character}
            </div>
        )}
        {afterCharacter}
        {children}
    </div>
);

export default SceneStageLayout;
