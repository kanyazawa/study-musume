import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './StoryReader.css';

import { getEpisodeById } from '../data/storyData';
import { getCharacterLabel } from '../data/characterData';
import CharacterStage from '../components/character/CharacterStage';
import SceneStageLayout from '../components/layout/SceneStageLayout';
import TappableVocabText from '../components/TappableVocabText';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { createStoryPose } from '../utils/characterPoseUtils';
import { hasLive2DModelConfig } from '../utils/live2dModelRegistry';
import { getAffectionLevel } from '../utils/affectionUtils';
import { getEpisodeUnlockState, getStoryEpisodeState, unlockEpisodeWithKey } from '../utils/storyUtils';

const StoryReader = ({ stats, updateStats }) => {
    const { episodeId } = useParams();
    const navigate = useNavigate();
    const episode = getEpisodeById(episodeId);
    const affectionLevel = getAffectionLevel(stats?.affection || 0).level;
    const storyEpisodeState = getStoryEpisodeState(stats);
    const unlockState = episode
        ? getEpisodeUnlockState(episode, affectionLevel, stats?.inventory || [], storyEpisodeState.unlockedIds)
        : null;

    const [currentScene, setCurrentScene] = useState(0);

    useEffect(() => {
        if (!episode || !unlockState?.canUnlockNow || typeof updateStats !== 'function') {
            return;
        }

        updateStats((currentStats) => unlockEpisodeWithKey(currentStats, episode));
    }, [episode, unlockState?.canUnlockNow, updateStats]);

    if (!episode) {
        return (
            <div className="story-reader">
                <div className="error-message">
                    <p>エピソードが見つかりません</p>
                    <button onClick={() => navigate('/story')}>物語一覧へ</button>
                </div>
            </div>
        );
    }

    if (!unlockState?.unlocked && !unlockState?.canUnlockNow) {
        return (
            <div className="story-reader">
                <div className="error-message">
                    <p>このキャラ物語はまだ解放されていません</p>
                    <p>{unlockState?.lockedReason || '条件を満たすと読めるようになります'}</p>
                    <button onClick={() => navigate('/story')}>物語一覧へ</button>
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
    const characterLabel = getCharacterLabel(characterId);
    const preferredRenderer = stats?.characterRenderer;
    const skinId = stats?.equippedSkin || 'default';
    const hasStoryLive2D = hasLive2DModelConfig(characterId, skinId);
    const shouldForceStoryLive2D = characterId === 'noah' && hasStoryLive2D;

    const displaySpeaker = scene.speaker === 'ノア' ? characterLabel : scene.speaker;
    const isCharacterLine = displaySpeaker === characterLabel;
    const shouldShowCharacter = displaySpeaker === 'モノローグ' || isCharacterLine || displaySpeaker === 'あなた';
    const storyPose = createStoryPose(scene, { speaking: isCharacterLine });
    const renderer = resolveCharacterRenderer({
        preferredRenderer: shouldForceStoryLive2D ? 'live2d' : preferredRenderer,
        characterId,
        skinId,
    });

    return (
        <SceneStageLayout
            rootClassName="story-reader"
            backgroundClassName="story-background"
            character={shouldShowCharacter ? (
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
            ) : null}
            onClick={handleNext}
        >

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
                <div className="tap-hint">▼ タップして物語一覧に戻る</div>
            )}
        </SceneStageLayout>
    );
};

export default StoryReader;
