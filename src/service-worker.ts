const CACHE_NAME = 'teacher-dashboard-v1';
const urlsToCache = ['/', '/static/js/bundle.js', '/static/css/main.css'];

self.addEventListener('install', (event: ExtendableEvent) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
	);
});

self.addEventListener('activate', (event: ExtendableEvent) => {
	event.waitUntil(
		caches.keys().then((names) =>
			Promise.all(
				names
					.filter((name) => name !== CACHE_NAME)
					.map((name) => caches.delete(name))
			)
		)
	);
});

self.addEventListener('fetch', (event: FetchEvent) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);

	if (url.pathname.startsWith('/api')) {
		event.respondWith(
			fetch(event.request).catch(() =>
				new Response('{}', {
					status: 503,
					headers: { 'Content-Type': 'application/json' }
				})
			)
		);
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cached) => {
			if (cached) return cached;
			return fetch(event.request)
				.then((response) => {
					if (response.status === 200) {
						const responseClone = response.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
					}
					return response;
				})
				.catch(() =>
					event.request.mode === 'navigate'
						? caches.match('/')
						: new Response('Network error', { status: 503 })
				);
		})
	);
});