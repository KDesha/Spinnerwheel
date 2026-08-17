const CACHE = "spines-and-spins-store-v4";

const ASSETS = [
  "./",
  "./index.html",
  "./club.html",
  "./genres.html",
  "./genre.html",
  "./book.html",
  "./privacy.html",
  "./terms.html",
  "./support.html",
  "./style.css?v=store-v4",
  "./app-v2.js?v=store-v4",
  "./vendor/supabase.js",
  "./manifest.webmanifest",
  "./Portal.jpeg"
];

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  // Always try to load HTML pages from the internet first
  // so updates show immediately.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE).then(cache => {
            cache.put(event.request, copy);
          });

          return response;
        })
        .catch(() =>
          caches.match(event.request).then(
            cached => cached || caches.match("./index.html")
          )
        )
    );

    return;
  }

  // Always refresh the main CSS, JavaScript, and service worker files.
  if (
    requestUrl.pathname.endsWith("/style.css") ||
    requestUrl.pathname.endsWith("/app-v2.js") ||
    requestUrl.pathname.endsWith("/sw.js")
  ) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE).then(cache => {
            cache.put(event.request, copy);
          });

          return response;
        })
        .catch(() => caches.match(event.request))
    );

    return;
  }

  // For images and other files: use cache first, then save new files.
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (requestUrl.origin === self.location.origin) {
          const copy = response.clone();

          caches.open(CACHE).then(cache => {
            cache.put(event.request, copy);
          });
        }

        return response;
      });
    })
  );
});
