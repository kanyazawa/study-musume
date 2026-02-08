import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MenuModal.css';
import {
    Settings,
    Mail,
    ShoppingBag,
    Award,
    User,
    Ban,
    Smartphone,
    HelpCircle,
    Gem,
    LogOut,
    Calendar,
    Bell,
    Users,
    Trophy,
    Volume2,
    VolumeX
} from 'lucide-react';
import AchievementModal from './AchievementModal';
import NotificationSettings from './NotificationSettings';
import { useSound } from '../contexts/SoundContext';


const MENU_ITEMS = [
    { id: 'calendar', label: 'カレンダー', icon: <Calendar />, iconClass: 'icon-calendar' },
    { id: 'friends', label: 'フレンド', icon: <Users />, iconClass: 'icon-users' },
    { id: 'ranking', label: 'ランキング', icon: <Trophy />, iconClass: 'icon-trophy' },
    { id: 'notifications', label: '通知設定', icon: <Bell />, iconClass: 'icon-bell' },
    { id: 'settings', label: '設定', icon: <Settings />, iconClass: 'icon-settings' },
    { id: 'notice', label: 'お知らせ', icon: <Mail />, iconClass: 'icon-mail' },
    { id: 'items', label: 'アイテム', icon: <ShoppingBag />, iconClass: 'icon-bag' },
    { id: 'titles', label: '称号', icon: <Award />, iconClass: 'icon-award' },
    { id: 'profile', label: 'プロフィール', icon: <User />, iconClass: 'icon-user' },
    { id: 'block', label: 'ブロックリスト', icon: <Ban />, iconClass: 'icon-ban' },
    { id: 'account', label: 'アカウント連携', icon: <Smartphone />, iconClass: 'icon-card' },
    { id: 'support', label: 'サポート', icon: <HelpCircle />, iconClass: 'icon-help' },
    { id: 'shop', label: 'ダイヤ購入', icon: <Gem />, iconClass: 'icon-gem' },
    { id: 'title', label: 'タイトルへ', icon: <LogOut />, iconClass: 'icon-back' },
];

const MenuModal = ({ onClose, stats, updateStats }) => {
    const navigate = useNavigate();
    const [showAchievements, setShowAchievements] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const handleMenuClick = (itemId) => {
        if (itemId === 'titles') {
            setShowAchievements(true);
        } else if (itemId === 'notifications') {
            setShowNotifications(true);
        } else if (itemId === 'calendar') {
            onClose();
            navigate('/calendar');
        } else if (itemId === 'profile') {
            onClose();
            navigate('/profile');
        } else if (itemId === 'friends') {
            onClose();
            navigate('/friends');
        } else if (itemId === 'ranking') {
            onClose();
            navigate('/ranking');
        } else if (itemId === 'settings') {
            setShowSettings(true);
        }
        // 他のメニューアイテムの処理はここに追加
    };

    const SettingsPanel = () => {
        const { isMuted, volume, toggleMute, changeVolume } = useSound();

        return (
            <div className="menu-modal-overlay" onClick={() => setShowSettings(false)}>
                <div className="menu-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="menu-header">
                        <div className="menu-title">設定</div>
                    </div>
                    <div className="menu-content-scrollable" style={{ padding: '20px' }}>
                        <div className="settings-section">
                            <h3>音量設定</h3>
                            <div className="volume-control-row" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                                <button
                                    onClick={toggleMute}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0,
                                        color: '#ff80ab'
                                    }}
                                >
                                    {isMuted || volume === 0 ? <VolumeX size={32} /> : <Volume2 size={32} />}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => changeVolume(parseFloat(e.target.value))}
                                    style={{
                                        flex: 1,
                                        height: '6px',
                                        borderRadius: '3px',
                                        accentColor: '#ff80ab',
                                        cursor: 'pointer'
                                    }}
                                />
                                <span style={{ width: '40px', textAlign: 'right', fontWeight: 'bold' }}>
                                    {Math.round((isMuted ? 0 : volume) * 100)}%
                                </span>
                            </div>
                        </div>
                        {/* Other settings placeholders */}
                    </div>
                    <div className="menu-footer">
                        <button className="close-btn" onClick={() => setShowSettings(false)}>
                            戻る
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="menu-modal-overlay" onClick={onClose}>
                <div className="menu-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="menu-header">
                        <div className="menu-title">メニュー</div>
                    </div>

                    <div className="menu-grid">
                        {MENU_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                className="menu-item-btn"
                                onClick={() => handleMenuClick(item.id)}
                            >
                                <span className={`menu-icon ${item.iconClass}`}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="menu-footer">
                        <button className="close-btn" onClick={onClose}>
                            閉じる
                        </button>
                    </div>
                </div>
            </div>

            {showAchievements && (
                <AchievementModal
                    onClose={() => setShowAchievements(false)}
                    stats={stats}
                    updateStats={updateStats}
                />
            )}

            {showNotifications && (
                <NotificationSettings
                    onClose={() => setShowNotifications(false)}
                />
            )}

            {showSettings && <SettingsPanel />}
        </>
    );
};

export default MenuModal;
