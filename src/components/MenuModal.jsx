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
import TtsSettingsModal from './TtsSettingsModal';
import { hasLive2DModelConfig } from '../utils/live2dModelRegistry';
import { resolveCharacterRenderer } from '../utils/characterRenderer';


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
    { id: 'shop', label: '購買部', icon: <Gem />, iconClass: 'icon-gem' },
    { id: 'title', label: 'タイトルへ', icon: <LogOut />, iconClass: 'icon-back' },
];

const MenuModal = ({ onClose, stats, updateStats }) => {
    const navigate = useNavigate();
    const [showAchievements, setShowAchievements] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showTtsSettings, setShowTtsSettings] = useState(false);
    const characterId = stats?.characterId || 'noah';
    const skinId = stats?.equippedSkin || 'default';
    const preferredRenderer = stats?.characterRenderer || 'auto';
    const characterQuality = stats?.characterQuality || 'high';
    const hasLive2D = hasLive2DModelConfig(characterId, skinId);
    const resolvedRenderer = resolveCharacterRenderer({
        preferredRenderer,
        characterId,
        skinId,
    });

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
        } else if (itemId === 'title') {
            onClose();
            navigate('/');
        } else if (itemId === 'items') {
            onClose();
            navigate('/inventory');
        } else if (itemId === 'shop') {
            onClose();
            navigate('/shop');
        }
        // 他のメニューアイテムの処理はここに追加
    };

    const SettingsPanel = () => {
        const { isMuted, volume, toggleMute, changeVolume } = useSound();
        const rendererOptions = [
            { value: 'auto', label: '自動', description: 'Live2D試作があれば優先し、なければ画像表示を使います。' },
            { value: 'live2d', label: 'Live2D', description: 'モデルが未配置なら自動で他の表示にフォールバックします。' },
            { value: 'image', label: '画像', description: 'もっとも軽い表示です。' },
        ];
        const qualityOptions = [
            { value: 'high', label: '高', description: '演出を優先します。' },
            { value: 'medium', label: '中', description: '品質と軽さのバランスです。' },
            { value: 'low', label: '低', description: '軽さを優先します。' },
        ];

        const updateCharacterSetting = (updates) => {
            if (!updateStats) return;
            updateStats(updates);
        };

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
                        <div className="settings-section" style={{ marginTop: '24px' }}>
                            <h3>読み上げ設定</h3>
                            <p style={{ color: '#555', lineHeight: 1.6, marginTop: '10px' }}>
                                AivisSpeech や VOICEVOX、ブラウザTTSの切り替えと話者設定ができます。
                            </p>
                            <button
                                className="menu-item-btn"
                                style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
                                onClick={() => setShowTtsSettings(true)}
                            >
                                <span className="menu-icon icon-settings">
                                    <Volume2 />
                                </span>
                                TTSエンジン設定を開く
                            </button>
                        </div>
                        <div className="settings-section" style={{ marginTop: '24px' }}>
                            <h3>キャラ表示設定</h3>
                            <p style={{ color: '#555', lineHeight: 1.6, marginTop: '10px' }}>
                                現在の解決結果: <strong>{resolvedRenderer.toUpperCase()}</strong>
                            </p>
                            <p style={{ color: '#777', lineHeight: 1.6, marginTop: '6px', fontSize: '13px' }}>
                                Live2Dモデル: {hasLive2D ? '検出済み' : '未配置'}
                            </p>
                            <div className="settings-option-grid">
                                {rendererOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={`settings-choice-card ${preferredRenderer === option.value ? 'selected' : ''}`}
                                        onClick={() => updateCharacterSetting({ characterRenderer: option.value })}
                                    >
                                        <strong>{option.label}</strong>
                                        <span>{option.description}</span>
                                    </button>
                                ))}
                            </div>
                            {!hasLive2D && preferredRenderer === 'live2d' && (
                                <p className="settings-inline-note">
                                    Live2Dモデルがまだ未配置のため、現在は既存表示へフォールバックします。
                                </p>
                            )}
                        </div>
                        <div className="settings-section" style={{ marginTop: '24px' }}>
                            <h3>キャラ品質</h3>
                            <div className="settings-option-grid compact">
                                {qualityOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={`settings-choice-card ${characterQuality === option.value ? 'selected' : ''}`}
                                        onClick={() => updateCharacterSetting({ characterQuality: option.value })}
                                    >
                                        <strong>{option.label}</strong>
                                        <span>{option.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
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
            {showTtsSettings && <TtsSettingsModal onClose={() => setShowTtsSettings(false)} />}
        </>
    );
};

export default MenuModal;
