/**
 * 通知管理ユーティリティ
 * Service Worker連携でバックグラウンド通知をサポート
 */

const STORAGE_KEY = 'notificationSettings';

/**
 * デフォルト設定
 */
const DEFAULT_SETTINGS = {
    enabled: false,
    reminderTime: '20:00', // HH:MM形式
    streakNotifications: true,
    longAbsenceReminder: true,
    lastReminderDate: null,
    lastNotifiedDate: null
};

// ==============================
// Service Worker 管理
// ==============================

/**
 * Service Workerを登録
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service Workerはこのブラウザでサポートされていません');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });
        console.log('Service Worker registered:', registration.scope);
        return registration;
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
    }
};

/**
 * Service Workerに設定を同期
 */
const syncSettingsToSW = async (settings) => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
        // controllerがなくても、readyで待つ
        try {
            const registration = await navigator.serviceWorker.ready;
            if (registration.active) {
                registration.active.postMessage({
                    type: 'SYNC_SETTINGS',
                    data: settings
                });
                console.log('Settings synced to SW via registration.active');
            }
        } catch (e) {
            console.warn('SW sync fallback failed:', e);
        }
        return;
    }

    navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_SETTINGS',
        data: settings
    });
    console.log('Settings synced to SW');
};

/**
 * 通知システムを初期化（アプリ起動時に呼ぶ）
 */
export const initNotificationSystem = async () => {
    // 1. Service Worker登録
    const registration = await registerServiceWorker();
    if (!registration) return;

    // SWがactiveになるのを待つ
    const reg = await navigator.serviceWorker.ready;
    console.log('Service Worker is ready:', reg.scope);

    // 2. 既存の設定をSWに同期
    const settings = getNotificationSettings();
    if (settings.enabled) {
        syncSettingsToSW(settings);

        // オンデマンドチェック（少し待ってから）
        setTimeout(() => {
            if (reg.active) {
                reg.active.postMessage({ type: 'CHECK_NOTIFICATION' });
            }
        }, 1000);
    }

    console.log('Notification system initialized');
};

// ==============================
// 通知許可
// ==============================

/**
 * 通知許可をリクエスト
 * @returns {Promise<boolean>} 許可された場合true
 */
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.warn('このブラウザは通知をサポートしていません');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        try {
            const permission = await Notification.requestPermission();
            console.log('Notification permission result:', permission);
            return permission === 'granted';
        } catch (e) {
            console.error('Permission request error:', e);
            return false;
        }
    }

    console.warn('Notification permission is denied');
    return false;
};

// ==============================
// 通知送信
// ==============================

/**
 * 通知を送信（Service Worker経由）
 * @param {string} title - 通知のタイトル
 * @param {string} body - 通知の本文
 * @returns {Promise<boolean>} 送信成功したかどうか
 */
export const sendNotification = async (title, body) => {
    if (!('Notification' in window)) {
        console.warn('このブラウザは通知をサポートしていません');
        return false;
    }

    if (Notification.permission !== 'granted') {
        console.warn('通知の許可が必要です。現在の状態:', Notification.permission);
        return false;
    }

    // Service Worker経由で通知（iOS PWAではこれが必須）
    try {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, {
                body,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                vibrate: [200, 100, 200],
                tag: 'study-musume-' + Date.now(),
                data: { url: '/' }
            });
            console.log('Notification sent via SW:', title);
            return true;
        }
    } catch (swError) {
        console.warn('SW notification failed, trying fallback:', swError);
    }

    // フォールバック: 直接通知（デスクトップ用）
    try {
        new Notification(title, {
            body,
            icon: '/icon-192.png'
        });
        return true;
    } catch (error) {
        console.error('通知の送信に失敗しました:', error);
        return false;
    }
};

// ==============================
// 設定管理
// ==============================

/**
 * 通知設定を取得
 * @returns {Object} 通知設定
 */
export const getNotificationSettings = () => {
    try {
        const settings = localStorage.getItem(STORAGE_KEY);
        if (!settings) {
            return { ...DEFAULT_SETTINGS };
        }
        return { ...DEFAULT_SETTINGS, ...JSON.parse(settings) };
    } catch (error) {
        console.error('通知設定の取得に失敗しました:', error);
        return { ...DEFAULT_SETTINGS };
    }
};

/**
 * 通知設定を保存（localStorage + Service Worker同期）
 * @param {Object} settings - 保存する設定
 */
export const saveNotificationSettings = (settings) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        // Service Workerにも同期
        syncSettingsToSW(settings);
        console.log('通知設定を保存しました:', settings);
    } catch (error) {
        console.error('通知設定の保存に失敗しました:', error);
    }
};

// ==============================
// リマインダー
// ==============================

/**
 * 学習リマインダーを送信
 */
export const sendStudyReminder = async () => {
    const settings = getNotificationSettings();

    if (!settings.enabled) {
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    if (settings.lastReminderDate === today) {
        return;
    }

    const messages = [
        '📚 学習の時間だよ！今日も一緒に頑張ろう！',
        '⏰ 学習タイムだよ！少しだけでも勉強しよう！',
        '✨ 今日も学習しようか！継続が大事だよ！',
        '💪 学習の時間！一緒に成長しよう！'
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    const success = await sendNotification('先輩、ここがわかりません 📖', randomMessage);

    if (success) {
        saveNotificationSettings({
            ...settings,
            lastReminderDate: today
        });
    }
};

/**
 * 連続学習達成通知を送信
 * @param {number} streak - 連続日数
 */
export const sendStreakNotification = async (streak) => {
    const settings = getNotificationSettings();

    if (!settings.enabled || !settings.streakNotifications) {
        return;
    }

    let message = '';

    if (streak === 3) {
        message = `🔥 3日連続学習達成！素晴らしい！`;
    } else if (streak === 7) {
        message = `⭐ 1週間連続学習達成！すごいよ！`;
    } else if (streak === 14) {
        message = `💎 2週間連続学習達成！本当に頑張ってる！`;
    } else if (streak === 30) {
        message = `👑 1ヶ月連続学習達成！君は最高だ！`;
    } else if (streak % 50 === 0) {
        message = `🏆 ${streak}日連続学習達成！伝説級だ！`;
    } else if (streak % 10 === 0 && streak >= 10) {
        message = `✨ ${streak}日連続学習達成！継続は力なり！`;
    }

    if (message) {
        await sendNotification('先輩、ここがわかりません 🎉', message);
    }
};

/**
 * 長期間未学習時の励まし通知
 * @param {number} daysSinceLastStudy - 最後の学習からの日数
 */
export const sendLongAbsenceReminder = async (daysSinceLastStudy) => {
    const settings = getNotificationSettings();

    if (!settings.enabled || !settings.longAbsenceReminder) {
        return;
    }

    if (daysSinceLastStudy >= 3) {
        const messages = [
            `📚 ${daysSinceLastStudy}日間学習してないよ。大丈夫？`,
            `💭 もう${daysSinceLastStudy}日経ったね。少しだけでも一緒に勉強しよう！`,
            `🌟 ${daysSinceLastStudy}日ぶりだね！待ってたよ！`,
            `✨ しばらく会ってないね。元気にしてた？`
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        await sendNotification('先輩、ここがわかりません 💌', randomMessage);
    }
};

/**
 * 通知のテスト送信（registration.showNotification直接使用）
 */
export const sendTestNotification = async () => {
    // iOS PWAではregistration.showNotificationを直接使う
    await sendNotification(
        '先輩、ここがわかりません テスト通知 🔔',
        'これはテスト通知です。通知が正しく表示されています！'
    );
};
