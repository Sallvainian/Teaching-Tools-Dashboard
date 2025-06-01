import { ensureAuthInitialized } from '$lib/utils/authInit';
import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
import { injectAnalytics } from '@vercel/analytics/sveltekit';
import { dev } from '$app/environment';
import type { LayoutLoad } from './$types';

// Set prerender to false to allow auth state to be determined at runtime
export const prerender = false;
export const ssr = false;

// Initialize Vercel Speed Insights and Analytics (only in production)
if (!dev) {
	injectSpeedInsights();
	injectAnalytics();
}

// Ensure auth is initialized before rendering any pages
export const load: LayoutLoad = async () => {
	// Initialize auth as early as possible
	await ensureAuthInitialized();

	return {};
};
