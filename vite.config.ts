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
					sourcemapExcludeSources: isProduction,
					manualChunks: (id) => {
						// Vendor chunking for better caching
						if (id.includes('node_modules')) {
							if (id.includes('svelte')) return 'svelte-vendor';
							if (id.includes('@supabase')) return 'supabase-vendor';
							if (id.includes('handsontable')) return 'handsontable-vendor';
							if (id.includes('lucide-svelte')) return 'icons-vendor';
							if (id.includes('@sentry')) return 'sentry-vendor';
							return 'vendor';
						}
						// Feature-based chunking
						if (id.includes('src/routes/auth')) return 'auth';
						if (id.includes('src/routes/dashboard')) return 'dashboard';
						if (id.includes('src/routes/jeopardy')) return 'jeopardy';
						if (id.includes('src/routes/gradebook')) return 'gradebook';
						if (id.includes('src/lib/components')) return 'components';
						if (id.includes('src/lib/stores')) return 'stores';
					}
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
