'use client';

// Notifications push dans l'application native (Capacitor, Android/iOS).
// La WebView de l'app ne gère pas le push web : on passe par le plugin
// natif, qui fournit un jeton Firebase Cloud Messaging enregistré par la même
// action serveur que les navigateurs.
import { Capacitor } from '@capacitor/core';
import { PushNotifications, type PushNotificationSchema } from '@capacitor/push-notifications';
import { registerPushTokenAction } from '@/app/actions/push-actions';
import { currentIdToken } from '@/lib/auth-token';
import { ORDER_CHANNEL_ID } from '@/lib/push-messages';

export function isNativeApp(): boolean {
    return Capacitor.isNativePlatform();
}

export type NativePushPermission = 'default' | 'granted' | 'denied';

export async function nativePushPermission(): Promise<NativePushPermission> {
    const { receive } = await PushNotifications.checkPermissions();
    if (receive === 'granted') return 'granted';
    if (receive === 'denied') return 'denied';
    return 'default';
}

let channelReady: Promise<void> | null = null;

function ensureOrderChannel(): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') return Promise.resolve();
    channelReady ??= PushNotifications.createChannel({
        id: ORDER_CHANNEL_ID,
        name: 'Commandes',
        description: 'Nouvelles commandes, courses et suivi de livraison',
        importance: 5,
        visibility: 1,
        vibration: true,
    }).catch((error) => console.error('Création du canal de notifications impossible:', error));
    return channelReady;
}

/** Obtient le jeton FCM de l'appareil (attend l'évènement « registration »). */
function requestDeviceToken(): Promise<string> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Délai dépassé pour le jeton de notifications.')), 15_000);
        const handles = [
            PushNotifications.addListener('registration', (token) => {
                clearTimeout(timeout);
                handles.forEach((h) => h.then((handle) => handle.remove()));
                resolve(token.value);
            }),
            PushNotifications.addListener('registrationError', (error) => {
                clearTimeout(timeout);
                handles.forEach((h) => h.then((handle) => handle.remove()));
                reject(new Error(error.error));
            }),
        ];
        PushNotifications.register().catch(reject);
    });
}

async function syncNativeToken(): Promise<boolean> {
    await ensureOrderChannel();
    const token = await requestDeviceToken();
    const result = await registerPushTokenAction(await currentIdToken(), token);
    return result.success;
}

/** Demande l'autorisation puis inscrit l'appareil. */
export async function enableNativePush(): Promise<NativePushPermission> {
    let permission = await nativePushPermission();
    if (permission === 'default') {
        const { receive } = await PushNotifications.requestPermissions();
        permission = receive === 'granted' ? 'granted' : receive === 'denied' ? 'denied' : 'default';
    }
    if (permission === 'granted') await syncNativeToken();
    return permission;
}

/** Réinscrit l'appareil si l'autorisation est déjà accordée. */
export async function refreshNativePush(): Promise<void> {
    if ((await nativePushPermission()) !== 'granted') return;
    await syncNativeToken().catch((error) => console.error('Inscription aux notifications impossible:', error));
}

/**
 * Notifications reçues app ouverte, et toucher d'une notification (app en
 * arrière-plan ou fermée) : ouvre la page indiquée par le serveur.
 */
export function listenNativePush(onForeground: (data: Record<string, string>) => void): () => void {
    const handles = [
        PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
            const data = (notification.data ?? {}) as Record<string, string>;
            onForeground({ ...data, title: data.title ?? notification.title ?? '', body: data.body ?? notification.body ?? '' });
        }),
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            const link = (action.notification.data as Record<string, string> | undefined)?.link;
            // Liens internes uniquement (fournis par notre serveur).
            if (link && link.startsWith('/')) window.location.assign(link);
        }),
    ];
    return () => handles.forEach((h) => h.then((handle) => handle.remove()));
}
