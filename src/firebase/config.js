import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDZYfUIcr9r6U3jL_zn85NgQuNdLAyW7tI",
    authDomain: "study-musume.firebaseapp.com",
    projectId: "study-musume",
    storageBucket: "study-musume.firebasestorage.app",
    messagingSenderId: "430986247519",
    appId: "1:430986247519:web:9573b08a07e66af46ecaea"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
