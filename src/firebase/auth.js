import {
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
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
 * ユーザードキュメントを作成または更新
 */
const ensureUserDocument = async (user) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        // 新規ユーザー: フレンドコードを生成してプロフィール作成
        const friendCode = generateFriendCode();
        await setDoc(userDocRef, {
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
        await updateDoc(userDocRef, {
            lastLoginAt: serverTimestamp()
        });
    }
};

/**
 * モバイルデバイスかどうかを判定
 */
const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

/**
 * Googleでサインイン
 * モバイル: signInWithRedirect を使用
 * PC: signInWithPopup を試行し、ブロックされた場合は signInWithRedirect にフォールバック
 */
export const signInWithGoogle = async () => {
    try {
        // モバイルブラウザではリダイレクト方式を使用
        if (isMobileDevice()) {
            console.log("Mobile device detected, using redirect sign-in...");
            await signInWithRedirect(auth, googleProvider);
            // リダイレクト後はページがリロードされるため、ここには戻らない
            return { success: true, redirect: true };
        }

        // PCブラウザではポップアップを試行
        let result;
        try {
            result = await signInWithPopup(auth, googleProvider);
        } catch (popupError) {
            // ポップアップがブロックされた場合、リダイレクト方式にフォールバック
            if (popupError.code === 'auth/popup-blocked' ||
                popupError.code === 'auth/popup-closed-by-user' ||
                popupError.code === 'auth/cancelled-popup-request') {
                console.log("Popup blocked, falling back to redirect...");
                await signInWithRedirect(auth, googleProvider);
                return { success: true, redirect: true };
            }
            throw popupError;
        }

        const user = result.user;
        await ensureUserDocument(user);

        return { success: true, user };
    } catch (error) {
        console.error("Sign in error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * リダイレクトログインの結果を処理
 * アプリ起動時に呼び出す
 */
export const handleRedirectResult = async () => {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            const user = result.user;
            await ensureUserDocument(user);
            return { success: true, user };
        }
        return { success: false, noResult: true };
    } catch (error) {
        console.error("Redirect result error:", error);
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
