// ガチャで入手可能なアイテムデータ

// レアリティ定義
export const RARITY = {
    N: { stars: 1, label: '★', color: '#999999', rate: 49 },
    N_PLUS: { stars: 2, label: '★★', color: '#66cc66', rate: 30 },
    R: { stars: 3, label: '★★★', color: '#6699ff', rate: 15 },
    SR: { stars: 4, label: '★★★★', color: '#cc66ff', rate: 5 },
    SSR: { stars: 5, label: '★★★★★', color: '#ffcc00', rate: 1 }
};

// スキンアイテム（後でNANOBANANAで追加予定）
export const GACHA_SKINS = [
    // 例: 
    // {
    //     id: 'skin_example',
    //     name: 'サンプルスキン',
    //     rarity: 'SSR',
    //     type: 'skin',
    //     emoji: '👗',
    //     description: 'サンプルの説明'
    // }
];

// 背景アイテム（後でNANOBANANAで追加予定）
export const GACHA_BACKGROUNDS = [
    // 例:
    // {
    //     id: 'bg_example',
    //     name: 'サンプル背景',
    //     rarity: 'SR',
    //     type: 'background',
    //     emoji: '🖼️',
    //     description: 'サンプルの説明'
    // }
];

// 全ガチャアイテムを統合
export const ALL_GACHA_ITEMS = [
    ...GACHA_SKINS,
    ...GACHA_BACKGROUNDS
];

// レアリティごとのアイテムを取得
export const getItemsByRarity = (rarity) => {
    return ALL_GACHA_ITEMS.filter(item => item.rarity === rarity);
};

// ガチャプール（確率計算用）
export const GACHA_POOL = {
    N: getItemsByRarity('N'),
    N_PLUS: getItemsByRarity('N_PLUS'),
    R: getItemsByRarity('R'),
    SR: getItemsByRarity('SR'),
    SSR: getItemsByRarity('SSR')
};
