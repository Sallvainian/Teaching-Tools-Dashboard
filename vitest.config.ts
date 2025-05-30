import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./vitest.setup.ts'],
		include: ['src/**/*.{test,spec}.{js,ts}'],
		coverage: {
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'src/app.html',
				'**/*.d.ts',
				'**/*.config.*',
				'**/.svelte-kit/**',
				'coverage/**'
			]
		}
	},
	resolve: {
		alias: {
			$lib: '/src/lib',
			$app: '/src/app'
		}
	}
});
