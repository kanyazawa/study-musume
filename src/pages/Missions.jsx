import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Missions.css';
import CharacterStage from '../components/character/CharacterStage';
import {
    getAllMissionsWithProgress,
    claimMissionReward,
} from '../utils/missionUtils';
import { resolveCharacterRenderer } from '../utils/characterRenderer';
import { createHomePose } from '../utils/characterPoseUtils';

const getMissionMood = ({ completionPercent, claimableCount, completedCount, totalCount }) => {
    if (claimableCount > 0) {
        return {
            emotion: 'happy',
            text: `${claimableCount}件も受け取れるよ。えらいね、忘れずにもらっていこ。`,
            kicker: 'ごほうび待機中',
        };
    }

    if (completionPercent >= 100 && totalCount > 0) {
        return {
            emotion: 'smile',
            text: '今日のミッション、全部終わってる。すごいよ、ほんとに。',
            kicker: 'フルコンプリート',
        };
    }

    if (completionPercent >= 60) {
        return {
            emotion: 'happy',
            text: `もう ${completedCount}件 達成してるよ。このままあと少しだけ進めよっか。`,
            kicker: 'いい感じ',
        };
    }

    return {
        emotion: 'normal',
        text: '今日やることを並べておいたよ。気軽に1つずつ片づけていこ。',
        kicker: '今日のやること',
    };
};

