/**
 * ログインボーナス関連のユーティリティ
 */

// 7日サイクルの報酬定義
export const LOGIN_REWARDS = [
    { day: 1, diamonds: 5, special: null, description: '💎 ダイヤ×5' },
    { day: 2, diamonds: 5, special: null, description: '💎 ダイヤ×5' },
    { day: 3, diamonds: 10, special: null, description: '💎 ダイヤ×10' },
    { day: 4, diamonds: 5, special: null, description: '💎 ダイヤ×5' },
    { day: 5, diamonds: 10, special: null, description: '💎 ダイヤ×10' },
    { day: 6, diamonds: 15, special: null, description: '💎 ダイヤ×15' },
    { day: 7, diamonds: 30, special: 'gacha_ticket', description: '💎 ダイヤ×30 + 🎫 ガチャチケット' },
];

/**
 * 今日の日付を取得（YYYY-MM-DD形式）
 */
export const getTodayString = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
};

/**
 * ログインボーナスを受け取れるかチェック
 */
export const canReceiveLoginBonus = (lastLoginDate) => {
    const today = getTodayString();
    return lastLoginDate !== today;
};

/**
 * 連続ログインかどうかをチェック
 */
export const isConsecutiveLogin = (lastLoginDate) => {
    if (!lastLoginDate) return false;

    const today = new Date();
    const lastLogin = new Date(lastLoginDate);

    // 日付のみで比較するため時間をリセット
    today.setHours(0, 0, 0, 0);
    lastLogin.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastLogin.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    return diffDays === 1;
};

/**
 * 今日の報酬を取得
 */
export const getTodayReward = (loginStreak) => {
    // 1-7のサイクルで報酬を決定
    const dayIndex = ((loginStreak) % 7);
    return LOGIN_REWARDS[dayIndex];
};

/**
 * ログインボーナスを処理して新しいstatsを返す
 */
export const processLoginBonus = (currentStats) => {
    const today = getTodayString();

    // すでに今日ログイン済みならnullを返す
    if (currentStats.lastLoginDate === today) {
        return null;
    }

    // 連続ログインかチェック（記録用）
    const consecutive = isConsecutiveLogin(currentStats.lastLoginDate);

    // 連続ログイン日数を更新（記録用として残す）
    let newStreak = consecutive ? (currentStats.loginStreak || 0) + 1 : 1;

    // 累計ログイン日数を更新
    const newTotalDays = (currentStats.totalLoginDays || 0) + 1;

    // 報酬を取得（累積日数に基づいて決定）
    // 1-7のサイクルで報酬を決定 (newTotalDays - 1 で 0-6 のインデックスを作成)
    const reward = getTodayReward(newTotalDays - 1);

    // 新しいダイヤ数
    const newDiamonds = (currentStats.diamonds || 0) + reward.diamonds;

    return {
        updates: {
            lastLoginDate: today,
            loginStreak: newStreak,
            totalLoginDays: newTotalDays,
            diamonds: newDiamonds
        },
        reward: reward,
        streak: newTotalDays, // 表示用には累計日数を使う
        totalDays: newTotalDays,
        consecutive: consecutive
    };
};
