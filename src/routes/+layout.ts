import { ensureAuthInitialized } from '$lib/utils/authInit';
import type { LayoutLoad } from './$types';

// Set prerender to false to allow auth state to be determined at runtime
export const prerender = false;
export const ssr = false;

// Ensure auth is initialized before rendering any pages
export const load: LayoutLoad = async () => {
	// Initialize auth as early as possible
	await ensureAuthInitialized();

	return {};
};
