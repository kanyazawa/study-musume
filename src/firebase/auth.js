import {
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from "firebase/auth";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from "firebase/firestore";
import { auth, db, googleProvider } from "./config";

/**
 * Googleでサインイン
 */
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // ユーザードキュメントが存在するかチェック
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (!userDoc.exists()) {
            // 新規ユーザー: フレンドコードを生成してプロフィール作成
            const friendCode = generateFriendCode();
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                displayName: user.displayName || "トレーナー",
                email: user.email,
                photoURL: user.photoURL,
                friendCode: friendCode,
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp()
            });
        } else {
            // 既存ユーザー: 最終ログイン時刻を更新
            await updateDoc(doc(db, "users", user.uid), {
                lastLoginAt: serverTimestamp()
            });
        }

        return { success: true, user };
    } catch (error) {
        console.error("Sign in error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * サインアウト
 */
export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
        return { success: true };
    } catch (error) {
        console.error("Sign out error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * 認証状態の監視
 */
export const subscribeToAuthState = (callback) => {
    return onAuthStateChanged(auth, callback);
};

/**
 * 現在のユーザーを取得
 */
export const getCurrentUser = () => {
    return auth.currentUser;
};

/**
 * ユーザープロフィールを取得
 */
export const getUserProfile = async (uid) => {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            return { success: true, data: userDoc.data() };
        }
        return { success: false, error: "User not found" };
    } catch (error) {
        console.error("Get user profile error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * ユーザープロフィールを更新
 */
export const updateUserProfile = async (uid, data) => {
    try {
        await updateDoc(doc(db, "users", uid), data);
        return { success: true };
    } catch (error) {
        console.error("Update user profile error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * フレンドコードを生成（6文字の英数字）
 */
const generateFriendCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 紛らわしい文字を除外
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};
