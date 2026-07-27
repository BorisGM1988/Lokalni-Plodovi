// Service Worker za LokalniPlodovi push notifikacije

self.addEventListener('push', function (event) {
  let data = { title: 'LokalniPlodovi', body: 'Imate novo obaveštenje', url: '/' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {}

  const options = {
    body: data.body,
    icon: 'https://lokalniplodovi.rs/og-slika.jpg',
    badge: 'https://lokalniplodovi.rs/og-slika.jpg',
    data: { url: data.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url
    ? 'https://lokalniplodovi.rs' + event.notification.data.url
    : 'https://lokalniplodovi.rs';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
