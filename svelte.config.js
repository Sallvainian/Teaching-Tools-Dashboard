import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import netlify from '@sveltejs/adapter-netlify';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: netlify({
			edge: false, // Use Node.js runtime instead of Edge for better compatibility
			split: false // Disable function splitting to avoid ESM issues
		}),
		alias: {
			$components: 'src/lib/components',
			$stores: 'src/lib/stores',
			$services: 'src/lib/services',
			$utils: 'src/lib/utils',
			$types: 'src/lib/types'
		},
		serviceWorker: {
			register: false
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
		immutable: true, // Enable immutable compilation for better performance
		dev: process.env.NODE_ENV !== 'production'
	}
};

export default config;