const Missions = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const [missions, setMissions] = useState([]);
    const [showRewardAnimation, setShowRewardAnimation] = useState(null);
    const [missionReaction, setMissionReaction] = useState(null);
    const reactionTimerRef = useRef(null);

    useEffect(() => {
        refreshMissions();
        return () => {
            if (reactionTimerRef.current) {
                clearTimeout(reactionTimerRef.current);
            }
        };
    }, []);

    const refreshMissions = () => {
        const allMissions = getAllMissionsWithProgress();
        setMissions(allMissions);
    };

    const handleClaimReward = (missionId) => {
        const rewards = claimMissionReward(missionId);

        if (rewards) {
            updateStats({
                diamonds: (stats.diamonds || 0) + rewards.diamonds,
                intellect: (stats.intellect || 0) + rewards.intellect,
            });

            setMissionReaction({
                emotion: 'happy',
                text: '受け取りありがとう。ちゃんと進んでてえらいよ。',
                kicker: 'ごほうび受け取り',
            });
            if (reactionTimerRef.current) {
                clearTimeout(reactionTimerRef.current);
            }
            reactionTimerRef.current = setTimeout(() => {
                setMissionReaction(null);
                reactionTimerRef.current = null;
            }, 2200);

            setShowRewardAnimation(rewards);
            setTimeout(() => setShowRewardAnimation(null), 2000);
            refreshMissions();
        }
    };

    const completedCount = missions.filter((mission) => mission.completed).length;
    const totalCount = missions.length;
    const completionPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const claimableCount = missions.filter((mission) => mission.completed && !mission.claimed).length;

    const characterId = stats?.characterId || 'noah';
    const equippedSkin = stats?.equippedSkin || 'default';
    const renderer = resolveCharacterRenderer({
        preferredRenderer: stats?.characterRenderer,
        characterId,
        skinId: equippedSkin,
    });

    const missionMood = useMemo(() => {
        if (missionReaction) return missionReaction;
        return getMissionMood({ completionPercent, claimableCount, completedCount, totalCount });
    }, [claimableCount, completedCount, completionPercent, missionReaction, totalCount]);
    const missionPose = useMemo(
        () => createHomePose({ emotion: missionMood.emotion, text: missionMood.text }),
        [missionMood.emotion, missionMood.text]
    );

    return (
        <div className="missions-page">
            <div className="missions-backdrop" aria-hidden="true">
                <div className="missions-orb orb-peach"></div>
                <div className="missions-orb orb-mint"></div>
                <div className="missions-orb orb-sky"></div>
                <div className="missions-grid-glow"></div>
            </div>

            <section className="missions-stage">
                <div className="missions-stage-top">
                    <button className="back-btn missions-back-btn" onClick={() => navigate('/home')}>
                        ← ホームへ
                    </button>
                </div>

                <div className="missions-character-panel">
                    <div className="missions-character-glow" aria-hidden="true"></div>
                    <div className={`missions-character-stage ${renderer === 'live2d' ? 'is-live2d' : ''}`}>
                        <CharacterStage
                            characterId={characterId}
                            renderer={renderer}
                            skinId={equippedSkin}
                            pose={{ ...missionPose, scene: 'missions' }}
                            scene="missions"
                            className="missions-character-stage-inner"
                            imageClassName="missions-character-image"
                            alt="Mission character"
                        />
                    </div>
                </div>
            </section>

            <section className="missions-sheet">
                <div className="missions-sheet-grabber" aria-hidden="true"></div>

                <div className="missions-sheet-header">
                    <div className="missions-stage-title">
                        <div className="missions-kicker">Daily Mission Room</div>
                        <h1 className="missions-title">デイリーミッション</h1>
                        <div className="missions-subtitle">ノアといっしょに今日のやることを片づけよう</div>
                    </div>
                    <button className="missions-home-shortcut" onClick={() => navigate('/home')}>
                        ホームへ戻る
                    </button>
                </div>

                <div className="missions-scroll">
                    <section className="missions-list">
                        {missions.map((mission) => (
                            <MissionCard
                                key={mission.id}
                                mission={mission}
                                onClaim={handleClaimReward}
                            />
                        ))}
                    </section>
                </div>
            </section>

            {showRewardAnimation && (
                <div className="reward-animation">
                    <div className="reward-content">
                        <div className="reward-title">報酬獲得！</div>
                        <div className="reward-items">
                            {showRewardAnimation.diamonds > 0 && (
                                <div className="reward-item">💎 +{showRewardAnimation.diamonds}</div>
                            )}
                            {showRewardAnimation.intellect > 0 && (
                                <div className="reward-item">🧠 +{showRewardAnimation.intellect}</div>
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

    const statusLabel = claimed ? '受取済み' : completed ? '受け取りOK' : '進行中';

    return (
        <article className={`mission-card ${completed ? 'completed' : ''} ${claimed ? 'claimed' : ''}`}>
            <div className="mission-card-header">
                <div className="mission-icon-wrap">
                    <div className="mission-icon">{icon}</div>
                </div>
                <div className="mission-heading-group">
                    <div className="mission-name">{title}</div>
                    <div className="mission-desc">{description}</div>
                </div>
                <div className={`mission-status-chip ${claimed ? 'claimed' : completed ? 'completed' : 'in-progress'}`}>
                    {statusLabel}
                </div>
            </div>

            <div className="mission-progress-panel">
                <div className="mission-progress-head">
                    <span>進行状況</span>
                    <strong>{current} / {target}</strong>
                </div>
                <div className="mission-progress-bar">
                    <div
                        className="mission-progress-fill"
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
            </div>

            <div className="mission-card-footer">
                <div className="mission-rewards">
                    {rewards.diamonds > 0 && (
                        <span className="reward-badge">💎 {rewards.diamonds}</span>
                    )}
                    {rewards.intellect > 0 && (
                        <span className="reward-badge reward-badge-mint">🧠 {rewards.intellect}</span>
                    )}
                </div>

                <div className="mission-action">
                    {claimed ? (
                        <div className="mission-status claimed">✓ 受取済</div>
                    ) : completed ? (
                        <button className="claim-btn" onClick={() => onClaim(id)}>
                            ごほうびを受け取る
                        </button>
                    ) : (
                        <div className="mission-status in-progress">進行中</div>
                    )}
                </div>
            </div>
        </article>
    );
};

export default Missions;
