import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Story.css';

import { getCharacterLabel } from '../data/characterData';
import { STORY_EPISODES } from '../data/storyData';
import {
    getEpisodeUnlockState,
    getOwnedStoryKeys,
    getStoryEpisodeState,
    getUnlockedCount,
    getTotalEpisodes,
    isEpisodeUnlocked,
    unlockEpisodeWithKey,
} from '../utils/storyUtils';
import { getAffectionLevel } from '../utils/affectionUtils';

const Story = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const affectionLevelInfo = getAffectionLevel(stats.affection);
    const affectionLevel = affectionLevelInfo.level;
    const characterLabel = getCharacterLabel(stats?.characterId);
    const inventory = stats?.inventory || [];
    const ownedStoryKeys = getOwnedStoryKeys(inventory);
    const storyEpisodeState = getStoryEpisodeState(stats);

    const unlockedCount = getUnlockedCount(affectionLevel, inventory, storyEpisodeState.unlockedIds);
    const totalCount = getTotalEpisodes();

    const handleEpisodeClick = (episode) => {
        const unlockState = getEpisodeUnlockState(
            episode,
            affectionLevel,
            inventory,
            storyEpisodeState.unlockedIds,
        );

        if (unlockState.canUnlockNow && typeof updateStats === 'function') {
            updateStats((currentStats) => unlockEpisodeWithKey(currentStats, episode));
            navigate(`/story/${episode.id}`);
            return;
        }

        if (isEpisodeUnlocked(episode, affectionLevel, inventory, storyEpisodeState.unlockedIds)) {
            navigate(`/story/${episode.id}`);
        }
    };

    return (
        <div className="story-screen">
            {/* ヘッダー */}
            <div className="story-header">
                <button className="back-btn" onClick={() => navigate('/home')}>
                    ← 戻る
                </button>
                <h1 className="story-title">キャラストーリー</h1>
                <div className="story-progress">
                    {unlockedCount} / {totalCount}
                </div>
            </div>

            {/* タイトルセクション */}
            <div className="story-intro">
                <h2>{characterLabel}との物語</h2>
                <p>親密度を上げつつ、特別なストーリーキーも集めて{characterLabel}との物語を解禁しよう</p>
                <div className="current-level">
                    現在のレベル: <span className="level-badge">Lv.{affectionLevel}</span>
                </div>
                <div className="story-key-summary">
                    <span className="story-key-pill">所持キー {ownedStoryKeys.length}種</span>
                    <span className="story-key-summary-text">
                        {ownedStoryKeys.length > 0
                            ? ownedStoryKeys.map((item) => item.name).join(' / ')
                            : 'まだストーリーキーを持っていません'}
                    </span>
                </div>
            </div>

            {/* エピソード一覧 */}
            <div className="episodes-container">
                {STORY_EPISODES.map((episode) => {
                    const unlockState = getEpisodeUnlockState(
                        episode,
                        affectionLevel,
                        inventory,
                        storyEpisodeState.unlockedIds,
                    );
                    const unlocked = unlockState.unlocked;
                    const revealed = unlocked || unlockState.canUnlockNow || unlockState.affectionMet;

                    return (
                        <div
                            key={episode.id}
                            className={`episode-card ${unlocked ? 'unlocked' : unlockState.canUnlockNow ? 'ready' : 'locked'}`}
                            onClick={() => handleEpisodeClick(episode)}
                        >
                            {/* サムネイル */}
                            <div className="episode-thumbnail">
                                <span className="episode-icon">
                                    {unlocked ? episode.thumbnail : '🔒'}
                                </span>
                            </div>

                            {/* エピソード情報 */}
                            <div className="episode-info">
                                <div className="episode-level">
                                    {`Lv.${episode.level}`}
                                </div>
                                <h3 className="episode-title">
                                    {revealed ? episode.title : '???'}
                                </h3>
                                <p className="episode-description">
                                    {(unlocked || unlockState.canUnlockNow) ? episode.description : unlockState.lockedReason}
                                </p>
                                {episode.requiredStoryItemId && (
                                    <div className="episode-key-line">
                                        🔑 必要キー: {unlockState.requiredItem?.name || 'ストーリーキー'}
                                    </div>
                                )}
                            </div>

                            {/* ステータス */}
                            <div className="episode-status">
                                {unlocked ? (
                                    <span className="status-unlocked">✓ 解放済み</span>
                                ) : unlockState.canUnlockNow ? (
                                    <span className="status-ready">✨ 解放する</span>
                                ) : unlockState.affectionMet ? (
                                    <span className="status-key">🔑 キー不足</span>
                                ) : (
                                    <span className="status-locked">🔒 ロック中</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* フッターヒント */}
            {unlockedCount < totalCount && (
                <div className="story-hint">
                    <p>💝 親密度を上げつつ、ガチャでストーリーキーを集めると後半のキャラ物語が読めます</p>
                </div>
            )}
        </div>
    );
};

export default Story;
