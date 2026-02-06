/**
 * TP（トレーニングポイント）自動回復ユーティリティ
 */

// TP回復設定
const TP_RECOVERY_RATE = 1; // 回復するTP量
const TP_RECOVERY_INTERVAL_MS = 5 * 60 * 1000; // 5分（ミリ秒）

/**
 * 最終更新時刻からの経過時間に基づいてTP回復量を計算
 * @param {Object} stats - 現在の統計情報
 * @returns {Object} { recoveredTp: number, newTp: number, newUpdateTime: number }
 */
export const calculateTpRecovery = (stats) => {
    const currentTime = Date.now();
    const lastUpdateTime = stats.lastTpUpdateTime || currentTime;
    const currentTp = stats.tp || 0;
    const maxTp = stats.maxTp || 100;

    // 経過時間（ミリ秒）
    const elapsedTime = currentTime - lastUpdateTime;

    // 回復するTP量を計算
    const intervalsElapsed = Math.floor(elapsedTime / TP_RECOVERY_INTERVAL_MS);
    const recoveredTp = intervalsElapsed * TP_RECOVERY_RATE;

    // 新しいTP値（最大値を超えないように）
    const newTp = Math.min(currentTp + recoveredTp, maxTp);

    // 実際に回復した分だけ時刻を更新
    const actualRecoveredIntervals = Math.floor((newTp - currentTp) / TP_RECOVERY_RATE);
    const newUpdateTime = lastUpdateTime + (actualRecoveredIntervals * TP_RECOVERY_INTERVAL_MS);

    return {
        recoveredTp: newTp - currentTp,
        newTp,
        newUpdateTime: recoveredTp > 0 ? newUpdateTime : lastUpdateTime
    };
};

/**
 * TPを回復して新しいstatsを返す
 * @param {Object} stats - 現在の統計情報
 * @returns {Object} 更新されたstatsオブジェクト、または回復が不要な場合はnull
 */
export const updateTpWithRecovery = (stats) => {
    const recovery = calculateTpRecovery(stats);

    // 回復がある場合のみ更新を返す
    if (recovery.recoveredTp > 0) {
        return {
            tp: recovery.newTp,
            lastTpUpdateTime: recovery.newUpdateTime
        };
    }

    return null;
};

/**
 * 次のTP回復までの残り時間を取得（ミリ秒）
 * @param {Object} stats - 現在の統計情報
 * @returns {number} 次の回復までの残り時間（ミリ秒）
 */
export const getTimeUntilNextRecovery = (stats) => {
    const currentTime = Date.now();
    const lastUpdateTime = stats.lastTpUpdateTime || currentTime;
    const elapsedTime = currentTime - lastUpdateTime;
    const timeUntilNext = TP_RECOVERY_INTERVAL_MS - (elapsedTime % TP_RECOVERY_INTERVAL_MS);

    return timeUntilNext;
};

/**
 * TP回復の設定値をエクスポート（UI表示などで使用）
 */
export const TP_RECOVERY_CONFIG = {
    rate: TP_RECOVERY_RATE,
    intervalMs: TP_RECOVERY_INTERVAL_MS,
    intervalMinutes: TP_RECOVERY_INTERVAL_MS / (60 * 1000)
};
