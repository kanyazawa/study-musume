import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Story.css';

import { STORY_EPISODES } from '../data/storyData';
import { isEpisodeUnlocked, getUnlockedCount, getTotalEpisodes } from '../utils/storyUtils';
import { getAffectionLevel } from '../utils/affectionUtils';

const Story = ({ stats }) => {
    const navigate = useNavigate();
    const affectionLevelInfo = getAffectionLevel(stats.affection);
    const affectionLevel = affectionLevelInfo.level;

    const unlockedCount = getUnlockedCount(affectionLevel);
    const totalCount = getTotalEpisodes();

    const handleEpisodeClick = (episode) => {
        if (isEpisodeUnlocked(episode, affectionLevel)) {
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
                <h1 className="story-title">ストーリー</h1>
                <div className="story-progress">
                    {unlockedCount} / {totalCount}
                </div>
            </div>

            {/* タイトルセクション */}
            <div className="story-intro">
                <h2>ノアとの物語</h2>
                <p>好感度レベルを上げて、ノアとの特別なストーリーを解禁しよう</p>
                <div className="current-level">
                    現在のレベル: <span className="level-badge">Lv.{affectionLevel}</span>
                </div>
            </div>

            {/* エピソード一覧 */}
            <div className="episodes-container">
                {STORY_EPISODES.map((episode) => {
                    const unlocked = isEpisodeUnlocked(episode, affectionLevel);

                    return (
                        <div
                            key={episode.id}
                            className={`episode-card ${unlocked ? 'unlocked' : 'locked'}`}
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
                                    {unlocked ? `Lv.${episode.level}` : '???'}
                                </div>
                                <h3 className="episode-title">
                                    {unlocked ? episode.title : '???'}
                                </h3>
                                <p className="episode-description">
                                    {unlocked ? episode.description : `好感度レベル${episode.level}で解禁`}
                                </p>
                            </div>

                            {/* ステータス */}
                            <div className="episode-status">
                                {unlocked ? (
                                    <span className="status-unlocked">✓ 読める</span>
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
                    <p>💝 プレゼントを贈って好感度を上げると、新しいストーリーが解禁されます</p>
                </div>
            )}
        </div>
    );
};

export default Story;
