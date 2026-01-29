// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4,
  },

  modules: [
    '@nuxt/ui',
    '@nuxthub/core',
    'nuxt-auth-utils',
    '@nuxt/content',
    'nuxt-studio',
    '@vite-pwa/nuxt',
  ],

  studio: {
    repository: {
      provider: 'github',
      owner: 'Diix46',
      repo: 'DogWalk',
      branch: 'main',
    },
  },

  // NuxtHub configuration for D1 database (v0.10+)
   hub: {
    db: {
      dialect: 'sqlite',
      driver: 'd1',
      connection: {
        databaseId: 'c39c296b-4866-4c0f-a3e7-ff7fb545ef88'  // <-- Remplace par ton ID D1
      }
    }
  },

  runtimeConfig: {
    weatherApiKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    public: {
      stripePublicKey: '',
      appUrl: '',
    },
  },

  css: ['~/assets/css/main.css'],

  // Cloudflare Pages deployment
  nitro: {
    preset: 'cloudflare-pages',
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'DogWalk',
      short_name: 'DogWalk',
      description: 'Trouve les meilleures balades pour ton chien',
      theme_color: '#2563eb',
      background_color: '#fafafa',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/pwa-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
        { src: '/pwa-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
      ],
    },
    workbox: {
      navigateFallback: undefined,
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
    },
  },

  // NuxtUI theme configuration
  ui: {
    theme: {
      colors: ['primary', 'secondary', 'error', 'warning', 'success', 'info'],
    },
  },
})