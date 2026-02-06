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
    Trophy
} from 'lucide-react';
import AchievementModal from './AchievementModal';
import NotificationSettings from './NotificationSettings';

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
        }
        // 他のメニューアイテムの処理はここに追加
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
        </>
    );
};

export default MenuModal;
