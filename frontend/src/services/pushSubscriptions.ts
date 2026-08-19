import api from "./api";
import {
    requestPushNotificationToken,
} from "./pushNotifications";

const PUSH_TOKEN_STORAGE_KEY =
    "mihaifade_push_token";

export async function enablePushNotifications() {
    const token =
        await requestPushNotificationToken();

    if (!token) {
        return {
            success: false,
            reason: "permission-denied" as const,
        };
    }

    await api.post(
        "/push-subscriptions/me",
        {
            token,
            userAgent: navigator.userAgent,
        }
    );

    localStorage.setItem(
        PUSH_TOKEN_STORAGE_KEY,
        token
    );

    return {
        success: true,
        token,
    };
}

export async function disablePushNotifications() {
    const token =
        localStorage.getItem(
            PUSH_TOKEN_STORAGE_KEY
        );

    if (!token) {
        return;
    }

    await api.delete(
        "/push-subscriptions/me",
        {
            data: {
                token,
                userAgent: navigator.userAgent,
            },
        }
    );

    localStorage.removeItem(
        PUSH_TOKEN_STORAGE_KEY
    );
}

export async function disablePushNotificationsOnAllDevices() {
    await api.delete(
        "/push-subscriptions/me/all"
    );

    localStorage.removeItem(
        PUSH_TOKEN_STORAGE_KEY
    );
}

export function getStoredPushToken() {
    return localStorage.getItem(
        PUSH_TOKEN_STORAGE_KEY
    );
}

export function arePushNotificationsEnabled() {
    return Boolean(
        getStoredPushToken()
    );
}