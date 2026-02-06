import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit2, Save } from 'lucide-react';
import './Profile.css';
import { ICONS, getIconById, getUnlockedIcons, getLockedIcons } from '../data/icons';
import { getUnlockedTitles } from '../utils/achievementUtils';
import { ACHIEVEMENTS } from '../data/achievements';

const Profile = ({ stats, updateStats }) => {
    const navigate = useNavigate();

    // ローカルステート
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingCharName, setIsEditingCharName] = useState(false);
    const [tempName, setTempName] = useState(stats?.name || 'トレーナー');
    const [tempCharName, setTempCharName] = useState(stats?.characterName || 'さくら');

    // データ取得
    const selectedIcon = getIconById(stats?.selectedIcon || 'default');
    const unlockedIcons = getUnlockedIcons(stats?.unlockedIcons || ['default']);
    const lockedIcons = getLockedIcons(stats?.unlockedIcons || ['default']);
    const unlockedTitleIds = getUnlockedTitles();
    const selectedTitleAchievement = stats?.selectedTitle
        ? ACHIEVEMENTS.find(a => a.id === stats.selectedTitle)
        : null;

    // ユーザー名保存
    const saveName = () => {
        if (tempName.trim() && tempName.length <= 10) {
            updateStats({ name: tempName.trim() });
            setIsEditingName(false);
        }
    };

    // キャラクター名保存
    const saveCharName = () => {
        if (tempCharName.trim() && tempCharName.length <= 10) {
            updateStats({ characterName: tempCharName.trim() });
            setIsEditingCharName(false);
        }
    };

    // アイコン選択
    const selectIcon = (iconId) => {
        updateStats({ selectedIcon: iconId });
    };

    // 称号選択
    const selectTitle = (achievementId) => {
        if (achievementId === stats?.selectedTitle) {
            // 同じものをクリックしたら解除
            updateStats({ selectedTitle: null });
        } else {
            updateStats({ selectedTitle: achievementId });
        }
    };

    return (
        <div className="profile-screen">
            {/* Header */}
            <div className="profile-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <ChevronLeft color="white" size={24} />
                </button>
                <h2>プロフィール</h2>
                <div /> {/* Spacer */}
            </div>

            <div className="profile-content">
                {/* Current Profile Card */}
                <div className="profile-card">
                    <div className="profile-avatar">
                        <div className="avatar-icon">{selectedIcon.emoji}</div>
                        {selectedTitleAchievement && (
                            <div className="profile-title-badge">
                                「{selectedTitleAchievement.rewards.title}」
                            </div>
                        )}
                    </div>

                    <div className="profile-info">
                        <div className="info-item">
                            <label>トレーナー名</label>
                            {isEditingName ? (
                                <div className="edit-group">
                                    <input
                                        type="text"
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        maxLength={10}
                                        placeholder="トレーナー名"
                                        autoFocus
                                    />
                                    <button className="save-btn-small" onClick={saveName}>
                                        <Save size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="display-group">
                                    <span className="value">{stats?.name || 'トレーナー'}</span>
                                    <button className="edit-btn-small" onClick={() => setIsEditingName(true)}>
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="info-item">
                            <label>キャラクター名</label>
                            {isEditingCharName ? (
                                <div className="edit-group">
                                    <input
                                        type="text"
                                        value={tempCharName}
                                        onChange={(e) => setTempCharName(e.target.value)}
                                        maxLength={10}
                                        placeholder="キャラクター名"
                                        autoFocus
                                    />
                                    <button className="save-btn-small" onClick={saveCharName}>
                                        <Save size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="display-group">
                                    <span className="value">{stats?.characterName || 'さくら'}</span>
                                    <button className="edit-btn-small" onClick={() => setIsEditingCharName(true)}>
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Icon Selection */}
                <div className="section">
                    <h3>アイコン選択</h3>
                    <div className="icon-grid">
                        {unlockedIcons.map(icon => (
                            <button
                                key={icon.id}
                                className={`icon-item ${stats?.selectedIcon === icon.id ? 'selected' : ''}`}
                                onClick={() => selectIcon(icon.id)}
                                title={icon.description}
                            >
                                <div className="icon-emoji">{icon.emoji}</div>
                                <div className="icon-name">{icon.name}</div>
                            </button>
                        ))}
                        {lockedIcons.map(icon => (
                            <div key={icon.id} className="icon-item locked" title={icon.description}>
                                <div className="icon-emoji">🔒</div>
                                <div className="icon-name">{icon.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Title Selection */}
                <div className="section">
                    <h3>称号選択</h3>
                    <div className="title-list">
                        {unlockedTitleIds.length > 0 ? (
                            <>
                                {unlockedTitleIds.map(achievementId => {
                                    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
                                    if (!achievement || !achievement.rewards?.title) return null;

                                    const isSelected = stats?.selectedTitle === achievementId;

                                    return (
                                        <button
                                            key={achievementId}
                                            className={`title-item ${isSelected ? 'selected' : ''}`}
                                            onClick={() => selectTitle(achievementId)}
                                        >
                                            <div className="title-radio">
                                                {isSelected ? '●' : '○'}
                                            </div>
                                            <div className="title-text">
                                                「{achievement.rewards.title}」
                                            </div>
                                        </button>
                                    );
                                })}
                            </>
                        ) : (
                            <div className="empty-state">
                                <p>まだ称号を獲得していません</p>
                                <p className="hint">実績を達成すると称号が手に入ります</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
