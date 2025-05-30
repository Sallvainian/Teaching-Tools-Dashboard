const CACHE_NAME = 'teacher-dashboard-v1';
const urlsToCache = ['/', '/static/js/bundle.js', '/static/css/main.css'];

self.addEventListener('install', (event: any) => {
	event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});

self.addEventListener('activate', (event: any) => {
	event.waitUntil(
		caches
			.keys()
			.then((names) => Promise.all(names.map((name) => name !== CACHE_NAME && caches.delete(name))))
	);
});

self.addEventListener('fetch', (event: any) => {
	if (event.request.method !== 'GET') return;

	event.respondWith(
		(async () => {
			const url = new URL(event.request.url);
			const cache = await caches.open(CACHE_NAME);

			if (url.pathname.startsWith('/api')) {
				try {
					return await fetch(event.request);
				} catch {
					return new Response('{}', {
						status: 503,
						headers: { 'Content-Type': 'application/json' }
					});
				}
			}

			try {
				const response = await fetch(event.request);
				if (response.status === 200) cache.put(event.request, response.clone());
				return response;
			} catch {
				const cachedResponse = await cache.match(event.request);
				if (cachedResponse) return cachedResponse;
				if (event.request.mode === 'navigate') return cache.match('/');
				return new Response('Network error', { status: 503 });
			}
		})()
	);
});
