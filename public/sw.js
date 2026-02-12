/**
 * Study Musume - Service Worker
 * 通知スケジュール管理とバックグラウンド通知を担当
 */

const CACHE_NAME = 'study-musume-v1';
const DB_NAME = 'StudyMusumeNotifications';
const DB_VERSION = 1;
const STORE_NAME = 'settings';
const CHECK_INTERVAL = 5 * 60 * 1000; // 5分間隔

// ==============================
// IndexedDB ヘルパー
// ==============================

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getSettings() {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get('notificationSettings');
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.warn('[SW] IndexedDB error:', e);
        return null;
    }
}

async function saveLastNotifiedDate(date) {
    try {
        const db = await openDB();
        const settings = await getSettings() || {};
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            settings.lastNotifiedDate = date;
            const request = store.put(settings, 'notificationSettings');
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.warn('[SW] Save error:', e);
    }
}

async function saveSetting(settings) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(settings, 'notificationSettings');
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.warn('[SW] Save error:', e);
    }
}

// ==============================
// 通知チェック
// ==============================

const REMINDER_MESSAGES = [
    '📚 学習の時間だよ！今日も一緒に頑張ろう！',
    '⏰ 学習タイムだよ！少しだけでも勉強しよう！',
    '✨ 今日も学習しようか！継続が大事だよ！',
    '💪 学習の時間！一緒に成長しよう！',
    '🌟 勉強の時間！あなたならできる！',
    '📖 さあ、一緒に学ぼう！今日もファイト！'
];

async function checkAndSendNotification() {
    const settings = await getSettings();
    if (!settings || !settings.enabled) {
        return;
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // 今日すでに通知済みならスキップ
    if (settings.lastNotifiedDate === today) {
        return;
    }

    // リマインダー時刻をチェック
    const [hours, minutes] = (settings.reminderTime || '20:00').split(':').map(Number);
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    // 設定時刻を過ぎていたら通知を送信
    if (currentHours > hours || (currentHours === hours && currentMinutes >= minutes)) {
        const message = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];

        try {
            await self.registration.showNotification('Study Musume 📖', {
                body: message,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                vibrate: [200, 100, 200],
                tag: 'study-reminder',
                renotify: false,
                data: {
                    url: '/',
                    type: 'reminder'
                }
            });

            await saveLastNotifiedDate(today);
            console.log('[SW] Reminder notification sent');
        } catch (e) {
            console.error('[SW] Failed to show notification:', e);
        }
    }
}

// ==============================
// Service Worker イベント
// ==============================

// インストール
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    self.skipWaiting();
});

// アクティベート
self.addEventListener('activate', (event) => {
    console.log('[SW] Activated');
    event.waitUntil(self.clients.claim());
});

// メッセージ受信（アプリから設定同期）
self.addEventListener('message', (event) => {
    const { type, data } = event.data || {};

    if (type === 'SYNC_SETTINGS') {
        // アプリから通知設定を受け取ってIndexedDBに保存
        saveSetting(data).then(() => {
            console.log('[SW] Settings synced:', data);
        });
    }

    if (type === 'CHECK_NOTIFICATION') {
        // オンデマンドで通知チェック
        checkAndSendNotification();
    }

    if (type === 'SEND_TEST') {
        // テスト通知
        self.registration.showNotification('Study Musume テスト通知 🔔', {
            body: 'これはテスト通知です。通知が正しく表示されています！',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
            tag: 'test-notification',
            data: { url: '/', type: 'test' }
        });
    }
});

// 通知クリック
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            // 既に開いているタブがあればフォーカス
            for (const client of clients) {
                if (client.url.includes(self.location.origin)) {
                    return client.focus();
                }
            }
            // なければ新しいタブを開く
            return self.clients.openWindow(url);
        })
    );
});

// 定期チェック用 setInterval（SW起動中のみ動作）
setInterval(() => {
    checkAndSendNotification();
}, CHECK_INTERVAL);

// SW起動時にも即チェック
checkAndSendNotification();
