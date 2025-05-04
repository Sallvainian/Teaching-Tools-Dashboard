// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/color-mode', '@pinia/nuxt', 'nuxt-headlessui'],

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    exposeConfig: true,
    viewer: true
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },

  devtools: {
    enabled: true,

    timeline: {
      enabled: true
    }
  },
  typescript: { strict: true, typeCheck: false },
  postcss: {
    plugins: { 'tailwindcss/nesting': {}, tailwindcss: {}, autoprefixer: {} }
  },
  nitro: { 
    compatibilityDate: '2025-05-04' 
  }
})