import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseDefaults = {
    apiKey: "AIzaSyDZYfUIcr9r6U3jL_zn85NgQuNdLAyW7tI",
    authDomain: "study-musume.firebaseapp.com",
    projectId: "study-musume",
    storageBucket: "study-musume.firebasestorage.app",
    messagingSenderId: "430986247519",
    appId: "1:430986247519:web:9573b08a07e66af46ecaea"
};

const firebaseEnv = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseDefaults.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseDefaults.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseDefaults.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseDefaults.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseDefaults.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseDefaults.appId
};

const requiredEnvVars = [
    ["VITE_FIREBASE_API_KEY", firebaseEnv.apiKey],
    ["VITE_FIREBASE_PROJECT_ID", firebaseEnv.projectId],
    ["VITE_FIREBASE_STORAGE_BUCKET", firebaseEnv.storageBucket],
    ["VITE_FIREBASE_MESSAGING_SENDER_ID", firebaseEnv.messagingSenderId],
    ["VITE_FIREBASE_APP_ID", firebaseEnv.appId]
];

export const isFirebaseConfigured = requiredEnvVars.every(([, value]) => Boolean(value));

const configuredAuthDomain = firebaseEnv.authDomain;
// ローカルホスト以外では、現在のドメインを authDomain に設定して
// netlify.toml のリバースプロキシ (/__/auth/*) を経由させる。
// これにより iOS PWA などのサードパーティクッキー制限 (ITP) を回避する。
const authDomain = (typeof window !== 'undefined' && 
                    !window.location.hostname.includes('localhost') && 
                    !window.location.hostname.includes('127.0.0.1'))
    ? window.location.hostname
    : configuredAuthDomain;

if (!isFirebaseConfigured) {
    const missingKeys = requiredEnvVars
        .filter(([, value]) => !value)
        .map(([key]) => key);
    console.warn("Firebase is disabled because required environment variables are missing:", missingKeys);
}

let app = null;
let auth = null;
let db = null;
let storage = null;
let googleProvider = null;

if (isFirebaseConfigured && authDomain) {
    const firebaseConfig = {
        apiKey: firebaseEnv.apiKey,
        authDomain,
        projectId: firebaseEnv.projectId,
        storageBucket: firebaseEnv.storageBucket,
        messagingSenderId: firebaseEnv.messagingSenderId,
        appId: firebaseEnv.appId
    };

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
} else if (firebaseEnv.authDomain) {
    console.warn("Firebase auth domain is configured, but Firebase startup was skipped because other env vars are missing.");
}

export { app, auth, db, storage, googleProvider };

export default app;
