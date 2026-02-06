import { AFFECTION_LEVELS, AFFECTION_QUOTES } from '../data/affectionData';

/**
 * 好感度ポイントから現在のレベル情報を取得する
 * @param {number} affection - 現在の好感度ポイント
 * @returns {Object} レベル情報
 */
export const getAffectionLevel = (affection) => {
    // レベルを降順で検索し、条件を満たす最初のレベルを返す
    for (let i = AFFECTION_LEVELS.length - 1; i >= 0; i--) {
        if (affection >= AFFECTION_LEVELS[i].points) {
            return AFFECTION_LEVELS[i];
        }
    }

    // フォールバック（レベル0）
    return AFFECTION_LEVELS[0];
};

/**
 * 次のレベル情報を取得する
 * @param {number} currentLevel - 現在のレベル
 * @returns {Object|null} 次のレベル情報、最大レベルの場合はnull
 */
export const getNextLevel = (currentLevel) => {
    const nextLevel = AFFECTION_LEVELS.find(level => level.level === currentLevel + 1);
    return nextLevel || null;
};

/**
 * 現在のレベルから次のレベルまでの進捗率を計算する
 * @param {number} affection - 現在の好感度ポイント
 * @returns {number} 進捗率（0〜100）
 */
export const getAffectionProgress = (affection) => {
    const currentLevelInfo = getAffectionLevel(affection);
    const nextLevelInfo = getNextLevel(currentLevelInfo.level);

    // 最大レベルに到達している場合
    if (!nextLevelInfo) {
        return 100;
    }

    const currentPoints = currentLevelInfo.points;
    const nextPoints = nextLevelInfo.points;
    const range = nextPoints - currentPoints;
    const progress = affection - currentPoints;

    return Math.min((progress / range) * 100, 100);
};

/**
 * 次のレベルまでに必要なポイントを計算する
 * @param {number} affection - 現在の好感度ポイント
 * @returns {number} 必要ポイント数、最大レベルの場合は0
 */
export const getPointsToNextLevel = (affection) => {
    const currentLevelInfo = getAffectionLevel(affection);
    const nextLevelInfo = getNextLevel(currentLevelInfo.level);

    if (!nextLevelInfo) {
        return 0;
    }

    return Math.max(nextLevelInfo.points - affection, 0);
};

/**
 * 好感度レベルに応じたランダムなセリフを取得する
 * @param {number} affectionLevel - 好感度レベル
 * @returns {string} セリフ
 */
export const getRandomQuote = (affectionLevel) => {
    // レベルに対応するセリフ配列を取得
    const quotes = AFFECTION_QUOTES[affectionLevel] || AFFECTION_QUOTES[0];

    // ランダムに1つ選択
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
};

/**
 * レベルアップが発生したかチェックする
 * @param {number} oldAffection - 変更前の好感度
 * @param {number} newAffection - 変更後の好感度
 * @returns {Object|null} レベルアップ情報、レベルアップしていない場合はnull
 */
export const checkLevelUp = (oldAffection, newAffection) => {
    const oldLevel = getAffectionLevel(oldAffection);
    const newLevel = getAffectionLevel(newAffection);

    if (newLevel.level > oldLevel.level) {
        return {
            oldLevel: oldLevel.level,
            newLevel: newLevel.level,
            levelInfo: newLevel
        };
    }

    return null;
};

/**
 * 好感度の変化量を計算する
 * @param {number} baseAffection - 基礎好感度上昇値
 * @param {number} currentLevel - 現在のレベル
 * @returns {number} 実際の好感度上昇値
 */
export const calculateAffectionGain = (baseAffection, currentLevel) => {
    // レベルが高いほど上昇量が減少する（オプション）
    // 現在は基礎値をそのまま返す
    return baseAffection;
};

/**
 * 最大レベルに到達しているかチェックする
 * @param {number} affection - 現在の好感度ポイント
 * @returns {boolean} 最大レベルかどうか
 */
export const isMaxLevel = (affection) => {
    const maxLevel = AFFECTION_LEVELS[AFFECTION_LEVELS.length - 1];
    return affection >= maxLevel.points;
};

/**
 * 好感度レベルのタイトルを取得する
 * @param {number} affection - 現在の好感度ポイント
 * @returns {string} レベルタイトル
 */
export const getAffectionTitle = (affection) => {
    const levelInfo = getAffectionLevel(affection);
    return levelInfo.title;
};
