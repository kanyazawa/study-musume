// アイテムのマスターデータ

export const ALL_ITEMS = [
    // === プレゼントアイテム（SSR） ===
    {
        id: 'gift_ssr_001',
        type: 'gift',
        name: '高級万年筆セット',
        rarity: 'SSR',
        affection: 500,
        emoji: '🖊️',
        probability: 1,
        description: '高級な万年筆のセット。勉強好きな彼女にぴったりの贈り物。'
    },
    {
        id: 'gift_ssr_002',
        type: 'gift',
        name: '限定版参考書セット',
        rarity: 'SSR',
        affection: 500,
        emoji: '📚',
        probability: 1,
        description: '希少な限定版参考書。これがあれば勉強が捗ること間違いなし。'
    },
    {
        id: 'gift_ssr_003',
        type: 'gift',
        name: 'ノートPC',
        rarity: 'SSR',
        affection: 800,
        emoji: '💻',
        probability: 0.5,
        description: '最新のノートPC。デジタル学習に最適な高性能マシン。'
    },
    {
        id: 'gift_ssr_004',
        type: 'gift',
        name: '高級紅茶セット',
        rarity: 'SSR',
        affection: 400,
        emoji: '☕',
        probability: 1.5,
        description: '世界中から集めた高級紅茶のセット。優雅な休憩時間を演出。'
    },

    // === プレゼントアイテム（SR） ===
    {
        id: 'gift_sr_001',
        type: 'gift',
        name: 'おしゃれな付箋セット',
        rarity: 'SR',
        affection: 200,
        emoji: '📝',
        probability: 3,
        description: 'カラフルで可愛い付箋のセット。勉強のモチベーションアップに。'
    },
    {
        id: 'gift_sr_002',
        type: 'gift',
        name: '高級ノート',
        rarity: 'SR',
        affection: 250,
        emoji: '📓',
        probability: 3,
        description: '書き心地抜群の高級ノート。大切なことを書き留めるのに最適。'
    },
    {
        id: 'gift_sr_003',
        type: 'gift',
        name: 'カラーマーカーセット',
        rarity: 'SR',
        affection: 200,
        emoji: '🎨',
        probability: 3,
        description: '豊富なカラーバリエーションのマーカーセット。ノートが華やかに。'
    },
    {
        id: 'gift_sr_004',
        type: 'gift',
        name: 'チョコレート',
        rarity: 'SR',
        affection: 150,
        emoji: '🍫',
        probability: 4,
        description: '高級チョコレート。甘いものは脳の栄養になるらしい。'
    },
    {
        id: 'gift_sr_005',
        type: 'gift',
        name: 'ぬいぐるみ',
        rarity: 'SR',
        affection: 200,
        emoji: '🧸',
        probability: 3,
        description: 'ふわふわのぬいぐるみ。勉強の合間の癒しグッズ。'
    },

    // === プレゼントアイテム（R） ===
    {
        id: 'gift_r_001',
        type: 'gift',
        name: 'かわいいクリップセット',
        rarity: 'R',
        affection: 50,
        emoji: '📎',
        probability: 12,
        description: 'デザイン性の高いクリップセット。プリントの整理に便利。'
    },
    {
        id: 'gift_r_002',
        type: 'gift',
        name: 'シールセット',
        rarity: 'R',
        affection: 50,
        emoji: '⭐',
        probability: 12,
        description: 'キラキラのシールセット。ノートのデコレーションに。'
    },
    {
        id: 'gift_r_003',
        type: 'gift',
        name: 'クリアファイル',
        rarity: 'R',
        affection: 80,
        emoji: '🗂️',
        probability: 10,
        description: '丈夫なクリアファイル。大切な資料を保管するのに最適。'
    },
    {
        id: 'gift_r_004',
        type: 'gift',
        name: 'キャンディ',
        rarity: 'R',
        affection: 30,
        emoji: '🍬',
        probability: 15,
        description: '美味しいキャンディ。ちょっとした気分転換に。'
    },
    {
        id: 'gift_r_005',
        type: 'gift',
        name: 'ドリンク',
        rarity: 'R',
        affection: 40,
        emoji: '🥤',
        probability: 13,
        description: 'リフレッシュドリンク。勉強中の水分補給は大事。'
    },
    {
        id: 'gift_r_006',
        type: 'gift',
        name: 'クッキー',
        rarity: 'R',
        affection: 50,
        emoji: '🍪',
        probability: 12,
        description: 'サクサクのクッキー。小腹が空いた時にぴったり。'
    },

    // === 経験値ブーストアイテム ===
    {
        id: 'boost_ssr_001',
        type: 'boost',
        name: '経験値3倍ブースト',
        rarity: 'SSR',
        multiplier: 3,
        duration: 60, // 分
        emoji: '🚀',
        probability: 1,
        description: '60分間、獲得経験値が3倍になる。短期集中学習に最適。'
    },
    {
        id: 'boost_sr_001',
        type: 'boost',
        name: '経験値2倍ブースト',
        rarity: 'SR',
        multiplier: 2,
        duration: 30,
        emoji: '⚡',
        probability: 3,
        description: '30分間、獲得経験値が2倍になる。効率的に学習しよう。'
    },
    {
        id: 'boost_r_001',
        type: 'boost',
        name: '経験値1.5倍ブースト',
        rarity: 'R',
        multiplier: 1.5,
        duration: 15,
        emoji: '💫',
        probability: 10,
        description: '15分間、獲得経験値が1.5倍になる。ちょっとしたブーストに。'
    },

    // === 衣装（スキン）アイテム ===
    {
        id: 'skin_casual',
        type: 'skin',
        name: '私服（パーカー）',
        rarity: 'SSR',
        emoji: '🧥',
        probability: 2,
        description: 'ノアが普段着ているラフなパーカー姿。',
        imageName: 'character_casual_v9.png'
    },
    {
        id: 'skin_summer',
        type: 'skin',
        name: '夏制服',
        rarity: 'SR',
        emoji: '👕',
        probability: 4,
        description: '爽やかな夏用の制服。',
        filter: 'sepia(0.2) saturate(1.2)'
    },

    // === 背景アイテム ===
    {
        id: 'bg_sunset',
        type: 'background',
        name: '夕焼けの教室',
        rarity: 'SSR',
        emoji: '🌅',
        probability: 2,
        description: '夕焼けに染まる美しい教室。特別な雰囲気。',
        bgStyle: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 50%, #a86aa4 100%)'
    },
    {
        id: 'bg_cafe',
        type: 'background',
        name: 'おしゃれなカフェ',
        rarity: 'SR',
        emoji: '☕',
        probability: 5,
        description: '落ち着いた雰囲気のカフェ。勉強も捗りそう。',
        bgStyle: 'linear-gradient(135deg, #e6dada 0%, #274046 100%)'
    },
];

// レアリティごとの色定義
export const RARITY_COLORS = {
    SSR: '#FFD700', // ゴールド
    SR: '#C0C0C0',  // シルバー
    R: '#CD7F32'    // ブロンズ
};

// レアリティごとの背景色（グラデーション用）
export const RARITY_BG_COLORS = {
    SSR: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    SR: 'linear-gradient(135deg, #E8E8E8 0%, #A0A0A0 100%)',
    R: 'linear-gradient(135deg, #DEB887 0%, #8B4513 100%)'
};

// レアリティ名（日本語）
export const RARITY_NAMES = {
    SSR: '超激レア',
    SR: '激レア',
    R: 'レア'
};

// ガチャ価格
export const GACHA_PRICES = {
    single: 150,    // 単発
    multi: 1500     // 10連
};
