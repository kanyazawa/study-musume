import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseEnv = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const requiredEnvVars = [
    ["VITE_FIREBASE_API_KEY", firebaseEnv.apiKey],
    ["VITE_FIREBASE_PROJECT_ID", firebaseEnv.projectId],
    ["VITE_FIREBASE_STORAGE_BUCKET", firebaseEnv.storageBucket],
    ["VITE_FIREBASE_MESSAGING_SENDER_ID", firebaseEnv.messagingSenderId],
    ["VITE_FIREBASE_APP_ID", firebaseEnv.appId]
];

for (const [key, value] of requiredEnvVars) {
    if (!value) {
        throw new Error(`Missing Firebase environment variable: ${key}`);
    }
}

const runtimeHost = typeof window !== "undefined" ? window.location.host : "";
const configuredAuthDomain = firebaseEnv.authDomain;
const authDomain =
    import.meta.env.PROD && runtimeHost && !/^(localhost|127\.0\.0\.1)/i.test(runtimeHost)
        ? runtimeHost
        : configuredAuthDomain;

if (!authDomain) {
    throw new Error("Missing Firebase auth domain configuration");
}

const firebaseConfig = {
    apiKey: firebaseEnv.apiKey,
    authDomain,
    projectId: firebaseEnv.projectId,
    storageBucket: firebaseEnv.storageBucket,
    messagingSenderId: firebaseEnv.messagingSenderId,
    appId: firebaseEnv.appId
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
