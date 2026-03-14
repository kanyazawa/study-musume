import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Missions.css';
import {
    getAllMissionsWithProgress,
    claimMissionReward,
} from '../utils/missionUtils';

const Missions = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const [missions, setMissions] = useState([]);
    const [showRewardAnimation, setShowRewardAnimation] = useState(null);

    useEffect(() => {
        refreshMissions();
    }, []);

    const refreshMissions = () => {
        const allMissions = getAllMissionsWithProgress();
        setMissions(allMissions);
    };

    const handleClaimReward = (missionId) => {
        const rewards = claimMissionReward(missionId);

        if (rewards) {
            // 報酬を付与
            updateStats({
                diamonds: (stats.diamonds || 0) + rewards.diamonds,
                intellect: (stats.intellect || 0) + rewards.intellect,
            });

            // アニメーション表示
            setShowRewardAnimation(rewards);
            setTimeout(() => setShowRewardAnimation(null), 2000);

            // ミッションリストを更新
            refreshMissions();
        }
    };

    // 完了率を計算
    const completedCount = missions.filter(m => m.completed).length;
    const totalCount = missions.length;
    const completionPercent = (completedCount / totalCount) * 100;

    return (
        <div className="missions-page">
            {/* Header */}
            <div className="missions-header">
                <button className="back-btn" onClick={() => navigate('/home')}>
                    ← 戻る
                </button>
                <h1 className="missions-title">📋 デイリーミッション</h1>
                <div className="missions-subtitle">毎日リセット</div>
            </div>

            {/* Progress Overview */}
            <div className="missions-overview">
                <div className="overview-card">
                    <div className="overview-label">達成率</div>
                    <div className="overview-value">
                        {completedCount} / {totalCount}
                    </div>
                    <div className="overview-bar">
                        <div
                            className="overview-bar-fill"
                            style={{ width: `${completionPercent}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Mission List */}
            <div className="missions-list">
                {missions.map((mission) => (
                    <MissionCard
                        key={mission.id}
                        mission={mission}
                        onClaim={handleClaimReward}
                    />
                ))}
            </div>

            {/* Reward Animation */}
            {showRewardAnimation && (
                <div className="reward-animation">
                    <div className="reward-content">
                        <div className="reward-title">🎉 報酬獲得！</div>
                        <div className="reward-items">
                            {showRewardAnimation.diamonds > 0 && (
                                <div className="reward-item">
                                    💎 +{showRewardAnimation.diamonds}
                                </div>
                            )}
                            {showRewardAnimation.intellect > 0 && (
                                <div className="reward-item">
                                    🧠 +{showRewardAnimation.intellect}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MissionCard = ({ mission, onClaim }) => {
    const {
        id,
        icon,
        title,
        description,
        current,
        target,
        completed,
        claimed,
        progressPercent,
        rewards,
    } = mission;

    return (
        <div className={`mission-card ${completed ? 'completed' : ''} ${claimed ? 'claimed' : ''}`}>
            <div className="mission-icon">{icon}</div>

            <div className="mission-info">
                <div className="mission-name">{title}</div>
                <div className="mission-desc">{description}</div>

                {/* Progress Bar */}
                <div className="mission-progress">
                    <div className="mission-progress-bar">
                        <div
                            className="mission-progress-fill"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                    <div className="mission-progress-text">
                        {current} / {target}
                    </div>
                </div>

                {/* Rewards */}
                <div className="mission-rewards">
                    {rewards.diamonds > 0 && (
                        <span className="reward-badge">💎 {rewards.diamonds}</span>
                    )}
                    {rewards.intellect > 0 && (
                        <span className="reward-badge">🧠 {rewards.intellect}</span>
                    )}
                </div>
            </div>

            {/* Action Button */}
            <div className="mission-action">
                {claimed ? (
                    <div className="mission-status claimed">✓ 受取済</div>
                ) : completed ? (
                    <button className="claim-btn" onClick={() => onClaim(id)}>
                        受け取る
                    </button>
                ) : (
                    <div className="mission-status in-progress">進行中</div>
                )}
            </div>
        </div>
    );
};

export default Missions;
