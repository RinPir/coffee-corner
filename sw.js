/* ==========================================================================
   sw.js: the service worker. It keeps a copy of the app on the device so it
   works with no internet at all.

   The saved copy opens instantly, and when there is internet a fresher copy
   is fetched quietly in the background. So after you change something and
   upload it, open the app, close it, and open it again to see the change.

   If you ever add a new file to the project, add it to this list too.
   ========================================================================== */

const CACHE_NAME = "coffee-corner";

const FILES = [
  "./",
  "index.html",
  "manifest.json",
  "css/theme.css",
  "css/screens.css",
  "css/edit.css",
  "js/defaults.js",
  "js/storage.js",
  "js/ambient.js",
  "js/screens.js",
  "js/edit.js",
  "js/app.js",
  "fonts/instrument-sans-latin-400.woff2",
  "fonts/instrument-sans-latin-500.woff2",
  "fonts/instrument-sans-latin-ext-400.woff2",
  "fonts/instrument-sans-latin-ext-500.woff2",
  "fonts/architects-daughter-latin-400.woff2",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES.map((file) => new Request(file, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) return;

  // Fetch a fresh copy in the background and keep it for next time
  const fresh = fetch(request, { cache: "no-cache" }).then(async (response) => {
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  });

  event.waitUntil(fresh.catch(() => {}));
  event.respondWith((async () => {
    const saved = await caches.match(request, { ignoreSearch: true })
      || (request.mode === "navigate" ? await caches.match("index.html") : undefined);
    return saved || fresh;
  })());
});
