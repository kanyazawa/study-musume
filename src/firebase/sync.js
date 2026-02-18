import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    addDoc,
    serverTimestamp
} from "firebase/firestore";
import { db } from "./config";
import {
    loadStats,
    saveStats,
    collectAllSaveData,
    restoreAllSaveData
} from "../utils/saveUtils";

/**
 * ============================================
 * 全セーブデータの一括同期
 * Firestore Doc: users/{uid}/saveData/current
 * ============================================
 */

/**
 * 全localStorageデータをFirestoreにアップロード
 * @param {string} uid - Firebase UID
 */
export const uploadAllSaveData = async (uid) => {
    try {
        const allData = collectAllSaveData();
        const ref = doc(db, "users", uid, "saveData", "current");
        await setDoc(ref, {
            ...allData,
            updatedAt: serverTimestamp()
        }, { merge: false }); // 完全上書き
        console.log('[CloudSync] Upload完了');
        return { success: true };
    } catch (error) {
        console.error('[CloudSync] Upload失敗:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Firestoreから全セーブデータをダウンロード
 * @param {string} uid - Firebase UID
 * @returns {{ success: boolean, data?: Object, savedAt?: number }}
 */
export const downloadAllSaveData = async (uid) => {
    try {
        const ref = doc(db, "users", uid, "saveData", "current");
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const data = snap.data();
            return {
                success: true,
                data,
                savedAt: data._savedAt || 0
            };
        }
        return { success: false, error: 'No cloud save found' };
    } catch (error) {
        console.error('[CloudSync] Download失敗:', error);
        return { success: false, error: error.message };
    }
};

/**
 * ログイン時の同期処理（一括同期版）
 * - クラウドとローカルの _savedAt を比較して新しい方を採用
 * - 初回ログイン時はローカルデータをアップロード
 */
export const syncOnLogin = async (uid) => {
    try {
        const localData = collectAllSaveData();
        const localSavedAt = localData._savedAt || 0;

        const cloudResult = await downloadAllSaveData(uid);

        if (cloudResult.success && cloudResult.data) {
            const cloudSavedAt = cloudResult.savedAt || 0;

            if (cloudSavedAt > localSavedAt) {
                // クラウドの方が新しい → ローカルを上書き
                console.log('[CloudSync] クラウドデータが新しいため復元します');
                restoreAllSaveData(cloudResult.data);
                return {
                    success: true,
                    source: 'cloud',
                    data: loadStats() // 復元後のstatsを返す
                };
            } else {
                // ローカルの方が新しい → クラウドを更新
                console.log('[CloudSync] ローカルデータが新しいためアップロードします');
                await uploadAllSaveData(uid);
                return {
                    success: true,
                    source: 'local',
                    data: loadStats()
                };
            }
        } else {
            // クラウドにデータなし → ローカルデータをアップロード
            console.log('[CloudSync] 初回同期: ローカルデータをアップロードします');
            await uploadAllSaveData(uid);
            return {
                success: true,
                source: 'local',
                data: loadStats()
            };
        }
    } catch (error) {
        console.error('[CloudSync] ログイン同期エラー:', error);
        return { success: false, error: error.message };
    }
};

/**
 * ユーザーの統計情報をFirestoreに同期（ランキング用・既存互換）
 */
export const syncUserStats = async (uid, localStats) => {
    try {
        const userStatsRef = doc(db, "users", uid, "stats", "current");

        const syncData = {
            totalStudyTime: localStats.totalStudyTime || 0,
            totalSessions: localStats.totalSessions || 0,
            level: localStats.level || 1,
            affection: localStats.affection || 0,
            diamonds: localStats.diamonds || 0,
            updatedAt: serverTimestamp()
        };

        await setDoc(userStatsRef, syncData, { merge: true });
        return { success: true };
    } catch (error) {
        console.error("Sync user stats error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Firestoreからユーザーの統計情報を取得
 */
export const fetchUserStats = async (uid) => {
    try {
        const userStatsRef = doc(db, "users", uid, "stats", "current");
        const docSnap = await getDoc(userStatsRef);

        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        }
        return { success: false, error: "Stats not found" };
    } catch (error) {
        console.error("Fetch user stats error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * 学習ログを記録
 */
export const logStudySession = async (uid, sessionData) => {
    try {
        const { subject, duration, date } = sessionData;

        // 学習ログをサブコレクションに追加
        const logsRef = collection(db, "users", uid, "studyLogs");
        await addDoc(logsRef, {
            subject: subject || "その他",
            duration: duration || 0,
            date: date || new Date().toISOString().split('T')[0],
            timestamp: serverTimestamp()
        });

        // ユーザーの総学習時間を更新
        const userStatsRef = doc(db, "users", uid, "stats", "current");
        const statsDoc = await getDoc(userStatsRef);

        const currentTotal = statsDoc.exists() ? (statsDoc.data().totalStudyTime || 0) : 0;
        const currentSessions = statsDoc.exists() ? (statsDoc.data().totalSessions || 0) : 0;

        await setDoc(userStatsRef, {
            totalStudyTime: currentTotal + duration,
            totalSessions: currentSessions + 1,
            updatedAt: serverTimestamp()
        }, { merge: true });

        return { success: true };
    } catch (error) {
        console.error("Log study session error:", error);
        return { success: false, error: error.message };
    }
};



/**
 * 学習完了時の処理（localStorageとFirestoreの両方に保存）
 */
export const saveStudyCompletion = async (uid, sessionData, updatedStats) => {
    try {
        // localStorageに保存
        saveStats(updatedStats);

        // ログインしている場合のみFirestoreに保存
        if (uid) {
            await logStudySession(uid, sessionData);
            await syncUserStats(uid, updatedStats);
        }

        return { success: true };
    } catch (error) {
        console.error("Save study completion error:", error);
        return { success: false, error: error.message };
    }
};
