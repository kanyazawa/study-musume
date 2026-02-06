import { ALL_ITEMS } from '../data/itemData';

/**
 * アイテムIDからアイテム情報を取得する
 * @param {string} itemId - アイテムID
 * @returns {Object|null} アイテム情報
 */
export const getItemById = (itemId) => {
    return ALL_ITEMS.find(item => item.id === itemId) || null;
};

/**
 * インベントリをタイプ別にフィルタリングする
 * @param {Array} inventory - インベントリ
 * @param {string} type - タイプ（'gift', 'boost', 'costume'など）
 * @returns {Array} フィルタリングされたインベントリアイテム（詳細情報付き）
 */
export const filterInventoryByType = (inventory, type) => {
    return inventory
        .map(invItem => {
            const itemData = getItemById(invItem.itemId);
            return itemData ? { ...invItem, ...itemData } : null;
        })
        .filter(item => item && (type === 'all' || item.type === type));
};

/**
 * インベントリからアイテムを削除する
 * @param {Array} inventory - 現在のインベントリ
 * @param {string} itemId - 削除するアイテムのID
 * @param {number} quantity - 削除する個数（デフォルト1）
 * @returns {Array} 更新されたインベントリ
 */
export const removeFromInventory = (inventory, itemId, quantity = 1) => {
    const existingIndex = inventory.findIndex(i => i.itemId === itemId);

    if (existingIndex === -1) {
        // アイテムが存在しない場合は変更なし
        return inventory;
    }

    const newInventory = [...inventory];
    const currentQuantity = newInventory[existingIndex].quantity;

    if (currentQuantity <= quantity) {
        // 全て削除
        newInventory.splice(existingIndex, 1);
    } else {
        // 個数を減らす
        newInventory[existingIndex] = {
            ...newInventory[existingIndex],
            quantity: currentQuantity - quantity
        };
    }

    return newInventory;
};
