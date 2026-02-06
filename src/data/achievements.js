/**
 * 実績/トロフィーシステムの定義
 */

export const ACHIEVEMENT_CATEGORIES = {
    STUDY: 'study',
    AFFECTION: 'affection',
    COLLECTION: 'collection',
    SPECIAL: 'special',
};

export const ACHIEVEMENTS = [
    // 学習系
    {
        id: 'first_study',
        category: ACHIEVEMENT_CATEGORIES.STUDY,
        name: '学びの第一歩',
        description: '初めて勉強を完了した',
        icon: '📖',
        condition: { type: 'study_count', value: 1 },
        rewards: { diamonds: 10, title: '初学者' },
        rarity: 'common',
    },
    {
        id: 'study_10',
        category: ACHIEVEMENT_CATEGORIES.STUDY,
        name: '継続の力',
        description: '10回勉強を完了した',
        icon: '📚',
        condition: { type: 'study_count', value: 10 },
        rewards: { diamonds: 30, title: '努力家' },
        rarity: 'common',
    },
    {
        id: 'study_50',
        category: ACHIEVEMENT_CATEGORIES.STUDY,
        name: '勤勉なる者',
        description: '50回勉強を完了した',
        icon: '🎓',
        condition: { type: 'study_count', value: 50 },
        rewards: { diamonds: 100, title: '秀才' },
        rarity: 'rare',
    },
    {
        id: 'study_100',
        category: ACHIEVEMENT_CATEGORIES.STUDY,
        name: '学問の達人',
        description: '100回勉強を完了した',
        icon: '🏆',
        condition: { type: 'study_count', value: 100 },
        rewards: { diamonds: 300, title: '博学者' },
        rarity: 'epic',
    },
    {
        id: 'perfect_10',
        category: ACHIEVEMENT_CATEGORIES.STUDY,
        name: 'パーフェクト10',
        description: '10回満点を取った',
        icon: '⭐',
        condition: { type: 'perfect_count', value: 10 },
        rewards: { diamonds: 50, title: '完璧主義者' },
        rarity: 'rare',
    },
    {
        id: 'streak_7',
        category: ACHIEVEMENT_CATEGORIES.STUDY,
        name: '1週間の継続',
        description: '7日連続で勉強した',
        icon: '🔥',
        condition: { type: 'study_streak', value: 7 },
        rewards: { diamonds: 50, title: '継続は力なり' },
        rarity: 'rare',
    },
    {
        id: 'streak_30',
        category: ACHIEVEMENT_CATEGORIES.STUDY,
        name: '1ヶ月の習慣',
        description: '30日連続で勉強した',
        icon: '🌟',
        condition: { type: 'study_streak', value: 30 },
        rewards: { diamonds: 200, title: '鉄の意志' },
        rarity: 'epic',
    },
    {
        id: 'total_time_10h',
        category: ACHIEVEMENT_CATEGORIES.STUDY,
        name: '10時間の努力',
        description: '累計10時間勉強した',
        icon: '⏰',
        condition: { type: 'total_study_time', value: 600 }, // 10時間 = 600分
        rewards: { diamonds: 50, title: '時間管理者' },
        rarity: 'rare',
    },

    // 好感度系
    {
        id: 'affection_lv3',
        category: ACHIEVEMENT_CATEGORIES.AFFECTION,
        name: '友達の証',
        description: '好感度レベル3に到達',
        icon: '💕',
        condition: { type: 'affection_level', value: 3 },
        rewards: { diamonds: 30, title: '友人' },
        rarity: 'common',
    },
    {
        id: 'affection_lv5',
        category: ACHIEVEMENT_CATEGORIES.AFFECTION,
        name: '親友の絆',
        description: '好感度レベル5に到達',
        icon: '💖',
        condition: { type: 'affection_level', value: 5 },
        rewards: { diamonds: 100, title: '親友' },
        rarity: 'rare',
    },
    {
        id: 'affection_max',
        category: ACHIEVEMENT_CATEGORIES.AFFECTION,
        name: '最高の信頼',
        description: '好感度を最大にした',
        icon: '💗',
        condition: { type: 'affection_level', value: 10 },
        rewards: { diamonds: 300, title: '運命の相手' },
        rarity: 'legendary',
    },

    // コレクション系
    {
        id: 'first_gacha',
        category: ACHIEVEMENT_CATEGORIES.COLLECTION,
        name: '初めてのガチャ',
        description: '初めてガチャを引いた',
        icon: '🎁',
        condition: { type: 'gacha_count', value: 1 },
        rewards: { diamonds: 10, title: 'コレクター見習い' },
        rarity: 'common',
    },
    {
        id: 'collection_5',
        category: ACHIEVEMENT_CATEGORIES.COLLECTION,
        name: 'コレクション開始',
        description: '5つのアイテムを所持',
        icon: '💝',
        condition: { type: 'inventory_count', value: 5 },
        rewards: { diamonds: 30, title: 'コレクター' },
        rarity: 'common',
    },
    {
        id: 'all_skins',
        category: ACHIEVEMENT_CATEGORIES.COLLECTION,
        name: 'ファッショニスタ',
        description: 'すべてのスキンを入手',
        icon: '👗',
        condition: { type: 'all_skins', value: true },
        rewards: { diamonds: 200, title: 'おしゃれ番長' },
        rarity: 'epic',
    },

    // 特別
    {
        id: 'early_bird',
        category: ACHIEVEMENT_CATEGORIES.SPECIAL,
        name: '早起きは三文の徳',
        description: '朝6時前に勉強を開始',
        icon: '🌅',
        condition: { type: 'study_early_morning', value: true },
        rewards: { diamonds: 20, title: '早起き番長' },
        rarity: 'rare',
    },
    {
        id: 'night_owl',
        category: ACHIEVEMENT_CATEGORIES.SPECIAL,
        name: '夜更かし学習者',
        description: '深夜0時以降に勉強を開始',
        icon: '🌙',
        condition: { type: 'study_late_night', value: true },
        rewards: { diamonds: 20, title: '夜型人間' },
        rarity: 'rare',
    },
    {
        id: 'all_subjects',
        category: ACHIEVEMENT_CATEGORIES.SPECIAL,
        name: '全科目制覇',
        description: 'すべての科目を勉強した',
        icon: '🎯',
        condition: { type: 'all_subjects', value: true },
        rewards: { diamonds: 100, title: '万能学習者' },
        rarity: 'epic',
    },
    {
        id: 'first_day',
        category: ACHIEVEMENT_CATEGORIES.SPECIAL,
        name: 'ようこそ！',
        description: 'アプリを初めて起動した',
        icon: '✨',
        condition: { type: 'app_start', value: 1 },
        rewards: { diamonds: 5, title: '新入生' },
        rarity: 'common',
    },
];

