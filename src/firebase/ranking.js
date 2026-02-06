import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit
} from "firebase/firestore";
import { db } from "./config";

/**
 * フレンドランキングを取得（週間学習時間）
 */
export const getFriendRanking = async (friendIds) => {
    try {
        if (!friendIds || friendIds.length === 0) {
            return { success: true, ranking: [] };
        }

        const ranking = [];

        // 各フレンドの統計情報を取得
        for (const friendId of friendIds) {
            const userDoc = await getDocs(
                query(collection(db, "users", friendId, "stats"), limit(1))
            );

            if (!userDoc.empty) {
                const statsData = userDoc.docs[0].data();

                // ユーザー情報を取得
                const userQuery = query(
                    collection(db, "users"),
                    where("__name__", "==", friendId)
                );
                const userSnapshot = await getDocs(userQuery);

                if (!userSnapshot.empty) {
                    const userData = userSnapshot.docs[0].data();
                    ranking.push({
                        uid: friendId,
                        displayName: userData.displayName || "Unknown",
                        photoURL: userData.photoURL,
                        totalStudyTime: statsData.totalStudyTime || 0,
                        level: statsData.level || 1
                    });
                }
            }
        }

        // 学習時間でソート
        ranking.sort((a, b) => b.totalStudyTime - a.totalStudyTime);

        return { success: true, ranking };
    } catch (error) {
        console.error("Get friend ranking error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * グローバルランキングを取得（上位50人）
 */
export const getGlobalRanking = async (limitCount = 50) => {
    try {
        const ranking = [];

        // 全ユーザーの統計情報を取得
        const usersSnapshot = await getDocs(collection(db, "users"));

        for (const userDoc of usersSnapshot.docs) {
            const uid = userDoc.id;
            const userData = userDoc.data();

            // 統計情報を取得
            const statsQuery = query(
                collection(db, "users", uid, "stats"),
                limit(1)
            );
            const statsSnapshot = await getDocs(statsQuery);

            if (!statsSnapshot.empty) {
                const statsData = statsSnapshot.docs[0].data();
                ranking.push({
                    uid: uid,
                    displayName: userData.displayName || "Unknown",
                    photoURL: userData.photoURL,
                    totalStudyTime: statsData.totalStudyTime || 0,
                    level: statsData.level || 1
                });
            }
        }

        // 学習時間でソートして上位を取得
        ranking.sort((a, b) => b.totalStudyTime - a.totalStudyTime);
        const topRanking = ranking.slice(0, limitCount);

        return { success: true, ranking: topRanking };
    } catch (error) {
        console.error("Get global ranking error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * 自分のランキング順位を取得
 */
export const getMyRank = async (uid, isGlobal = false, friendIds = []) => {
    try {
        let ranking;

        if (isGlobal) {
            const result = await getGlobalRanking(1000); // 上位1000人で検索
            if (!result.success) return result;
            ranking = result.ranking;
        } else {
            const result = await getFriendRanking(friendIds);
            if (!result.success) return result;
            ranking = result.ranking;
        }

        const myRankIndex = ranking.findIndex(user => user.uid === uid);

        return {
            success: true,
            rank: myRankIndex >= 0 ? myRankIndex + 1 : null,
            total: ranking.length
        };
    } catch (error) {
        console.error("Get my rank error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * 学習時間を分から時間表示に変換
 */
export const formatStudyTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
        return `${mins}分`;
    } else if (mins === 0) {
        return `${hours}時間`;
    } else {
        return `${hours}時間${mins}分`;
    }
};
