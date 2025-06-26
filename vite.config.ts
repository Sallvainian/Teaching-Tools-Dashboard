import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
// import { imagetools } from 'vite-imagetools'; // Temporarily disabled
import Icons from 'unplugin-icons/vite';
import compression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ command, mode }) => {
	const dev = command === 'serve';
	
	return {
	plugins: [

		// Icon Management - Access thousands of icons as components
		Icons({
			compiler: 'svelte',
			autoInstall: true,
			scale: 1.2,
			defaultStyle: 'vertical-align: middle;'
		}),

		// Development Quality Tools - Run checks in worker threads
		// DISABLED: MCP tools spawning multiple processes
		// checker({
		// 	typescript: true,
		// 	eslint: {
		// 		lintCommand: 'eslint "./src/**/*.{ts,svelte}" --max-warnings 0'
		// 	},
		// 	overlay: {
		// 		initialIsOpen: false,
		// 		position: 'tl'
		// 	}
		// }),

		sveltekit(),

		// Asset Compression - Gzip/Brotli for better loading times
		compression({
			algorithm: 'gzip',
			ext: '.gz'
		}),
		compression({
			algorithm: 'brotliCompress',
			ext: '.br'
		}),

		// Bundle Analysis - Visualize bundle sizes
		visualizer({
			filename: 'dist/stats.html',
			open: false,
			gzipSize: true,
			brotliSize: true
		})
	],

	define: {
		global: {},
		__BUILD_TIME__: JSON.stringify(new Date().toISOString())
	},

	server: {
		port: 5173,
		// Cross-platform development support
		// This configuration works for both:
		// 1. Windows/macOS/Linux native development
		// 2. Windows Subsystem for Linux (WSL) development
		host: '0.0.0.0', // Listen on all network interfaces
		hmr: {
			port: 5173,
			clientPort: 5173 // Auto-detect correct host for HMR
		},
		// Optimized file watching
		watch: {
			usePolling: false, // Better performance than polling
			ignored: ['**/node_modules/**', '**/.git/**']
		},
		// Enable CORS for API development
		cors: true,
		fs: {
			strict: false // Allow importing from outside the project root
		}
	},

	optimizeDeps: {
		// Include dependencies that benefit from pre-bundling
		include: [
			'date-fns',
			'uuid',
			'zod'
		]
	},

	build: {
		sourcemap: true,
		target: 'esnext',
		// Build optimizations
		rollupOptions: {
			// Netlify adapter handles chunk splitting automatically
		},
		// Build optimizations for production
		chunkSizeWarningLimit: 1000,
		reportCompressedSize: false
	},

	// CSS Processing optimizations
	css: {
		devSourcemap: dev
	},

	// Test configuration for Vitest
	test: {
		environment: 'jsdom',
		setupFiles: ['./vitest.setup.ts'],
		coverage: {
			reporter: ['text', 'html', 'json'],
			exclude: [
				'node_modules/',
				'src/app.html',
				'**/*.d.ts',
				'**/*.config.*'
			]
		}
	}
	};
});
