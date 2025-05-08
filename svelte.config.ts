import vercel from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import type { Config } from '@sveltejs/kit';

const config: Config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess({
		postcss: true
	}),

	kit: {
		// Using the Vercel adapter for deployment
		adapter: vercel({
			// Using Serverless (default)
			runtime: 'nodejs18.x'
		})
	}
};

export default config;