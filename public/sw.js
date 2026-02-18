// GHM Marketing Dashboard — Push Notification Service Worker
// Handles incoming push events and notification clicks

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "GHM", body: event.data.text() };
  }

  const title = payload.title ?? "GHM Marketing";
  const options = {
    body: payload.body ?? "",
    icon: payload.icon ?? "/logo.png",
    badge: payload.badge ?? "/logo.png",
    tag: payload.tag ?? "ghm-notification",
    data: { url: payload.url ?? "/" },
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If a window is already open, focus it and navigate
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
