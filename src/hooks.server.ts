// Server hooks for SvelteKit
import type { Handle } from '@sveltejs/kit';

/**
 * Handle function to intercept and process requests
 */
export const handle: Handle = async ({ event, resolve }) => {
	// Prevent 404 errors for Chrome DevTools requests
	if (event.url.pathname.startsWith('/.well-known/appspecific')) {
		return new Response('OK'); // Return 200 OK to stop the 404 spam
	}

	// Continue with normal request processing
	return resolve(event);
};
