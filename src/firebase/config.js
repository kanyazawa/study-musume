import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const requiredEnvVars = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID"
];

for (const key of requiredEnvVars) {
    if (!import.meta.env[key]) {
        throw new Error(`Missing Firebase environment variable: ${key}`);
    }
}

const runtimeHost = typeof window !== 'undefined' ? window.location.host : '';
const configuredAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const authDomain =
    import.meta.env.PROD && runtimeHost && !/^(localhost|127\.0\.0\.1)/i.test(runtimeHost)
        ? runtimeHost
        : configuredAuthDomain;

if (!authDomain) {
    throw new Error('Missing Firebase auth domain configuration');
}

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
