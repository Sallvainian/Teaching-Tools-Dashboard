import { goto as svelteGoto, pushState, replaceState } from '$app/navigation';

/**
 * Navigation utility functions that use SvelteKit's navigation imports
 * to avoid conflicts with SvelteKit's router.
 */

/**
 * Navigate to a new URL using SvelteKit's goto function
 * @param url The URL to navigate to
 * @param options Navigation options
 */
export function goto(
	url: string,
	options?: { replaceState?: boolean; noScroll?: boolean; keepFocus?: boolean }
) {
	return svelteGoto(url, options);
}

/**
 * Update the current URL without triggering navigation using SvelteKit's pushState
 * @param url The new URL
 * @param data State data to associate with the history entry
 * @param title The title of the new history entry
 */
export function updateUrl(url: string, data?: any, title?: string) {
	pushState(data || {}, title || '', url);
}

/**
 * Replace the current URL without triggering navigation using SvelteKit's replaceState
 * @param url The new URL
 * @param data State data to associate with the history entry
 * @param title The title of the new history entry
 */
export function replaceUrl(url: string, data?: any, title?: string) {
	replaceState(data || {}, title || '', url);
}
