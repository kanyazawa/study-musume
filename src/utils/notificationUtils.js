/**
 * 通知管理ユーティリティ
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
    lastReminderDate: null
};

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
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

/**
 * 通知を送信
 * @param {string} title - 通知のタイトル
 * @param {string} body - 通知の本文
 * @param {string} icon - 通知のアイコンURL（オプション）
 * @returns {boolean} 送信成功したかどうか
 */
export const sendNotification = (title, body, icon = null) => {
    if (!('Notification' in window)) {
        console.warn('このブラウザは通知をサポートしていません');
        return false;
    }

    if (Notification.permission !== 'granted') {
        console.warn('通知の許可が必要です');
        return false;
    }

    const options = {
        body,
        icon: icon || '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'study-musume',
        requireInteraction: false
    };

    try {
        new Notification(title, options);
        return true;
    } catch (error) {
        console.error('通知の送信に失敗しました:', error);
        return false;
    }
};

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
 * 通知設定を保存
 * @param {Object} settings - 保存する設定
 */
export const saveNotificationSettings = (settings) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        console.log('通知設定を保存しました:', settings);
    } catch (error) {
        console.error('通知設定の保存に失敗しました:', error);
    }
};

/**
 * リマインダーをスケジュール（次の設定時刻を計算）
 * @param {string} time - HH:MM形式の時刻
 * @returns {number} 次のリマインダーまでのミリ秒
 */
export const scheduleReminder = (time) => {
    const [hours, minutes] = time.split(':').map(Number);

    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    // 今日の設定時刻を過ぎている場合は明日に設定
    if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const msUntilReminder = reminderTime.getTime() - now.getTime();
    return msUntilReminder;
};

/**
 * 学習リマインダーを送信
 */
export const sendStudyReminder = () => {
    const settings = getNotificationSettings();

    if (!settings.enabled) {
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    // 今日既にリマインダーを送信している場合はスキップ
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

    const success = sendNotification('Study Musume 📖', randomMessage);

    if (success) {
        // 最後のリマインダー送信日を更新
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
export const sendStreakNotification = (streak) => {
    const settings = getNotificationSettings();

    if (!settings.enabled || !settings.streakNotifications) {
        return;
    }

    let message = '';
    let emoji = '';

    if (streak === 3) {
        emoji = '🔥';
        message = `${emoji} 3日連続学習達成！素晴らしい！`;
    } else if (streak === 7) {
        emoji = '⭐';
        message = `${emoji} 1週間連続学習達成！すごいよ！`;
    } else if (streak === 14) {
        emoji = '💎';
        message = `${emoji} 2週間連続学習達成！本当に頑張ってる！`;
    } else if (streak === 30) {
        emoji = '👑';
        message = `${emoji} 1ヶ月連続学習達成！君は最高だ！`;
    } else if (streak % 50 === 0) {
        emoji = '🏆';
        message = `${emoji} ${streak}日連続学習達成！伝説級だ！`;
    } else if (streak % 10 === 0 && streak >= 10) {
        emoji = '✨';
        message = `${emoji} ${streak}日連続学習達成！継続は力なり！`;
    }

    if (message) {
        sendNotification('Study Musume 🎉', message);
    }
};

/**
 * 長期間未学習時の励まし通知
 * @param {number} daysSinceLastStudy - 最後の学習からの日数
 */
export const sendLongAbsenceReminder = (daysSinceLastStudy) => {
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
        sendNotification('Study Musume 💌', randomMessage);
    }
};

/**
 * 通知のテスト送信
 */
export const sendTestNotification = () => {
    sendNotification(
        'Study Musume テスト通知 🔔',
        'これはテスト通知です。通知が正しく表示されています！'
    );
};