/**
 * レアリティ情報
 */
export const RARITY_INFO = {
    common: { name: 'コモン', color: '#9e9e9e', gradient: 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)' },
    rare: { name: 'レア', color: '#2196f3', gradient: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)' },
    epic: { name: 'エピック', color: '#9c27b0', gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)' },
    legendary: { name: 'レジェンド', color: '#ff9800', gradient: 'linear-gradient(135deg, #ffd700 0%, #ff9800 100%)' },
};

/**
 * カテゴリー情報
 */
export const CATEGORY_INFO = {
    [ACHIEVEMENT_CATEGORIES.STUDY]: { name: '学習', icon: '📚', color: '#4caf50' },
    [ACHIEVEMENT_CATEGORIES.AFFECTION]: { name: '好感度', icon: '💖', color: '#e91e63' },
    [ACHIEVEMENT_CATEGORIES.COLLECTION]: { name: 'コレクション', icon: '🎁', color: '#ff9800' },
    [ACHIEVEMENT_CATEGORIES.SPECIAL]: { name: '特別', icon: '✨', color: '#9c27b0' },
};

/**
 * 初期実績進捗データを取得
 */
export const getInitialAchievementProgress = () => {
    const progress = {};
    ACHIEVEMENTS.forEach(achievement => {
        progress[achievement.id] = {
            unlocked: false,
            unlockedAt: null,
            notified: false,
        };
    });
    return progress;
};
