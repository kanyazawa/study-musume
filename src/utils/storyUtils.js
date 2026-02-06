import { STORY_EPISODES } from '../data/storyData';

/**
 * エピソードがアンロックされているかチェックする
 * @param {Object} episode - エピソードオブジェクト
 * @param {number} affectionLevel - 現在の好感度レベル
 * @returns {boolean} アンロックされているか
 */
export const isEpisodeUnlocked = (episode, affectionLevel) => {
    return affectionLevel >= episode.level;
};

/**
 * アンロック済みエピソードを取得する
 * @param {number} affectionLevel - 現在の好感度レベル
 * @returns {Array} アンロック済みエピソードの配列
 */
export const getUnlockedEpisodes = (affectionLevel) => {
    return STORY_EPISODES.filter(ep => isEpisodeUnlocked(ep, affectionLevel));
};

/**
 * ロック中のエピソードを取得する
 * @param {number} affectionLevel - 現在の好感度レベル
 * @returns {Array} ロック中エピソードの配列
 */
export const getLockedEpisodes = (affectionLevel) => {
    return STORY_EPISODES.filter(ep => !isEpisodeUnlocked(ep, affectionLevel));
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
export const getNextLockedEpisode = (affectionLevel) => {
    const lockedEpisodes = getLockedEpisodes(affectionLevel);
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
export const getUnlockedCount = (affectionLevel) => {
    return getUnlockedEpisodes(affectionLevel).length;
};
