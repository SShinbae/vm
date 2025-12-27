/**
 * Service Worker for Vehicle Management System
 * Provides offline support and asset caching for web platform
 *
 * Features:
 * - Cache-first strategy for static assets
 * - Network-first strategy for API calls
 * - Automatic cache versioning
 * - Background sync support
 */

const CACHE_VERSION = "v2";
const CACHE_NAME = `vm-cache-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json"];

// Runtime caching patterns
const CACHEABLE_PATTERNS = {
  static: /\/_expo\/static\//,
  images: /\.(png|jpg|jpeg|svg|gif|webp)$/,
  fonts: /\.(woff|woff2|ttf|otf)$/,
};

/**
 * Install event - cache static assets
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Force the waiting service worker to become active
        return self.skipWaiting();
      }),
  );
});

/**
 * Activate event - cleanup old caches
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      }),
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for:
  // 1. Chrome extensions
  // 2. Non-GET requests
  // 3. API calls (let them go to network)
  if (
    url.protocol === "chrome-extension:" ||
    request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase")
  ) {
    return;
  }

  // Cache-first strategy for static assets
  if (
    CACHEABLE_PATTERNS.static.test(url.pathname) ||
    CACHEABLE_PATTERNS.images.test(url.pathname) ||
    CACHEABLE_PATTERNS.fonts.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network-first strategy for HTML pages
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default: network first with cache fallback
  event.respondWith(networkFirst(request));
});

/**
 * Cache-first strategy
 * Try cache first, fall back to network
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    // Return cached response and update cache in background
    updateCacheInBackground(request, cache);
    return cached;
  }

  // Not in cache, fetch from network
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    // Return a fallback response if needed
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

/**
 * Network-first strategy
 * Try network first, fall back to cache
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    // Return offline page or error
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

/**
 * Update cache in background (stale-while-revalidate)
 */
function updateCacheInBackground(request, cache) {
  fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    })
    .catch(() => {
      // Silently fail - we already served from cache
    });
}

/**
 * Message handler for cache control
 */
self.addEventListener("message", (event) => {
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName)),
        );
      }),
    );
  }
});
