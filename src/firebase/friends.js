import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    arrayUnion,
    arrayRemove,
    serverTimestamp
} from "firebase/firestore";
import { db } from "./config";

/**
 * フレンドコードでユーザーを検索
 */
export const searchUserByFriendCode = async (friendCode) => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("friendCode", "==", friendCode.toUpperCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, error: "ユーザーが見つかりません" };
        }

        const userData = querySnapshot.docs[0].data();
        return { success: true, user: userData };
    } catch (error) {
        console.error("Search user error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * フレンド申請を送信
 */
export const sendFriendRequest = async (fromUserId, toUserId) => {
    try {
        // 自分自身には送れない
        if (fromUserId === toUserId) {
            return { success: false, error: "自分自身にフレンド申請はできません" };
        }

        // 既存の申請をチェック
        const friendshipId = [fromUserId, toUserId].sort().join("_");
        const friendshipDoc = await getDoc(doc(db, "friendships", friendshipId));

        if (friendshipDoc.exists()) {
            const data = friendshipDoc.data();
            if (data.status === "accepted") {
                return { success: false, error: "すでにフレンドです" };
            } else {
                return { success: false, error: "既にフレンド申請済みです" };
            }
        }

        // フレンド申請を作成
        await setDoc(doc(db, "friendships", friendshipId), {
            users: [fromUserId, toUserId],
            requester: fromUserId,
            status: "pending",
            createdAt: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error("Send friend request error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * フレンド申請を承認
 */
export const acceptFriendRequest = async (friendshipId) => {
    try {
        await updateDoc(doc(db, "friendships", friendshipId), {
            status: "accepted",
            acceptedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Accept friend request error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * フレンド申請を拒否
 */
export const rejectFriendRequest = async (friendshipId) => {
    try {
        await updateDoc(doc(db, "friendships", friendshipId), {
            status: "rejected",
            rejectedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Reject friend request error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * フレンドリストを取得
 */
export const getFriendsList = async (userId) => {
    try {
        const friendshipsRef = collection(db, "friendships");
        const q = query(
            friendshipsRef,
            where("users", "array-contains", userId),
            where("status", "==", "accepted")
        );

        const querySnapshot = await getDocs(q);
        const friends = [];

        for (const docSnapshot of querySnapshot.docs) {
            const data = docSnapshot.data();
            // 相手のユーザーIDを取得
            const friendId = data.users.find(id => id !== userId);

            // 相手のユーザー情報を取得
            const friendDoc = await getDoc(doc(db, "users", friendId));
            if (friendDoc.exists()) {
                friends.push({
                    id: friendId,
                    ...friendDoc.data(),
                    friendshipId: docSnapshot.id
                });
            }
        }

        return { success: true, friends };
    } catch (error) {
        console.error("Get friends list error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * 受信したフレンド申請を取得
 */
export const getPendingRequests = async (userId) => {
    try {
        const friendshipsRef = collection(db, "friendships");
        const q = query(
            friendshipsRef,
            where("users", "array-contains", userId),
            where("status", "==", "pending")
        );

        const querySnapshot = await getDocs(q);
        const requests = [];

        for (const docSnapshot of querySnapshot.docs) {
            const data = docSnapshot.data();
            // 自分が受信者の場合のみ
            if (data.requester !== userId) {
                const requesterId = data.requester;

                // 申請者の情報を取得
                const requesterDoc = await getDoc(doc(db, "users", requesterId));
                if (requesterDoc.exists()) {
                    requests.push({
                        id: requesterId,
                        ...requesterDoc.data(),
                        friendshipId: docSnapshot.id
                    });
                }
            }
        }

        return { success: true, requests };
    } catch (error) {
        console.error("Get pending requests error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * フレンドを削除
 */
export const removeFriend = async (friendshipId) => {
    try {
        await updateDoc(doc(db, "friendships", friendshipId), {
            status: "removed",
            removedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Remove friend error:", error);
        return { success: false, error: error.message };
    }
};
