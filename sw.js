/* ==========================================================================
   sw.js: the service worker. It keeps a copy of the app on the device so it
   works with no internet at all.

   With internet, the app opens the newest version straight away. With no
   internet or a very slow connection, it opens the saved copy instead.

   If you ever add a new file to the project, add it to this list too.
   ========================================================================== */

const CACHE_NAME = "coffee-corner";

// How long to wait for the internet (ms) before using the saved copy
const NETWORK_WAIT = 2000;

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

  // Fetch a fresh copy and keep it for when there is no internet
  const fresh = fetch(request, { cache: "no-cache" }).then(async (response) => {
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  });

  event.waitUntil(fresh.catch(() => {}));
  event.respondWith((async () => {
    try {
      const tooSlow = new Promise((resolve) => setTimeout(resolve, NETWORK_WAIT, null));
      const response = await Promise.race([fresh, tooSlow]);
      if (response && response.ok) return response;
    } catch (error) {
      // no internet: use the saved copy below
    }
    const saved = await caches.match(request, { ignoreSearch: true })
      || (request.mode === "navigate" ? await caches.match("index.html") : undefined);
    return saved || fresh;
  })());
});
