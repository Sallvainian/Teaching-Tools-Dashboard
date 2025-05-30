// Service Worker for Teacher Dashboard
// Implements caching strategy for offline functionality

const CACHE_NAME = 'teacher-dashboard-v1';
const urlsToCache = ['/', '/static/js/bundle.js', '/static/css/main.css'];

// Install event - cache initial resources
self.addEventListener('install', (event: any) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE_NAME);
		return cache.addAll(urlsToCache);
	}

	event.waitUntil(addFilesToCache());
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: any) => {
	async function deleteOldCaches() {
		const names = await caches.keys();
		await Promise.all(names.map((name) => name !== CACHE_NAME && caches.delete(name)));
	}

	event.waitUntil(deleteOldCaches());
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event: any) => {
	// ignore POST requests etc
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE_NAME);

		// Always serve from network for API calls
		if (url.pathname.startsWith('/api')) {
			try {
				const response = await fetch(event.request);
				return response;
			} catch (err) {
				// Fallback for offline API calls could be implemented here
				return new Response('{}', {
					status: 503,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}

		// For app shell, try network first, then cache
		try {
			const response = await fetch(event.request);

			if (response.status === 200) {
				cache.put(event.request, response.clone());
			}

			return response;
		} catch (err) {
			const response = await cache.match(event.request);

			if (response) {
				return response;
			}

			// Return offline page for navigation requests
			if (event.request.mode === 'navigate') {
				return cache.match('/');
			}

			return new Response('Network error', { status: 503 });
		}
	}

	event.respondWith(respond());
});
