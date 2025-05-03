// ~/nuxt.config.ts
// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  // Ensure these modules are listed
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    '@nuxt/ui' // Handles Tailwind integration
  ],

  // Ensure this line correctly points to your Tailwind CSS file
  css: [
    '~/assets/css/tailwind.css'
  ],

  // Your other configurations remain...
  colorMode: {
    classSuffix: ''
  },
  devtools: {
    enabled: true
  },
  routeRules: {
    '/': { prerender: true },
    '/dashboard': { prerender: true },
  },
  compatibilityDate: '2025-05-03',
});
