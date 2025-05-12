import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts,svelte}'],
    setupFiles: ['./vitest-setup-client.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov', 'cobertura'],
      reportsDirectory: './.qodana/code-coverage',
      include: ['src/**/*.{js,ts,svelte}'],
      exclude: [
        'src/**/*.{test,spec}.{js,ts,svelte}',
        'src/**/*.d.ts',
        'src/**/__mocks__/**',
      ],
    },
  },
});