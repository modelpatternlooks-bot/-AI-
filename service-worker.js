const CACHE_NAME = 'ai-assistant-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
];

// Install: cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});

// Fetch: serve from cache, fall back to network, and update cache (Stale-While-Revalidate)
self.addEventListener('fetch', (event) => {
  // Don't cache Gemini API requests
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
    // Just fetch from network
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Check for valid response to cache
          if (networkResponse && networkResponse.status === 200) {
            // Only cache GET requests.
            if (event.request.method === 'GET') {
               cache.put(event.request, networkResponse.clone());
            }
          }
          return networkResponse;
        });

        // Return cached response immediately if available, and update cache in background.
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If there's a window for this app open, focus it.
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
            break;
          }
        }
        return client.focus();
      }
      // Otherwise, open a new window.
      return clients.openWindow('/');
    })
  );
});
