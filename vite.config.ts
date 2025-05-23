import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [sveltekit()],
    
    css: {
      // Let Vite auto-discover the PostCSS config
    },
    optimizeDeps: {
      exclude: ['@ag-grid-community/core', '@ag-grid-community/client-side-row-model']
    },
    define: {
      // Make specific environment variables available to client code
      'import.meta.env.PUBLIC_SUPABASE_URL': JSON.stringify(env.PUBLIC_SUPABASE_URL || ''),
      'import.meta.env.PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.PUBLIC_SUPABASE_ANON_KEY || ''),
    }
  };
});