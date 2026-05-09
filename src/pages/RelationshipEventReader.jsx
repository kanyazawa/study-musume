import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './StoryReader.css';
import './RelationshipEventReader.css';

import CharacterStage from '../components/character/CharacterStage';
import { getCharacterLabel } from '../data/characterData';
import { getRelationshipEventById } from '../data/relationshipEvents';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { createStoryPose } from '../utils/characterPoseUtils';
import { applyRelationshipProgress, isRelationshipEventRead, isRelationshipEventUnlocked, markRelationshipEventRead } from '../utils/relationshipEventUtils';

const RelationshipEventReader = ({ stats, updateStats }) => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const event = getRelationshipEventById(eventId);
    const [currentScene, setCurrentScene] = useState(0);

    const characterId = stats?.characterId || 'noah';
    const characterLabel = getCharacterLabel(characterId);
    const preferredRenderer = stats?.characterRenderer;
    const renderer = resolveCharacterRenderer({
        preferredRenderer,
        characterId,
        skinId: stats?.equippedSkin || 'default',
    });

    const isUnlocked = useMemo(() => isRelationshipEventUnlocked(stats, eventId), [eventId, stats]);

    if (!event || event.characterId !== characterId) {
        return (
            <div className="relationship-event-reader">
                <div className="error-message">
                    <p>イベントが見つかりません</p>
                    <button onClick={() => navigate('/character')}>戻る</button>
                </div>
            </div>
        );
    }

    if (!isUnlocked) {
        return (
            <div className="relationship-event-reader">
                <div className="error-message">
                    <p>このイベントはまだ解放されていません</p>
                    <button onClick={() => navigate('/character', { state: { openPanel: 'events' } })}>戻る</button>
                </div>
            </div>
        );
    }

    const scene = event.scenes[currentScene];
    const isLastScene = currentScene === event.scenes.length - 1;
    const displaySpeaker = scene.speaker === 'ノア' ? characterLabel : scene.speaker;
    const isCharacterSpeaking = displaySpeaker === characterLabel || displaySpeaker === 'あなた';
    const storyPose = createStoryPose(scene, { speaking: displaySpeaker === characterLabel });

    const finishEvent = () => {
        const alreadyRead = isRelationshipEventRead(stats, event.id);

        if (!alreadyRead && updateStats) {
            updateStats((currentStats) => {
                const rewardedStats = {
                    ...currentStats,
                    affection: (currentStats?.affection || 0) + Number(event?.rewards?.affection || 0),
                    diamonds: (currentStats?.diamonds || 0) + Number(event?.rewards?.diamonds || 0),
                    ...markRelationshipEventRead(currentStats, event.id),
                };

                return applyRelationshipProgress(rewardedStats).nextStats;
            });

            const rewards = [];
            if (event?.rewards?.affection) rewards.push(`好感度 +${event.rewards.affection}`);
            if (event?.rewards?.diamonds) rewards.push(`ダイヤ +${event.rewards.diamonds}`);
            if (rewards.length > 0) {
                alert(`イベント読了！\n${rewards.join('\n')}`);
            }
        }

        navigate('/character', { state: { openPanel: 'events' } });
    };

    const handleNext = () => {
        if (!isLastScene) {
            setCurrentScene((current) => current + 1);
            return;
        }

        finishEvent();
    };

    return (
        <div className="relationship-event-reader" onClick={handleNext}>
            <div className="relationship-event-background" />

            <div className="relationship-event-header">
                <div className="relationship-event-chip">Relationship Event</div>
                <div className="relationship-event-title">{event.title}</div>
            </div>

            {isCharacterSpeaking && (
                <div className="relationship-event-character">
                    <CharacterStage
                        characterId={characterId}
                        renderer={renderer}
                        skinId={stats?.equippedSkin || 'default'}
                        scene="story"
                        pose={storyPose}
                        className="character-story"
                        imageClassName="character-image"
                        alt={displaySpeaker}
                    />
                </div>
            )}

            <div className="relationship-event-textbox">
                <div className="speaker-name">{displaySpeaker}</div>
                <div className="story-text">{scene.text}</div>
            </div>

            <div className="story-controls">
                <button
                    className="skip-btn"
                    onClick={(eventObject) => {
                        eventObject.stopPropagation();
                        navigate('/character', { state: { openPanel: 'events' } });
                    }}
                >
                    戻る
                </button>
                <div className="scene-indicator">
                    {currentScene + 1} / {event.scenes.length}
                </div>
            </div>

            <div className="tap-hint">
                {isLastScene ? '▼ タップしてイベント一覧へ戻る' : '▼ タップして続きを読む'}
            </div>
        </div>
    );
};

export default RelationshipEventReader;
