import { ensureAuthInitialized } from '$lib/utils/authInit';
import type { LayoutLoad } from './$types';

// Set prerender to false to allow auth state to be determined at runtime
export const prerender = false;
export const ssr = false;

// Ensure auth is initialized before rendering any pages
export const load: LayoutLoad = async () => {
	// Initialize auth as early as possible
	await ensureAuthInitialized();

	// Preload store data to prevent refresh issues when navigating
	try {
		// Import stores dynamically to ensure they're loaded after auth
		const [
			{ gradebookStore },
			{ filesStore },
			{ jeopardyStore }
		] = await Promise.all([
			import('$lib/stores/gradebook'),
			import('$lib/stores/files'),
			import('$lib/stores/jeopardy')
		]);

		// Initialize stores in parallel
		await Promise.all([
			gradebookStore.ensureDataLoaded().catch(() => {}), // Gracefully handle errors
			filesStore.ensureDataLoaded().catch(() => {}),
			jeopardyStore.ensureDataLoaded().catch(() => {})
		]);
	} catch (error) {
		// Gracefully handle any preloading errors
		console.warn('Some stores failed to preload:', error);
	}

	return {};
};
