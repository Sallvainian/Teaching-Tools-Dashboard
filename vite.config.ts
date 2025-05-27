import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
// import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(({ mode }) => {
	// Load environment variables based on mode
	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [
			sveltekit()
			// Sentry plugin temporarily disabled to test dev server hang
		],

		build: {
			sourcemap: true,
			rollupOptions: {
				output: {
					sourcemapExcludeSources: false
				}
			}
		},

		css: {
			devSourcemap: true
		},

		optimizeDeps: {
			include: ['esm-env']
		},

		define: {
			'import.meta.env.PUBLIC_SUPABASE_URL': JSON.stringify(env.PUBLIC_SUPABASE_URL || ''),
			'import.meta.env.PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.PUBLIC_SUPABASE_ANON_KEY || '')
		}
	};
});
