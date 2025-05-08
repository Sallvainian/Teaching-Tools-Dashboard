import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import type { Config } from '@sveltejs/kit';

const config: Config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess({
		postcss: true
	}),

	kit: {
		// Using the auto adapter which should work with Vercel
		adapter: adapter()
	}
};

export default config;