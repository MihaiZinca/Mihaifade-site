import { initializeApp } from "firebase/app";
import {
    getMessaging,
    isSupported,
    type Messaging,
} from "firebase/messaging";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId:
        import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firebaseApp = initializeApp(firebaseConfig);

let messagingInstance: Messaging | null = null;

export async function getFirebaseMessaging() {
    const supported = await isSupported();

    if (!supported) {
        return null;
    }

    if (!messagingInstance) {
        messagingInstance = getMessaging(firebaseApp);
    }

    return messagingInstance;
}