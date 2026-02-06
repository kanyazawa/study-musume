import React, { useState, useEffect } from 'react';
import './AchievementModal.css';
import {
    getAllAchievementsWithProgress,
    getAchievementStats,
    getUnlockedTitles,
} from '../utils/achievementUtils';
import {
    ACHIEVEMENT_CATEGORIES,
    CATEGORY_INFO,
    RARITY_INFO,
} from '../data/achievements';
import { X, Award, Lock } from 'lucide-react';

const AchievementModal = ({ onClose, stats, updateStats }) => {
    const [achievements, setAchievements] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [achievementStats, setAchievementStats] = useState({ unlocked: 0, total: 0, percentage: 0 });
    const [unlockedTitles, setUnlockedTitles] = useState([]);
    const [selectedTitle, setSelectedTitle] = useState(stats?.selectedTitle || null);

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        const allAchievements = getAllAchievementsWithProgress();
        setAchievements(allAchievements);
        setAchievementStats(getAchievementStats());
        setUnlockedTitles(getUnlockedTitles());
    };

    const filteredAchievements = selectedCategory === 'all'
        ? achievements
        : achievements.filter(a => a.category === selectedCategory);

    const handleTitleSelect = (titleId) => {
        setSelectedTitle(titleId);
        if (updateStats) {
            updateStats({ selectedTitle: titleId });
        }
    };

    return (
        <div className="achievement-modal-overlay" onClick={onClose}>
            <div className="achievement-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="achievement-header">
                    <div className="achievement-title-section">
                        <Award size={28} color="#ffd700" />
                        <h2>実績 & 称号</h2>
                    </div>
                    <button className="achievement-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Stats Overview */}
                <div className="achievement-overview">
                    <div className="overview-stat">
                        <div className="stat-label">達成率</div>
                        <div className="stat-value">{achievementStats.percentage}%</div>
                    </div>
                    <div className="overview-stat">
                        <div className="stat-label">実績</div>
                        <div className="stat-value">
                            {achievementStats.unlocked}/{achievementStats.total}
                        </div>
                    </div>
                    <div className="overview-stat">
                        <div className="stat-label">称号</div>
                        <div className="stat-value">{unlockedTitles.length}</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="achievement-tabs">
                    <button
                        className={`tab-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('all')}
                    >
                        すべて
                    </button>
                    {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                        <button
                            key={key}
                            className={`tab-btn ${selectedCategory === key ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(key)}
                        >
                            {info.icon} {info.name}
                        </button>
                    ))}
                </div>

                {/* Achievement List */}
                <div className="achievement-list">
                    {filteredAchievements.map((achievement) => (
                        <AchievementCard
                            key={achievement.id}
                            achievement={achievement}
                            onTitleSelect={handleTitleSelect}
                            selectedTitle={selectedTitle}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const AchievementCard = ({ achievement, onTitleSelect, selectedTitle }) => {
    const {
        id,
        name,
        description,
        icon,
        unlocked,
        unlockedAt,
        rewards,
        rarity,
    } = achievement;

    const rarityInfo = RARITY_INFO[rarity] || RARITY_INFO.common;
    const hasTitle = rewards.title;
    const isTitleSelected = selectedTitle === id;

    return (
        <div className={`achievement-card ${unlocked ? 'unlocked' : 'locked'} rarity-${rarity}`}>
            <div className="achievement-card-header">
                <div className="achievement-icon-wrapper">
                    <div className="achievement-icon">{unlocked ? icon : '🔒'}</div>
                    {unlocked && (
                        <div className="unlock-badge">✓</div>
                    )}
                </div>

                <div className="achievement-info">
                    <div className="achievement-name">{unlocked ? name : '???'}</div>
                    <div className="achievement-desc">{unlocked ? description : '条件を満たすと解放されます'}</div>

                    {unlocked && unlockedAt && (
                        <div className="achievement-date">
                            {new Date(unlockedAt).toLocaleDateString('ja-JP')} 達成
                        </div>
                    )}
                </div>

                <div className="achievement-rarity">
                    <div
                        className="rarity-badge"
                        style={{ background: rarityInfo.gradient }}
                    >
                        {rarityInfo.name}
                    </div>
                </div>
            </div>

            {unlocked && (
                <div className="achievement-rewards">
                    <div className="rewards-label">報酬:</div>
                    <div className="rewards-list">
                        {rewards.diamonds > 0 && (
                            <span className="reward-item">💎 {rewards.diamonds}</span>
                        )}
                        {hasTitle && (
                            <div className="title-reward">
                                <button
                                    className={`title-select-btn ${isTitleSelected ? 'selected' : ''}`}
                                    onClick={() => onTitleSelect(isTitleSelected ? null : id)}
                                >
                                    <Award size={14} />
                                    「{rewards.title}」
                                    {isTitleSelected && <span className="equipped-badge">装備中</span>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AchievementModal;
