// Minimal service worker: enables PWA installability and receives web push.
// Deliberately does NOT cache app assets (no fetch handler) — avoids stale
// hashed-build-output bugs against Next's Turbopack output. Not offline-first.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "LifeFlow", body: "You have a new notification." };
  try {
    if (event.data) data = event.data.json();
  } catch {
    // non-JSON payload — fall back to the default above
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? "LifeFlow", {
      body: data.body,
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow("/dashboard");
    })
  );
});
