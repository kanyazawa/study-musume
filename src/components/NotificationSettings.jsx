import React, { useState, useEffect } from 'react';
import { X, Bell, BellOff } from 'lucide-react';
import {
    requestNotificationPermission,
    getNotificationSettings,
    saveNotificationSettings,
    sendTestNotification
} from '../utils/notificationUtils';
import './NotificationSettings.css';

const NotificationSettings = ({ onClose }) => {
    const [settings, setSettings] = useState(getNotificationSettings());
    const [permissionGranted, setPermissionGranted] = useState(
        'Notification' in window && Notification.permission === 'granted'
    );
    const [showSuccess, setShowSuccess] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState(null); // 'requesting', 'denied', null
    const [errorMessage, setErrorMessage] = useState('');
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // コンポーネントマウント時に設定を読み込み
        setSettings(getNotificationSettings());

        // iOS判定
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // PWAモード（ホーム画面から起動）判定
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        setIsStandalone(isStandaloneMode);

        // 通知の状態を確認
        if ('Notification' in window) {
            console.log('Notification permission:', Notification.permission);
        }
    }, []);

    // 通知許可をリクエスト
    const handleRequestPermission = async () => {
        // iOSでホーム画面に追加されていない場合
        if (isIOS && !isStandalone) {
            setErrorMessage('iOSで通知を受け取るには、まず「ホーム画面に追加」して、アプリとして起動する必要があります。');
            return;
        }

        setPermissionStatus('requesting');
        setErrorMessage('');

        try {
            const granted = await requestNotificationPermission();
            setPermissionGranted(granted);

            if (granted) {
                setSettings(prev => ({ ...prev, enabled: true }));
                setPermissionStatus(null);
                // 許可された場合、テスト通知を送信
                setTimeout(() => {
                    sendTestNotification();
                }, 500);
            } else {
                setPermissionStatus('denied');
                if (Notification.permission === 'denied') {
                    setErrorMessage('通知が拒否されました。ブラウザの設定から許可してください。');
                } else {
                    setErrorMessage('通知の許可をキャンセルしました。');
                }
            }
        } catch (error) {
            console.error('通知許可のリクエストに失敗:', error);
            setPermissionStatus('denied');
            setErrorMessage('通知の許可に失敗しました。このブラウザでは通知がサポートされていない可能性があります。');
        }
    };

    // 設定を変更
    const handleToggle = (key) => {
        if (key === 'enabled' && !settings.enabled && !permissionGranted) {
            handleRequestPermission();
            return;
        }

        const newSettings = {
            ...settings,
            [key]: !settings[key]
        };
        setSettings(newSettings);
    };

    // 時刻を変更
    const handleTimeChange = (e) => {
        const newSettings = {
            ...settings,
            reminderTime: e.target.value
        };
        setSettings(newSettings);
    };

    // 設定を保存
    const handleSave = () => {
        saveNotificationSettings(settings);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    // テスト通知を送信
    const handleTestNotification = () => {
        if (permissionGranted) {
            sendTestNotification();
        } else {
            handleRequestPermission();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="notification-settings-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="settings-header">
                    <div className="header-title">
                        <Bell size={24} />
                        <h3>通知設定</h3>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="settings-body">
                    {/* 通知許可状態 */}
                    {!('Notification' in window) ? (
                        <div className="permission-warning">
                            <BellOff size={32} />
                            <p>このブラウザは通知をサポートしていません</p>
                            <p className="small-text">
                                ※ 一部のモバイルブラウザでは通知機能が制限されています
                            </p>
                        </div>
                    ) : !permissionGranted ? (
                        <div className="permission-request">
                            <Bell size={32} />
                            <p>通知を有効にするには、ブラウザの許可が必要です</p>

                            {errorMessage && (
                                <div className="error-message">
                                    ⚠️ {errorMessage}
                                </div>
                            )}

                            {permissionStatus === 'requesting' ? (
                                <button className="permission-btn" disabled>
                                    許可を待っています...
                                </button>
                            ) : (
                                <button className="permission-btn" onClick={handleRequestPermission}>
                                    通知を許可する
                                </button>
                            )}

                            {isIOS && !isStandalone && (
                                <div className="ios-guide">
                                    <p><strong>📱 iOS（iPhone/iPad）の方へ</strong></p>
                                    <p>通知を利用するには、「ホーム画面に追加」が必要です：</p>
                                    <ol>
                                        <li>ブラウザの「共有」ボタン <span className="share-icon">⬆️</span> をタップ</li>
                                        <li>メニューから「ホーム画面に追加」を選択</li>
                                        <li>ホーム画面に追加されたアイコンから再起動</li>
                                    </ol>
                                </div>
                            )}

                            <p className="small-text">
                                ※ スマホでは、ブラウザのポップアップで許可を求められます
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* 通知オン/オフ */}
                            <div className="setting-item">
                                <div className="setting-info">
                                    <div className="setting-label">通知を有効化</div>
                                    <div className="setting-desc">学習リマインダーを受け取る</div>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.enabled}
                                        onChange={() => handleToggle('enabled')}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            {/* リマインダー時刻 */}
                            {settings.enabled && (
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <div className="setting-label">リマインダー時刻</div>
                                        <div className="setting-desc">毎日この時刻に通知します</div>
                                    </div>
                                    <input
                                        type="time"
                                        className="time-input"
                                        value={settings.reminderTime}
                                        onChange={handleTimeChange}
                                    />
                                </div>
                            )}

                            {/* 連続学習通知 */}
                            {settings.enabled && (
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <div className="setting-label">連続学習達成通知</div>
                                        <div className="setting-desc">連続学習を達成したら通知</div>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={settings.streakNotifications}
                                            onChange={() => handleToggle('streakNotifications')}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            )}

                            {/* 長期間未学習通知 */}
                            {settings.enabled && (
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <div className="setting-label">未学習時の通知</div>
                                        <div className="setting-desc">3日以上学習していない時に通知</div>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={settings.longAbsenceReminder}
                                            onChange={() => handleToggle('longAbsenceReminder')}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            )}

                            {/* テスト通知 */}
                            <div className="test-notification-section">
                                <button className="test-btn" onClick={handleTestNotification}>
                                    🔔 テスト通知を送信
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {permissionGranted && (
                    <div className="settings-footer">
                        <button className="save-btn" onClick={handleSave}>
                            {showSuccess ? '✓ 保存しました' : '設定を保存'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationSettings;
