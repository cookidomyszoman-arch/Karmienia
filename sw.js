/* Antek – mniam mniam (PWA)
   Service Worker for GitHub Pages (/Karmienia/)
*/
const CACHE = "antek-cache-v20260301-1";
const CORE = [
  "/Karmienia/",
  "/Karmienia/index.html",
  "/Karmienia/manifest.webmanifest",
  "/Karmienia/icon-192.png",
  "/Karmienia/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
  })());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith((async () => {
    const url = new URL(req.url);

    // Prefer network for navigation, fallback to cache.
    if (req.mode === "navigate") {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put("/Karmienia/index.html", fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(CACHE);
        return (await cache.match("/Karmienia/index.html")) || (await cache.match("/Karmienia/"));
      }
    }

    // Cache-first for same-origin assets
    if (url.origin === self.location.origin && url.pathname.startsWith("/Karmienia/")) {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        return cached || Response.error();
      }
    }

    // Default: network
    return fetch(req);
  })());
});
