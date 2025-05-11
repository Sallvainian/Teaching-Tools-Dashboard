import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import vercel from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: vercel({
			runtime: 'nodejs20.x',
			split: false
		}),
		prerender: {
			handleHttpError: ({ status, path, referrer, message }) => {
				// Ignore 404 errors during prerendering
				if (status === 404) return;
				throw new Error(`${message} (status: ${status}, path: ${path}${referrer ? ` - referrer: ${referrer}` : ''})`);
			}
		}
	}
};

export default config;