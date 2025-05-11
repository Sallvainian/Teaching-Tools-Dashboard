// svelte.config.js
import vercel from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: vercel({
      runtime: 'nodejs20.x',
      split: false,
    }),
    prerender: {
      handleHttpError: ({ path, referrer, message }) => {
        // Ignore 404 errors during prerendering
        if (message.includes('404')) return;
        throw new Error(`${message} (${path}${referrer ? ` - referrer: ${referrer}` : ''})`);
      }
    }
  },
};

export default config;
