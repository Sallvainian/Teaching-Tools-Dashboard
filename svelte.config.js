import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	// Remove runes setting - let Svelte auto-detect
	kit: {
		adapter: adapter({
			// Disable precompression since Railway handles it
			precompress: false
		}),
		csp: {
			mode: 'auto'
		},
		alias: {
			$components: 'src/lib/components',
			$stores: 'src/lib/stores',
			$services: 'src/lib/services',
			$utils: 'src/lib/utils',
			$types: 'src/lib/types'
		},
		prerender: {
			handleHttpError: ({ status, path, referrer, message }) => {
				// Ignore 404 errors during prerendering
				if (status === 404) return;
				const referrerText = referrer ? ` - referrer: ${referrer}` : '';
				throw new Error(`${message} (status: ${status}, path: ${path}${referrerText})`);
			}
		}
	},
	compilerOptions: {
		runes: true, // Enable Svelte 5 runes ($state, $derived, etc.)
		immutable: true, // Enable immutable compilation for better performance
		dev: process.env.NODE_ENV !== 'production'
	}
};

export default config;
