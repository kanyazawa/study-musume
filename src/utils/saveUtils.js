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
    diamonds: 0,
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
    // ログインボーナス
    hasReceivedWelcomeBonus: false,
    lastLoginDate: null,
    loginStreak: 0,
    totalLoginDays: 0,
    // TP回復システム
    lastTpUpdateTime: Date.now()
});


/**
 * 統計情報をlocalStorageに保存
 * @param {Object} stats - 保存する統計情報
 */
export const saveStats = (stats) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
        console.log('Stats saved:', stats);
    } catch (error) {
        console.error('Error saving stats:', error);
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
            if (!loadedStats.hasReceivedWelcomeBonus) {
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
