/**
 * ゲーム統計情報の保存・読み込みユーティリティ
 */

const STORAGE_KEY = 'gameStats';

/**
 * デフォルトの統計情報を取得
 * @returns {Object} デフォルトの統計情報
 */
export const getDefaultStats = () => ({
    name: 'トレーナー',
    rank: 'C+',
    tp: 60,
    maxTp: 100,
    intellect: 0,
    diamonds: 3000,
    affection: 0,
    affectionLevel: 0,
    inventory: [],
    equippedSkin: 'default',
    equippedBackground: 'default',
    selectedTitle: null,
    // プロフィールカスタマイズ
    characterName: 'さくら',
    selectedIcon: 'default',
    unlockedIcons: ['default'],
    // キャラクター選択
    characterId: 'noah', // default: 'noah'
    hasSelectedCharacter: false, // 初回選択が完了しているか
    // ログインボーナス
    hasReceivedWelcomeBonus: true,
    lastLoginDate: null,
    loginStreak: 0,
    totalLoginDays: 0,
    // TP回復システム
    lastTpUpdateTime: Date.now()
});

// ============================================
// クラウド同期用ヘルパー
// ============================================

// クラウド同期対象のlocalStorageキー一覧
const SYNC_KEYS = [
    'gameStats',
    'reviewQuestions',
    'studyHistory',
    'gachaHistory',
    'pityCounter',
    'missionProgress',
    'lastMissionReset',
    'studiedSubjectsToday',
    'uma_main_goal',
    'uma_todos',
    'achievements',
    'statsTracking',
    'studyProgress',
    'lastStudyTopic',
];

// デバウンスタイマー
let _syncTimer = null;
let _syncFn = null;

/**
 * クラウド同期関数を登録
 */
export const registerCloudSync = (fn) => {
    _syncFn = fn;
};

const triggerCloudSync = () => {
    if (!_syncFn) return;
    if (_syncTimer) clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => {
        _syncFn().catch(err => console.warn('Cloud sync error:', err));
    }, 5000);
};

/**
 * 統計情報をlocalStorageに保存
 * @param {Object} stats - 保存する統計情報
 */
export const saveStats = (stats) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
        console.log('Stats saved:', stats);
        triggerCloudSync();
    } catch (error) {
        console.error('Error saving stats:', error);
    }
};

/**
 * 全セーブデータの一括収集
 */
export const collectAllSaveData = () => {
    const data = {};
    for (const key of SYNC_KEYS) {
        const val = localStorage.getItem(key);
        if (val !== null) {
            data[key] = val;
        }
    }
    data._savedAt = Date.now();
    return data;
};

/**
 * 全セーブデータの復元
 */
export const restoreAllSaveData = (data) => {
    if (!data) return;
    for (const key of SYNC_KEYS) {
        if (data[key] !== undefined && data[key] !== null) {
            localStorage.setItem(key, data[key]);
        }
    }
};

/**
 * localStorageから統計情報を読み込み
 * @returns {Object} 読み込んだ統計情報（存在しない場合はデフォルト値）
 */
export const loadStats = () => {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData) {
            const parsed = JSON.parse(savedData);

            console.log('Stats loaded from localStorage:', parsed);

            // デフォルト値とマージ（新しいフィールドが追加された場合の対策）
            const loadedStats = { ...getDefaultStats(), ...parsed };

            // 初回ログインボーナスチェック（未受取ならダイヤ+3000）
            // 旧データ（undefined）または false の場合に付与
            if (parsed.hasReceivedWelcomeBonus !== true) {
                console.log('Granting Welcome Bonus: 3000 Diamonds');
                loadedStats.diamonds = (loadedStats.diamonds || 0) + 3000;
                loadedStats.hasReceivedWelcomeBonus = true;
                // 即座に保存して重複付与を防ぐ
                localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedStats));
            }

            return loadedStats;

        }

        console.log('No saved stats found, using defaults');
        return getDefaultStats();
    } catch (error) {
        console.error('Error loading stats:', error);
        return getDefaultStats();
    }
};

/**
 * セーブデータをクリア（デバッグ用）
 */
export const clearSaveData = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('Save data cleared');
    } catch (error) {
        console.error('Error clearing save data:', error);
    }
};

/**
 * セーブデータが存在するか確認
 * @returns {boolean} セーブデータが存在する場合true
 */
export const hasSaveData = () => {
    return localStorage.getItem(STORAGE_KEY) !== null;
};
