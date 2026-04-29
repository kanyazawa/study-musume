import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './StoryReader.css';

import { getEpisodeById } from '../data/storyData';
import CharacterStage from '../components/character/CharacterStage';
import TappableVocabText from '../components/TappableVocabText';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { createStoryPose } from '../utils/characterPoseUtils';
import { hasLive2DModelConfig } from '../utils/live2dModelRegistry';

const StoryReader = ({ stats }) => {
    const { episodeId } = useParams();
    const navigate = useNavigate();
    const episode = getEpisodeById(episodeId);

    const [currentScene, setCurrentScene] = useState(0);

    if (!episode) {
        return (
            <div className="story-reader">
                <div className="error-message">
                    <p>エピソードが見つかりません</p>
                    <button onClick={() => navigate('/story')}>戻る</button>
                </div>
            </div>
        );
    }

    const handleNext = () => {
        if (currentScene < episode.scenes.length - 1) {
            setCurrentScene(currentScene + 1);
        } else {
            // ストーリー終了
            navigate('/story');
        }
    };

    const handleSkip = () => {
        navigate('/story');
    };

    const scene = episode.scenes[currentScene];
    const isLastScene = currentScene === episode.scenes.length - 1;

    // --- キャラクター表示ロジック ---
    const characterId = stats?.characterId || 'noah';
    const isRen = characterId === 'ren';
    const preferredRenderer = stats?.characterRenderer;
    const skinId = stats?.equippedSkin || 'default';
    const hasStoryLive2D = hasLive2DModelConfig(characterId, skinId);
    const shouldForceStoryLive2D = characterId === 'noah' && hasStoryLive2D;

    // スピーカーの名前を置き換え（レンを選んでいる場合）
    const displaySpeaker = (scene.speaker === 'ノア' && isRen) ? 'レン' : scene.speaker;
    const isCharacterLine = displaySpeaker === 'ノア' || displaySpeaker === 'レン';
    const shouldShowCharacter = displaySpeaker === 'モノローグ' || isCharacterLine || displaySpeaker === 'あなた';
    const storyPose = createStoryPose(scene, { speaking: isCharacterLine });
    const renderer = resolveCharacterRenderer({
        preferredRenderer: shouldForceStoryLive2D ? 'live2d' : preferredRenderer,
        characterId,
        skinId,
    });

    return (
        <div className="story-reader" onClick={handleNext}>
            {/* 背景 */}
            <div className="story-background">
                {/* 背景画像をここに追加可能 */}
            </div>

            {/* キャラクター画像 */}
            {shouldShowCharacter && (
                <div className={`story-character ${renderer === 'live2d' ? 'is-live2d' : ''}`}>
                    <CharacterStage
                        characterId={characterId}
                        renderer={renderer}
                        skinId={skinId}
                        scene="story"
                        pose={storyPose}
                        className="character-story"
                        imageClassName="character-image"
                        alt={displaySpeaker}
                    />
                </div>
            )}

            {/* テキストボックス */}
            <div className="story-textbox">
                <div className="speaker-name">{displaySpeaker}</div>
                <TappableVocabText text={scene.text} className="story-text" />
            </div>

            {/* コントロール */}
            <div className="story-controls">
                <button className="skip-btn" onClick={(e) => { e.stopPropagation(); handleSkip(); }}>
                    スキップ
                </button>
                <div className="scene-indicator">
                    {currentScene + 1} / {episode.scenes.length}
                </div>
            </div>

            {/* タップヒント */}
            {!isLastScene && (
                <div className="tap-hint">▼ タップして続きを読む</div>
            )}
            {isLastScene && (
                <div className="tap-hint">▼ タップしてストーリー選択に戻る</div>
            )}
        </div>
    );
};

export default StoryReader;
