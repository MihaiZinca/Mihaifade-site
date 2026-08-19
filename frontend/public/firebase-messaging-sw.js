importScripts(
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
    apiKey: "AIzaSyBGrM0Iecx_AsLVCAVjQo3AiSt9-_DIOUo",
    authDomain: "mihaifade-95558.firebaseapp.com",
    projectId: "mihaifade-95558",
    storageBucket: "mihaifade-95558.firebasestorage.app",
    messagingSenderId: "823357513675",
    appId: "1:823357513675:web:29fa5f6d5b56ca6e7fa04e",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification;

    if (!notification) {
        return;
    }

    self.registration.showNotification(
        notification.title || "MIHAIFADE",
        {
            body: notification.body || "",
            icon: "/favicon.png",
            badge: "/favicon.png",
        }
    );
});