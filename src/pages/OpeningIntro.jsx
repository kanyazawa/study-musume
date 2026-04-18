import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OpeningIntro.css';
import CharacterStage from '../components/character/CharacterStage';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { createStoryPose } from '../utils/characterPoseUtils';
import { getOpeningIntroContent, OPENING_GUIDE_CARDS } from '../data/openingIntroData';

const OpeningIntro = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const [currentScene, setCurrentScene] = useState(0);
    const characterId = stats?.characterId || 'noah';
    const renderer = resolveCharacterRenderer({
        preferredRenderer: stats?.characterRenderer,
        characterId,
        skinId: stats?.equippedSkin || 'default',
    });
    const introContent = useMemo(() => getOpeningIntroContent(characterId), [characterId]);
    const scene = introContent.scenes[currentScene];
    const isLastScene = currentScene === introContent.scenes.length - 1;
    const displaySpeaker = scene?.speaker === 'partner'
        ? introContent.partnerName
        : scene?.speaker === 'you'
            ? 'あなた'
            : '';
    const storyPose = useMemo(
        () => createStoryPose(scene, { speaking: scene?.speaker === 'partner' }),
        [scene],
    );

    const completeIntro = (destination = '/home') => {
        updateStats?.({
            needsFirstPlayIntro: false,
            hasCompletedFirstPlayIntro: true,
        });
        navigate(destination, { replace: true });
    };

    const handleNext = () => {
        if (isLastScene) return;
        setCurrentScene((value) => Math.min(value + 1, introContent.scenes.length - 1));
    };

    return (
        <div className="opening-intro" onClick={handleNext}>
            <div className="opening-intro-backdrop" aria-hidden="true">
                <div className="opening-intro-bg" />
                <div className="opening-intro-vignette" />
                <div className="opening-intro-glow glow-left" />
                <div className="opening-intro-glow glow-right" />
            </div>

            <div className="opening-intro-topbar">
                <div className="opening-intro-title-block">
                    <span className="opening-intro-kicker">{introContent.chapterTitle}</span>
                    <strong>{introContent.lead}</strong>
                </div>
                <div className="opening-intro-controls">
                    <div className="opening-intro-progress">
                        {currentScene + 1} / {introContent.scenes.length}
                    </div>
                    <button
                        type="button"
                        className="opening-intro-skip"
                        onClick={(event) => {
                            event.stopPropagation();
                            completeIntro('/home');
                        }}
                    >
                        スキップ
                    </button>
                </div>
            </div>

            <div className="opening-intro-character">
                <CharacterStage
                    characterId={characterId}
                    renderer={renderer}
                    skinId={stats?.equippedSkin || 'default'}
                    scene="story"
                    pose={storyPose}
                    className="opening-intro-character-stage"
                    imageClassName="opening-intro-character-image"
                    alt={introContent.partnerName}
                />
            </div>

            <div className="opening-intro-bottom">
                <div className="opening-intro-textbox">
                    <div className="opening-intro-speaker">{displaySpeaker}</div>
                    <p className="opening-intro-text">{scene?.text}</p>
                </div>

                {isLastScene ? (
                    <div
                        className="opening-intro-guide"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="opening-intro-guide-header">
                            <span className="opening-intro-kicker">はじめに覚えること</span>
                            <h2>最初はこの3つだけ見れば大丈夫</h2>
                        </div>

                        <div className="opening-intro-guide-grid">
                            {OPENING_GUIDE_CARDS.map((card) => (
                                <article key={card.title} className="opening-intro-guide-card">
                                    <h3>{card.title}</h3>
                                    <p>{card.body}</p>
                                </article>
                            ))}
                        </div>

                        <div className="opening-intro-actions">
                            <button
                                type="button"
                                className="opening-intro-secondary"
                                onClick={() => completeIntro('/home')}
                            >
                                いったんホームを見る
                            </button>
                            <button
                                type="button"
                                className="opening-intro-primary"
                                onClick={() => completeIntro('/study')}
                            >
                                最初の授業へ進む
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="opening-intro-hint">タップして続きを読む</div>
                )}
            </div>
        </div>
    );
};

export default OpeningIntro;
