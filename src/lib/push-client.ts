'use client';

import { getMessaging, getToken, isSupported, onMessage, type MessagePayload } from 'firebase/messaging';
import { app, firebaseConfig } from '@/firebase/client';
import { registerPushTokenAction } from '@/app/actions/push-actions';
import { currentIdToken } from '@/lib/auth-token';
import { enableNativePush, isNativeApp, listenNativePush, nativePushPermission, refreshNativePush } from '@/lib/push-native';

/** Clé publique « Web Push » (Firebase Console → Cloud Messaging). Sans elle, la fonction est désactivée. */
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export type PushAvailability =
    /** Fonction non configurée (clé VAPID absente) ou navigateur incompatible. */
    | 'unsupported'
    /** iPhone/iPad dans Safari : il faut d'abord ajouter l'app à l'écran d'accueil. */
    | 'ios-needs-install'
    | 'default'
    | 'granted'
    | 'denied';

function isIos(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isInstalledApp(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches
        || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export async function getPushAvailability(): Promise<PushAvailability> {
    if (typeof window === 'undefined') return 'unsupported';
    // App native (Capacitor) : push natif, sans service worker ni clé VAPID.
    if (isNativeApp()) return nativePushPermission().catch(() => 'unsupported' as const);
    if (!VAPID_KEY || !app) return 'unsupported';
    // Sur iOS, le push web n'existe que pour l'app installée (iOS 16.4+).
    if (isIos() && !isInstalledApp()) return 'ios-needs-install';
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';
    if (!(await isSupported().catch(() => false))) return 'unsupported';
    return Notification.permission;
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    const params = new URLSearchParams({
        apiKey: String(firebaseConfig.apiKey ?? ''),
        projectId: String(firebaseConfig.projectId ?? ''),
        messagingSenderId: String(firebaseConfig.messagingSenderId ?? ''),
        appId: String(firebaseConfig.appId ?? ''),
    });
    return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params}`, {
        scope: '/firebase-cloud-messaging-push-scope',
    });
}

/**
 * Récupère le jeton de l'appareil et l'enregistre pour l'utilisateur
 * connecté. Suppose la permission déjà accordée.
 */
async function syncToken(): Promise<boolean> {
    if (!app || !VAPID_KEY) return false;
    const registration = await registerServiceWorker();
    const token = await getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    if (!token) return false;
    const result = await registerPushTokenAction(await currentIdToken(), token);
    return result.success;
}

/** Demande l'autorisation (à appeler sur un geste de l'utilisateur) puis inscrit l'appareil. */
export async function enablePushNotifications(): Promise<PushAvailability> {
    if (isNativeApp()) return enableNativePush();
    const availability = await getPushAvailability();
    if (availability !== 'default' && availability !== 'granted') return availability;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') await syncToken();
    return permission;
}

/**
 * Réinscrit l'appareil si la permission est déjà accordée (le jeton peut
 * changer, ou l'utilisateur connecté a changé). Silencieux en cas d'échec.
 */
export async function refreshPushRegistration(): Promise<void> {
    if (isNativeApp()) return refreshNativePush();
    if ((await getPushAvailability()) !== 'granted') return;
    await syncToken().catch((error) => console.error('Inscription aux notifications impossible:', error));
}

/** Notifications reçues pendant que l'app est ouverte au premier plan. */
export function onForegroundPush(callback: (data: Record<string, string>) => void): () => void {
    if (isNativeApp()) return listenNativePush(callback);
    if (!app || !VAPID_KEY) return () => {};
    let unsubscribe = () => {};
    let cancelled = false;
    isSupported().then((supported) => {
        if (!supported || cancelled || !app) return;
        unsubscribe = onMessage(getMessaging(app), (payload: MessagePayload) => callback(payload.data ?? {}));
    }).catch(() => {});
    return () => {
        cancelled = true;
        unsubscribe();
    };
}
