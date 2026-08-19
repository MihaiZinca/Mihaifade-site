import {
    getToken,
    onMessage,
    type MessagePayload,
} from "firebase/messaging";
import { getFirebaseMessaging } from "./firebase";

export async function registerFirebaseServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        console.error(
            "[PUSH] Service Worker nu este suportat."
        );

        return null;
    }

    try {
        const registration =
            await navigator.serviceWorker.register(
                "/firebase-messaging-sw.js"
            );

        console.log(
            "[PUSH] Service Worker înregistrat:",
            registration
        );

        await navigator.serviceWorker.ready;

        console.log(
            "[PUSH] Service Worker este READY."
        );

        return registration;
    } catch (error) {
        console.error(
            "[PUSH] Eroare Service Worker:",
            error
        );

        throw error;
    }
}

export async function requestPushNotificationToken() {
    console.log(
        "[PUSH] Pornim activarea notificărilor."
    );

    if (!("Notification" in window)) {
        console.error(
            "[PUSH] Notification API nu este suportat."
        );

        return null;
    }

    console.log(
        "[PUSH] Permisiune înainte:",
        Notification.permission
    );

    let permission: NotificationPermission;

    try {
        permission =
            await Notification.requestPermission();
    } catch (error) {
        console.error(
            "[PUSH] Eroare la cererea permisiunii:",
            error
        );

        throw error;
    }

    console.log(
        "[PUSH] Permisiune după:",
        permission
    );

    if (permission !== "granted") {
        console.error(
            "[PUSH] Permisiunea nu este granted:",
            permission
        );

        return null;
    }

    console.log(
        "[PUSH] Obținem Firebase Messaging..."
    );

    const messaging =
        await getFirebaseMessaging();

    if (!messaging) {
        console.error(
            "[PUSH] Firebase Messaging nu este suportat."
        );

        return null;
    }

    console.log(
        "[PUSH] Firebase Messaging OK."
    );

    const serviceWorkerRegistration =
        await registerFirebaseServiceWorker();

    if (!serviceWorkerRegistration) {
        console.error(
            "[PUSH] Nu avem ServiceWorkerRegistration."
        );

        return null;
    }

    const vapidKey =
        import.meta.env.VITE_FIREBASE_VAPID_KEY;

    console.log(
        "[PUSH] VAPID există:",
        Boolean(vapidKey)
    );

    if (!vapidKey) {
        throw new Error(
            "VITE_FIREBASE_VAPID_KEY lipsește din .env."
        );
    }

    try {
        console.log(
            "[PUSH] Cerem tokenul FCM..."
        );

        const token =
            await getToken(
                messaging,
                {
                    vapidKey,
                    serviceWorkerRegistration,
                }
            );

        if (!token) {
            console.error(
                "[PUSH] Firebase a returnat token gol."
            );

            return null;
        }

        console.log(
            "[PUSH] Token FCM primit cu succes."
        );

        return token;
    } catch (error) {
        console.error(
            "[PUSH] EROARE getToken Firebase:",
            error
        );

        throw error;
    }
}

export async function listenForForegroundNotifications(
    callback: (payload: MessagePayload) => void
) {
    const messaging =
        await getFirebaseMessaging();

    if (!messaging) {
        return () => {};
    }

    return onMessage(
        messaging,
        callback
    );
}