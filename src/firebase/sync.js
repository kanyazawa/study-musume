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
import { loadStats, saveStats } from "../utils/saveUtils";

/**
 * ユーザーの統計情報をFirestoreに同期
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
 * ログイン時にlocalStorageとFirestoreを同期
 */
export const syncOnLogin = async (uid) => {
    try {
        // localStorageから現在のデータを取得
        const localStats = loadStats();

        // Firestoreからデータを取得
        const firestoreResult = await fetchUserStats(uid);

        if (firestoreResult.success) {
            // Firestoreのデータが存在する場合、新しい方を使用
            const firestoreStats = firestoreResult.data;
            const firestoreTime = firestoreStats.totalStudyTime || 0;
            const localTime = localStats.totalStudyTime || 0;

            if (firestoreTime > localTime) {
                // Firestoreの方が新しい場合、localStorageを更新
                const mergedStats = {
                    ...localStats,
                    totalStudyTime: firestoreStats.totalStudyTime,
                    totalSessions: firestoreStats.totalSessions,
                    level: firestoreStats.level,
                    affection: firestoreStats.affection,
                    diamonds: firestoreStats.diamonds
                };
                saveStats(mergedStats);
                return { success: true, data: mergedStats };
            } else {
                // localStorageの方が新しい場合、Firestoreを更新
                await syncUserStats(uid, localStats);
                return { success: true, data: localStats };
            }
        } else {
            // Firestoreにデータがない場合、localStorageのデータをアップロード
            await syncUserStats(uid, localStats);
            return { success: true, data: localStats };
        }
    } catch (error) {
        console.error("Sync on login error:", error);
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
