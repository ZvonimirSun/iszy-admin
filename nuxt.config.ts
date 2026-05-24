// https://nuxt.com/docs/api/configuration/nuxt-config

const extensions = [
  '.js',
  '.jsx',
  '.mjs',
  '.ts',
  '.tsx',
  '.vue',
]
const pagePattern = [
  `**/*{${extensions.join(',')}}`,
  '!**/children/**',
  '!**/_*/**',
  '!**/_*',
]

export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  devtools: {
    enabled: true,
  },

  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      url: 'http://localhost:3000',
      title: '后台管理',
      description: '后台管理',
      logo: '',
      image: '',
      apiOrigin: '',
      favicon: {
        small: '',
        medium: '',
        appleTouchIcon: '',
        safariPinnedTab: '',
        androidManifest: '',
      },
      features: {
        publicRegister: false,
      },
    },
    redis: {
      host: '',
      port: 6379,
      password: undefined,
    },
    session: {
      cookieName: 'NUXT_SESSION_ID',
      maxAge: '7d',
      domain: '',
    },
  },

  compatibilityDate: '2024-07-11',

  eslint: {
    config: {
      standalone: false,
    },
  },
  pages: {
    pattern: pagePattern,
  },
  vite: {
    worker: {
      format: 'es',
    },
    optimizeDeps: {
      include: [
        'reka-ui',
      ],
    },
  },
})
