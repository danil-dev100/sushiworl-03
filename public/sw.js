/**
 * Service Worker para PWA
 * - Cache de assets estáticos
 * - Detecção de instalação do app
 * - Tracking de eventos
 */

const CACHE_NAME = 'sushiworld-v2';
const STATIC_ASSETS = [
  '/',
  '/cardapio',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// Estratégia de cache: Network First, fallback para Cache
self.addEventListener('fetch', (event) => {
  // Ignorar requisições non-GET
  if (event.request.method !== 'GET') return;

  // Ignorar requisições de API
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonar response para cache
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Se falhar, tentar buscar do cache
        return caches.match(event.request).then((response) => {
          return response || new Response('Offline');
        });
      })
  );
});

// Detectar instalação do PWA
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'APP_INSTALLED') {
    console.log('[SW] App installed, tracking event...');

    // Enviar evento de instalação para API
    const urlParams = new URLSearchParams(event.data.url);

    fetch('/api/pwa/track-install', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        utmSource: urlParams.get('utm_source'),
        utmMedium: urlParams.get('utm_medium'),
        utmCampaign: urlParams.get('utm_campaign'),
        eventType: 'APP_INSTALLED',
        isConverted: true,
      }),
    })
      .then(() => console.log('[SW] Install event tracked'))
      .catch((err) => console.error('[SW] Failed to track install:', err));
  }
});
