import { ALL_ITEMS } from '../data/itemData';

/**
 * アイテムIDからアイテム情報を取得する
 * @param {string} itemId - アイテムID
 * @returns {Object|null} アイテム情報
 */
export const getItemById = (itemId) => {
    return ALL_ITEMS.find(item => item.id === itemId) || null;
};

export const isStackableItem = (itemOrId) => {
    const item = typeof itemOrId === 'string' ? getItemById(itemOrId) : itemOrId;
    return Boolean(item?.stackable);
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

export const getItemTypeLabel = (type) => {
    switch (type) {
        case 'gift':
            return 'プレゼント';
        case 'assist':
            return 'おたすけ';
        case 'boost':
            return 'ブースト';
        case 'skin':
            return 'スキン';
        case 'background':
            return '背景';
        case 'accessory':
            return 'アクセ';
        case 'voice':
            return 'ボイス';
        case 'illustration':
            return '1枚絵';
        case 'story_unlock':
            return 'ストーリー';
        case 'special':
            return '特別';
        case 'character_ticket':
            return '招待';
        default:
            return type || 'アイテム';
    }
};

export const getInventoryItemQuantity = (inventory, itemId) => {
    const entry = (Array.isArray(inventory) ? inventory : []).find((item) => item?.itemId === itemId);
    return Math.max(0, Number(entry?.quantity) || 0);
};

export const addToInventory = (inventory, itemOrId, quantity = 1) => {
    const safeInventory = Array.isArray(inventory) ? [...inventory] : [];
    const item = typeof itemOrId === 'string' ? getItemById(itemOrId) : itemOrId;

    if (!item || quantity <= 0) {
        return safeInventory;
    }

    const existingIndex = safeInventory.findIndex((entry) => entry.itemId === item.id);
    if (existingIndex >= 0 && isStackableItem(item)) {
        safeInventory[existingIndex] = {
            ...safeInventory[existingIndex],
            quantity: (Number(safeInventory[existingIndex]?.quantity) || 0) + quantity,
        };
        return safeInventory;
    }

    safeInventory.push({
        itemId: item.id,
        name: item.name,
        type: item.type,
        rarity: item.rarity,
        emoji: item.emoji,
        description: item.description,
        quantity,
    });

    return safeInventory;
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
