import { STORY_EPISODES } from '../data/storyData';
import { getAffectionLevel } from './affectionUtils';
import { getItemById, removeFromInventory } from './itemUtils';

const hasInventoryItem = (inventory = [], itemId = '') =>
    Boolean(itemId) && inventory.some((item) => item?.itemId === itemId && Number(item?.quantity || 0) > 0);

export const getStoryEpisodeState = (stats = {}) => ({
    unlockedIds: Array.isArray(stats?.storyEpisodes?.unlockedIds)
        ? stats.storyEpisodes.unlockedIds
        : [],
    readIds: Array.isArray(stats?.storyEpisodes?.readIds)
        ? stats.storyEpisodes.readIds
        : [],
});

export const getEpisodeUnlockState = (episode, affectionLevel, inventory = [], unlockedEpisodeIds = []) => {
    const requiredItemId = episode?.requiredStoryItemId || '';
    const requiredItem = requiredItemId ? getItemById(requiredItemId) : null;
    const affectionMet = Number(affectionLevel || 0) >= Number(episode?.level || 0);
    const keyMet = !requiredItemId || hasInventoryItem(inventory, requiredItemId);
    const permanentlyUnlocked = unlockedEpisodeIds.includes(episode?.id);
    const canUnlockNow = Boolean(requiredItemId) && affectionMet && keyMet && !permanentlyUnlocked;
    const unlocked = affectionMet && (permanentlyUnlocked || !requiredItemId);

    let lockedReason = '';
    if (canUnlockNow) {
        lockedReason = `${requiredItem?.name || 'ストーリーキー'} を消費して解放できます`;
    } else if (!affectionMet && !keyMet) {
        lockedReason = `Lv.${episode.level} と ${requiredItem?.name || 'ストーリーキー'} が必要`;
    } else if (!affectionMet) {
        lockedReason = `親密度Lv.${episode.level} が必要`;
    } else if (!keyMet) {
        lockedReason = `${requiredItem?.name || 'ストーリーキー'} が必要`;
    }

    return {
        unlocked,
        affectionMet,
        keyMet,
        canUnlockNow,
        permanentlyUnlocked,
        requiredItem,
        requiredItemId,
        lockedReason,
    };
};

/**
 * エピソードがアンロックされているかチェックする
 * @param {Object} episode - エピソードオブジェクト
 * @param {number} affectionLevel - 現在の好感度レベル
 * @returns {boolean} アンロックされているか
 */
export const isEpisodeUnlocked = (episode, affectionLevel, inventory = [], unlockedEpisodeIds = []) => {
    return getEpisodeUnlockState(episode, affectionLevel, inventory, unlockedEpisodeIds).unlocked;
};

/**
 * アンロック済みエピソードを取得する
 * @param {number} affectionLevel - 現在の好感度レベル
 * @returns {Array} アンロック済みエピソードの配列
 */
export const getUnlockedEpisodes = (affectionLevel, inventory = [], unlockedEpisodeIds = []) => {
    return STORY_EPISODES.filter(ep => isEpisodeUnlocked(ep, affectionLevel, inventory, unlockedEpisodeIds));
};

/**
 * ロック中のエピソードを取得する
 * @param {number} affectionLevel - 現在の好感度レベル
 * @returns {Array} ロック中エピソードの配列
 */
export const getLockedEpisodes = (affectionLevel, inventory = [], unlockedEpisodeIds = []) => {
    return STORY_EPISODES.filter(ep => !isEpisodeUnlocked(ep, affectionLevel, inventory, unlockedEpisodeIds));
};

/**
 * エピソードIDからエピソードを取得する
 * @param {string} episodeId - エピソードID
 * @returns {Object|null} エピソードオブジェクト
 */
export const getEpisodeById = (episodeId) => {
    return STORY_EPISODES.find(ep => ep.id === episodeId) || null;
};

/**
 * 次のロックエピソードを取得する
 * @param {number} affectionLevel - 現在の好感度レベル
 * @returns {Object|null} 次のエピソード
 */
export const getNextLockedEpisode = (affectionLevel, inventory = [], unlockedEpisodeIds = []) => {
    const lockedEpisodes = getLockedEpisodes(affectionLevel, inventory, unlockedEpisodeIds);
    return lockedEpisodes.length > 0 ? lockedEpisodes[0] : null;
};

/**
 * 全エピソード数を取得する
 * @returns {number} エピソード総数
 */
export const getTotalEpisodes = () => {
    return STORY_EPISODES.length;
};

/**
 * アンロック済みエピソード数を取得する
 * @param {number} affectionLevel - 現在の好感度レベル
 * @returns {number} アンロック済みエピソード数
 */
export const getUnlockedCount = (affectionLevel, inventory = [], unlockedEpisodeIds = []) => {
    return getUnlockedEpisodes(affectionLevel, inventory, unlockedEpisodeIds).length;
};

export const getOwnedStoryKeys = (inventory = []) =>
    inventory
        .map((entry) => {
            const item = entry?.itemId ? getItemById(entry.itemId) : null;
            return item?.type === 'story_unlock'
                ? { ...entry, ...item }
                : null;
        })
        .filter(Boolean);

export const unlockEpisodeWithKey = (stats = {}, episode) => {
    if (!episode) return stats;

    const affectionLevel = getAffectionLevel(stats?.affection || 0).level;
    const inventory = stats?.inventory || [];
    const storyEpisodeState = getStoryEpisodeState(stats);
    const unlockState = getEpisodeUnlockState(
        episode,
        affectionLevel,
        inventory,
        storyEpisodeState.unlockedIds,
    );

    if (!unlockState.canUnlockNow) {
        return stats;
    }

    return {
        ...stats,
        inventory: removeFromInventory(inventory, unlockState.requiredItemId, 1),
        storyEpisodes: {
            ...storyEpisodeState,
            unlockedIds: [...new Set([...storyEpisodeState.unlockedIds, episode.id])],
        },
    };
};
