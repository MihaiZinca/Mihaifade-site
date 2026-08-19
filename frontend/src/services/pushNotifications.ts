import {
    getToken,
    onMessage,
    type MessagePayload,
} from "firebase/messaging";
import { getFirebaseMessaging } from "./firebase";

export async function registerFirebaseServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        return null;
    }

    return navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
    );
}

export async function requestPushNotificationToken() {
    if (!("Notification" in window)) {
        return null;
    }

    const permission =
        await Notification.requestPermission();

    if (permission !== "granted") {
        return null;
    }

    const messaging = await getFirebaseMessaging();

    if (!messaging) {
        return null;
    }

    const serviceWorkerRegistration =
        await registerFirebaseServiceWorker();

    if (!serviceWorkerRegistration) {
        return null;
    }

    const vapidKey =
        import.meta.env.VITE_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
        throw new Error(
            "VITE_FIREBASE_VAPID_KEY lipsește din .env."
        );
    }

    const token = await getToken(
        messaging,
        {
            vapidKey,
            serviceWorkerRegistration,
        }
    );

    return token || null;
}

export async function listenForForegroundNotifications(
    callback: (payload: MessagePayload) => void
) {
    const messaging = await getFirebaseMessaging();

    if (!messaging) {
        return () => {};
    }

    return onMessage(
        messaging,
        callback
    );
}