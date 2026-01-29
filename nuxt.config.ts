// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4,
  },

  modules: ['@nuxt/ui', '@nuxthub/core', 'nuxt-auth-utils'],

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

  // NuxtUI theme configuration
  ui: {
    theme: {
      colors: ['primary', 'secondary', 'error', 'warning', 'success', 'info'],
    },
  },
})
