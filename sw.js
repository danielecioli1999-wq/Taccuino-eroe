/* Service worker: tutto in cache, l'app funziona offline.
   Cambia VERSION quando aggiorni i file, così i telefoni scaricano la nuova versione. */
const VERSION = "taccuino-v8";
const FILES = [
  "./", "index.html", "style.css", "boot.js", "manifest.webmanifest",
  "data-core.js", "data-commander.js", "data-berserker.js", "engine.js", "i18n-en.js", "i18n.js", "ui-core.js", "ui-views.js", "ui-actions.js",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png",
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match("index.html")))
  );
});
