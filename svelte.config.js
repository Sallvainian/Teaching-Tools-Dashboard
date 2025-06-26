import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		paths: {
			relative: false
		},
		csp: {
			mode: 'auto',
			directives: {
				'script-src': ['self', 'unsafe-eval', 'unsafe-inline', 'https://*.supabase.co', 'https://*.supabase.io', 'https://cdn.jsdelivr.net', 'https://unpkg.com']
			}
		},
		alias: {
			$components: 'src/lib/components',
			$stores: 'src/lib/stores',
			$services: 'src/lib/services',
			$utils: 'src/lib/utils',
			$types: 'src/lib/types'
		}
	}
};

export default config;
