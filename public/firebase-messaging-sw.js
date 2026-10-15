/* Service worker des notifications push Yakro Fê (Firebase Cloud Messaging).
 *
 * Reçoit les notifications quand l'app est fermée ou en arrière-plan et les
 * affiche. La configuration Firebase (publique) est transmise dans l'URL
 * d'enregistrement : ce fichier statique ne lit pas les variables d'env.
 * La version doit correspondre au paquet `firebase` du projet.
 */
importScripts('https://www.gstatic.com/firebasejs/12.12.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.12.1/firebase-messaging-compat.js');

const params = new URL(self.location.href).searchParams;
const config = {
    apiKey: params.get('apiKey'),
    projectId: params.get('projectId'),
    messagingSenderId: params.get('messagingSenderId'),
    appId: params.get('appId'),
};

if (config.apiKey && config.projectId && config.messagingSenderId && config.appId) {
    firebase.initializeApp(config);
    const messaging = firebase.messaging();

    // Les messages sont envoyés en « data » seule : on construit nous-mêmes
    // la notification, pour un rendu identique sur tous les navigateurs.
    messaging.onBackgroundMessage((payload) => {
        const data = payload.data || {};
        return self.registration.showNotification(data.title || 'Yakro Fê', {
            body: data.body || '',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            tag: data.tag || undefined,
            renotify: !!data.tag,
            data: { link: data.link || '/' },
        });
    });
}

// Toucher la notification : ramène l'app au premier plan sur la bonne page.
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = new URL(event.notification.data?.link || '/', self.location.origin).href;
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
            for (const client of windows) {
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    client.navigate(target);
                    return client.focus();
                }
            }
            return self.clients.openWindow(target);
        }),
    );
});
