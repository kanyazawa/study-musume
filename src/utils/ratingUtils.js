/**
 * マルチプレイ対戦のレーティングユーティリティ
 * 
 * Eloレーティング方式を採用:
 *   - 初期レート: 1000
 *   - K値: 32 (変動幅)
 *   - レートに応じて英検レベル（出題範囲）が変動
 */

// ==============================
// レート → 英検レベル マッピング
// ==============================
export const LEVEL_THRESHOLDS = [
    { minRating: 0,    level: 'grade5',    label: '英検5級', emoji: '🟢', color: '#4CAF50' },
    { minRating: 1200, level: 'grade4',    label: '英検4級', emoji: '🔵', color: '#2196F3' },
    { minRating: 1500, level: 'grade3',    label: '英検3級', emoji: '🟣', color: '#9C27B0' },
    { minRating: 1800, level: 'grade_pre2', label: '英検準2級', emoji: '🔴', color: '#F44336' },
];

/**
 * レートから英検レベルを取得
 * @param {number} rating 
 * @returns {{ level: string, label: string, emoji: string, color: string, minRating: number }}
 */
export function getLevelFromRating(rating) {
    // 閾値が大きい順に走査して最初にマッチしたレベルを返す
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (rating >= LEVEL_THRESHOLDS[i].minRating) {
            return LEVEL_THRESHOLDS[i];
        }
    }
    return LEVEL_THRESHOLDS[0]; // fallback: 5級
}

/**
 * 次のレベルまでに必要なレートを取得
 * @param {number} rating
 * @returns {{ nextLevel: object|null, remaining: number }}
 */
export function getNextLevelInfo(rating) {
    const currentLevel = getLevelFromRating(rating);
    const currentIdx = LEVEL_THRESHOLDS.findIndex(l => l.level === currentLevel.level);
    
    if (currentIdx >= LEVEL_THRESHOLDS.length - 1) {
        return { nextLevel: null, remaining: 0 }; // 最高レベル
    }
    
    const nextLevel = LEVEL_THRESHOLDS[currentIdx + 1];
    return {
        nextLevel,
        remaining: nextLevel.minRating - rating,
    };
}

// ==============================
// レート → ランク称号
// ==============================
export const RANK_TIERS = [
    { minRating: 0,    rank: 'ビギナー',    icon: '🥉' },
    { minRating: 800,  rank: 'ブロンズ',    icon: '🥉' },
    { minRating: 1000, rank: 'シルバー',    icon: '🥈' },
    { minRating: 1200, rank: 'ゴールド',    icon: '🥇' },
    { minRating: 1500, rank: 'プラチナ',    icon: '💎' },
    { minRating: 1800, rank: 'ダイヤモンド', icon: '💠' },
    { minRating: 2100, rank: 'マスター',    icon: '👑' },
];

/**
 * レートからランク情報を取得
 * @param {number} rating
 * @returns {{ rank: string, icon: string }}
 */
export function getRankFromRating(rating) {
    for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
        if (rating >= RANK_TIERS[i].minRating) {
            return RANK_TIERS[i];
        }
    }
    return RANK_TIERS[0];
}

// ==============================
// Eloレーティング計算
// ==============================
const K_FACTOR = 32;
const MIN_RATING = 0; // 最低レート

/**
 * Eloレーティングの期待勝率を計算
 * @param {number} ratingA 
 * @param {number} ratingB 
 * @returns {number} AがBに勝つ確率
 */
function expectedScore(ratingA, ratingB) {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * 対戦結果に基づいてレート変動を計算
 * @param {number} myRating - 自分のレート
 * @param {number} opponentRating - 相手のレート
 * @param {boolean} didWin - 勝ったかどうか
 * @returns {{ newRating: number, change: number }}
 */
export function calculateRatingChange(myRating, opponentRating, didWin) {
    const expected = expectedScore(myRating, opponentRating);
    const actual = didWin ? 1.0 : 0.0;
    const change = Math.round(K_FACTOR * (actual - expected));
    const newRating = Math.max(MIN_RATING, myRating + change);
    
    return {
        newRating,
        change: newRating - myRating, // 実際の変動（MIN_RATINGの影響を反映）
    };
}

/**
 * 引き分け時のレート変動
 * @param {number} myRating
 * @param {number} opponentRating
 * @returns {{ newRating: number, change: number }}
 */
export function calculateDrawRatingChange(myRating, opponentRating) {
    const expected = expectedScore(myRating, opponentRating);
    const actual = 0.5; // 引き分け
    const change = Math.round(K_FACTOR * (actual - expected));
    const newRating = Math.max(MIN_RATING, myRating + change);
    
    return {
        newRating,
        change: newRating - myRating,
    };
}

// 定数エクスポート
export const DEFAULT_RATING = 1000;
