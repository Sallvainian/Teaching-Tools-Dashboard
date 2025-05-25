import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      sveltekit(),
      // Add Sentry plugin for production builds
      mode === 'production' && sentryVitePlugin({
        org: "frank-cottone", // Replace with your Sentry org name
        project: "main", // Replace with your Sentry project name
        authToken: env.SENTRY_AUTH_TOKEN, // Add this to your .env
        telemetry: false,
        release: {
          name: process.env.SENTRY_RELEASE || `main@${process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || Date.now()}`,
          cleanArtifacts: true,
          uploadLegacySourcemaps: {
            paths: ['./build'],
            ignore: ['node_modules'],
          },
          setCommits: {
            auto: true,
            ignoreMissing: true,
          },
        },
        sourcemaps: {
          assets: './build/**',
          ignore: ['node_modules'],
          filesToDeleteAfterUpload: './build/**/*.map',
        },
      })
    ].filter(Boolean),
    
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
    
    // optimizeDeps: {
    //   exclude: ['@ag-grid-community/core', '@ag-grid-community/client-side-row-model']
    // },
    
    define: {
      'import.meta.env.PUBLIC_SUPABASE_URL': JSON.stringify(env.PUBLIC_SUPABASE_URL || ''),
      'import.meta.env.PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.PUBLIC_SUPABASE_ANON_KEY || ''),
    }
  };
});