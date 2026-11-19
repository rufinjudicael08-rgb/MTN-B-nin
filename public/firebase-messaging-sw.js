/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/13.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/13.4.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDcL0sewVOOShuL5LEGrBYLQsWtbK4V4d4',
  authDomain: 'gen-lang-client-0936596663.firebaseapp.com',
  projectId: 'gen-lang-client-0936596663',
  storageBucket: 'gen-lang-client-0936596663.firebasestorage.app',
  messagingSenderId: '565129554990',
  appId: '1:565129554990:web:0362d63dcc78fc4cd783bf',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title =
    (payload && payload.notification && payload.notification.title) ||
    (payload && payload.data && payload.data.title) ||
    'Nouvelle alerte MTN MoMo Bénin';
  const body =
    (payload && payload.notification && payload.notification.body) ||
    (payload && payload.data && payload.data.body) ||
    'Une annonce correspond à vos critères de liquidité.';

  self.registration.showNotification(title, {
    body,
    icon: '/pwa-192x192.png',
    badge: '/icon.svg',
    tag: (payload && payload.data && payload.data.listingId) || 'mtn-momo-alert',
    data: {
      url: (payload && payload.data && payload.data.url) || '/',
    },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return undefined;
    }),
  );
});
