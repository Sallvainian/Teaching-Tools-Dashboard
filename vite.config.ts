import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';
import { sentrySvelteKit } from '@sentry/sveltekit';

export default defineConfig(({ mode }) => {
	// Load environment variables based on mode
	const env = loadEnv(mode, process.cwd(), '');
	const isProduction = mode === 'production';

	// Define plugins array
	// Using any to avoid type issues with sveltekit() return type
	const plugins: any[] = [
		// sentrySvelteKit({
		// 	sourceMapsUploadOptions: {
		// 		org: env.SENTRY_ORG_NAME,
		// 		project: env.SENTRY_PROJECT_NAME,
		// 		authToken: env.SENTRY_AUTH_TOKEN,
		// 	}
		// }),
		sveltekit()
	];

	// Add bundle analyzer in analyze mode
	if (process.env.ANALYZE === 'true') {
		plugins.push(
			visualizer({
				open: true,
				filename: 'bundle-analysis.html',
				gzipSize: true,
				brotliSize: true
			}) as Plugin
		);
	}

	// Add compression plugin in production
	if (isProduction) {
		plugins.push(
			compression({
				algorithm: 'brotliCompress' as const,
				filter: (file) => !file.match(/\.(br)$/) && !file.match(/\.(gz)$/) && !file.match(/\.(png|jpe?g|gif|webp|avif)$/i),
				threshold: 1024
			}) as Plugin,
			compression({
				algorithm: 'gzip' as const,
				filter: (file) => !file.match(/\.(br)$/) && !file.match(/\.(gz)$/) && !file.match(/\.(png|jpe?g|gif|webp|avif)$/i),
				threshold: 1024
			}) as Plugin
		);
	}

	return {
		plugins,

		build: {
			sourcemap: !isProduction,
			// Enable minification in production for better optimization
			minify: isProduction ? 'terser' : false,
			// Reduce warning limit to catch large chunks
			chunkSizeWarningLimit: 800,
			terserOptions: isProduction
				? {
						compress: {
							drop_console: true,
							drop_debugger: true,
							pure_funcs: ['console.log', 'console.debug', 'console.trace']
						},
						format: {
							comments: false
						},
						mangle: {
							properties: {
								regex: /^_/
							}
						}
				  }
				: undefined,
			rollupOptions: {
				output: {
					sourcemapExcludeSources: isProduction,
					// Enable manual chunking for better code splitting
					manualChunks: isProduction
						? {
								'vendor-svelte': ['svelte', 'svelte/store', 'svelte/transition', 'svelte/animate']
						  }
						: undefined,
					// Optimize chunk naming
					chunkFileNames: isProduction
						? 'chunks/[name]-[hash].js'
						: 'chunks/[name].js',
					// Optimize asset naming
					assetFileNames: isProduction
						? 'assets/[name]-[hash][extname]'
						: 'assets/[name][extname]'
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
			include: [
				'esm-env', 
				'svelte', 
				'svelte/store', 
				'@supabase/supabase-js', 
				'idb', 
				'zod',
				'@sentry/sveltekit',
				'lucide-svelte',
				'handsontable',
				'uuid',
				'cookie',
				'@fontsource/inter'
			],
			exclude: ['@sveltejs/kit']
		},

		define: {
			'import.meta.env.PUBLIC_SUPABASE_URL': JSON.stringify(env.PUBLIC_SUPABASE_URL || ''),
			'import.meta.env.PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.PUBLIC_SUPABASE_ANON_KEY || '')
		},

		// Improve module preloading
	modulePreload: {
		polyfill: true,
		resolveDependencies: (filename: string, deps: string[], { hostId, hostType }: { hostId: string; hostType: string }) => {
			// Customize which dependencies to preload
			return deps.filter(dep => !dep.includes('node_modules/@sveltejs/kit'));
		}
		}
	};
});
