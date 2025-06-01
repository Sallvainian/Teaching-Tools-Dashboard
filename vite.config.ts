import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
// import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(({ mode }) => {
	// Load environment variables based on mode
	const env = loadEnv(mode, process.cwd(), '');
	const isProduction = mode === 'production';

	return {
		plugins: [
			sveltekit()
			// Sentry plugin temporarily disabled to test dev server hang
		],

		build: {
			sourcemap: !isProduction,
			minify: false,
			chunkSizeWarningLimit: 1000,
			rollupOptions: {
				output: {
					sourcemapExcludeSources: isProduction
					// Disable manual chunking to prevent build issues
				}
			}
		},

		css: {
			devSourcemap: !isProduction
		},

		server: {
			fs: {
				strict: false
			}
		},

		optimizeDeps: {
			include: ['esm-env', 'svelte', 'svelte/store', '@supabase/supabase-js'],
			exclude: ['@sveltejs/kit']
		},

		define: {
			'import.meta.env.PUBLIC_SUPABASE_URL': JSON.stringify(env.PUBLIC_SUPABASE_URL || ''),
			'import.meta.env.PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.PUBLIC_SUPABASE_ANON_KEY || '')
		}
	};
});
