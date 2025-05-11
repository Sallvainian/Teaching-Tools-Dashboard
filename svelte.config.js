// svelte.config.js
import vercel from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: vercel({
      runtime: 'nodejs20.x',
      split: false,
      // Removed 'external' as it's not a valid property
    }),
  },
};

export default config;
