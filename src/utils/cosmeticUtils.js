import { ALL_ITEMS } from '../data/itemData';

/**
 * アイテムIDからスキンの画像パスを取得する
 * @param {string} skinId - 装備中のスキンID
 * @param {string} defaultImage - デフォルトの画像パス
 * @returns {string} 画像パス
 */
export const getSkinImage = (skinId, defaultImage) => {
    if (skinId === 'default') return defaultImage;

    const item = ALL_ITEMS.find(i => i.id === skinId);
    if (item && item.imageName) {
        // imageNameがある場合は assets/images から読み込む
        // 実行時に動的にインポートするのは難しい場合があるため、
        // ここではパス文字列を返すが、コンポーネント側での処理が必要になる場合がある。
        return item.imageName;
    }

    return defaultImage;
};

/**
 * アイテムIDからスキンのCSSフィルターを取得する
 * @param {string} skinId - 装備中のスキンID
 * @returns {string} CSSフィルター
 */
export const getSkinFilter = (skinId) => {
    if (skinId === 'default') return 'none';

    const item = ALL_ITEMS.find(i => i.id === skinId);
    return item?.filter || 'none';
};

/**
 * アイテムIDから背景のスタイル（CSS）を取得する
 * @param {string} bgId - 装備中の背景ID
 * @returns {object} CSSスタイルオブジェクト
 */
export const getBackgroundStyle = (bgId) => {
    if (bgId === 'default') return {};

    const item = ALL_ITEMS.find(i => i.id === bgId);
    if (item && item.bgStyle) {
        return { background: item.bgStyle };
    }

    return {};
};

/**
 * 所持しているスキン一覧を取得する
 * @param {Array} inventory - インベントリ
 * @returns {Array} スキンアイテムの配列
 */
export const getOwnedSkins = (inventory) => {
    const ownedSkins = inventory
        .filter(invItem => {
            const item = ALL_ITEMS.find(i => i.id === invItem.itemId);
            return item && item.type === 'skin';
        })
        .map(invItem => ALL_ITEMS.find(i => i.id === invItem.itemId));

    // デフォルトスキンを先頭に追加
    return [
        { id: 'default', name: '通常制服', type: 'skin', emoji: '👗' },
        ...ownedSkins
    ];
};

/**
 * 所持している背景一覧を取得する
 * @param {Array} inventory - インベントリ
 * @returns {Array} 背景アイテムの配列
 */
export const getOwnedBackgrounds = (inventory) => {
    const ownedBgs = inventory
        .filter(invItem => {
            const item = ALL_ITEMS.find(i => i.id === invItem.itemId);
            return item && item.type === 'background';
        })
        .map(invItem => ALL_ITEMS.find(i => i.id === invItem.itemId));

    // デフォルト背景を先頭に追加
    return [
        { id: 'default', name: 'デフォルト', type: 'background', emoji: '🏠' },
        ...ownedBgs
    ];
};

/**
 * 次のスキンを取得する（切り替え用）
 * @param {string} currentSkinId - 現在のスキンID
 * @param {Array} inventory - インベントリ
 * @returns {string} 次のスキンID
 */
export const getNextSkinId = (currentSkinId, inventory) => {
    const skins = getOwnedSkins(inventory);
    const currentIndex = skins.findIndex(s => s.id === currentSkinId);
    const nextIndex = (currentIndex + 1) % skins.length;
    return skins[nextIndex].id;
};
