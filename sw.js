/* Service Worker: App-Dateien offline verfügbar halten, Daten immer live laden. */
const CACHE = "infinero-vertrieb-v5";
const SHELL = ["./", "index.html", "styles.css", "app.js", "store.js", "config.js", "vendor/supabase.js", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // Netzwerk zuerst (immer neueste Version), bei Funkloch aus dem Cache
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
});

// Push-Benachrichtigungen (Abschlüsse, Zahlungen, Termine)
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: "INFINERO Vertrieb", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "INFINERO Vertrieb", {
    body: d.body || "", icon: "icons/icon-192.png", badge: "icons/icon-192.png", data: { url: d.url || "./" }, tag: d.tag,
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const ziel = new URL(e.notification.data && e.notification.data.url || "./", self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    for (const w of ws) { if ("focus" in w) { w.navigate(ziel).catch(() => {}); return w.focus(); } }
    return clients.openWindow(ziel);
  }));
});
