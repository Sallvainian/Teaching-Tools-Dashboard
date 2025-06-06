/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE_NAME = 'teacher-dashboard-v1';
const urlsToCache = ['/', '/static/js/bundle.js', '/static/css/main.css'];

// Install event - cache resources
sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
	);
});

// Activate event - clean up old caches
sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((names) =>
			Promise.all(
				names.map((name) => {
					if (name !== CACHE_NAME) {
						return caches.delete(name);
					}
				})
			)
		)
	);
});

// Fetch event - serve from cache or network
sw.addEventListener('fetch', (event) => {
	// Only handle GET requests
	if (event.request.method !== 'GET') return;

	event.respondWith(
		caches.match(event.request).then((response) => {
			return response || fetch(event.request);
		})
	);
});