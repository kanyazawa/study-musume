// アイコン一覧データ
export const ICONS = [
    {
        id: 'default',
        name: 'デフォルト',
        emoji: '👤',
        requiredAchievement: null,
        description: '基本のアイコン'
    },
    {
        id: 'study_master',
        name: '勉強マスター',
        emoji: '📚',
        requiredAchievement: 'total_100',
        description: '100問達成で解放'
    },
    {
        id: 'perfect_scorer',
        name: 'パーフェクト',
        emoji: '💯',
        requiredAchievement: 'perfect_10',
        description: '10回連続正解で解放'
    },
    {
        id: 'fire_learner',
        name: '炎の学習者',
        emoji: '🔥',
        requiredAchievement: 'streak_7',
        description: '7日連続学習で解放'
    },
    {
        id: 'star_student',
        name: 'スター生徒',
        emoji: '⭐',
        requiredAchievement: 'total_500',
        description: '500問達成で解放'
    },
    {
        id: 'trophy_collector',
        name: 'トロフィー',
        emoji: '🏆',
        requiredAchievement: 'achievement_10',
        description: '実績10個達成で解放'
    },
    {
        id: 'brain_power',
        name: '天才',
        emoji: '🧠',
        requiredAchievement: 'accuracy_95',
        description: '正答率95%以上で解放'
    },
    {
        id: 'rocket_learner',
        name: 'ロケット',
        emoji: '🚀',
        requiredAchievement: 'total_1000',
        description: '1000問達成で解放'
    },
    {
        id: 'crown',
        name: '王冠',
        emoji: '👑',
        requiredAchievement: 'all_subjects',
        description: '全科目マスターで解放'
    },
    {
        id: 'diamond',
        name: 'ダイヤモンド',
        emoji: '💎',
        requiredAchievement: 'legend',
        description: 'レジェンド実績で解放'
    },
    {
        id: 'heart',
        name: 'ハート',
        emoji: '💖',
        requiredAchievement: 'affection_max',
        description: '好感度MAXで解放'
    },
    {
        id: 'sparkles',
        name: 'キラキラ',
        emoji: '✨',
        requiredAchievement: 'gacha_ssr',
        description: 'SSR獲得で解放'
    }
];

/**
 * アイコンIDからアイコンデータを取得
 */
export const getIconById = (iconId) => {
    return ICONS.find(icon => icon.id === iconId) || ICONS[0];
};

/**
 * 解放済みアイコンを取得
 */
export const getUnlockedIcons = (unlockedIconIds) => {
    return ICONS.filter(icon => unlockedIconIds.includes(icon.id));
};

/**
 * ロック中のアイコンを取得
 */
export const getLockedIcons = (unlockedIconIds) => {
    return ICONS.filter(icon => !unlockedIconIds.includes(icon.id));
};

/**
 * 実績達成時にアイコンを解放すべきかチェック
 */
export const checkIconUnlock = (achievementId, currentUnlockedIcons) => {
    const iconToUnlock = ICONS.find(icon => icon.requiredAchievement === achievementId);

    if (iconToUnlock && !currentUnlockedIcons.includes(iconToUnlock.id)) {
        return iconToUnlock.id;
    }

    return null;
};
