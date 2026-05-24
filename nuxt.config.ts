// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiOrigin: '',
      features: {
        publicRegister: false
      }
    },
    redis: {
      host: '',
      port: 6379,
      password: undefined
    },
    session: {
      cookieName: 'NUXT_SESSION_ID',
      maxAge: '7d',
      domain: ''
    }
  },

  compatibilityDate: '2024-07-11',

  eslint: {
    config: {
      standalone: false
    }
  }
})
