import { ALL_ITEMS } from './itemData';

// ガチャで入手可能なアイテムデータ

// レアリティ定義
export const RARITY = {
    N: { stars: 1, label: '★', color: '#999999', rate: 49 },
    N_PLUS: { stars: 2, label: '★★', color: '#66cc66', rate: 30 },
    R: { stars: 3, label: '★★★', color: '#6699ff', rate: 15 },
    SR: { stars: 4, label: '★★★★', color: '#cc66ff', rate: 5 },
    SSR: { stars: 5, label: '★★★★★', color: '#ffcc00', rate: 1 }
};

// 全ガチャアイテムを統合 (itemData.js から取得)
export const ALL_GACHA_ITEMS = ALL_ITEMS;

// スキン・背景のみを抽出（必要であれば）
export const GACHA_SKINS = ALL_GACHA_ITEMS.filter(item => item.type === 'skin');
export const GACHA_BACKGROUNDS = ALL_GACHA_ITEMS.filter(item => item.type === 'background');

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

