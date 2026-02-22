import tailwindcss from "@tailwindcss/vite"; 

export default defineNuxtConfig({
  app: {
    head: {
      title: 'Campus Digital FP',
      titleTemplate: 'Intranet',
    }
  },
  modules: [
    'nuxt-auth-utils',
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
    "@nuxtjs/color-mode",
    "@vee-validate/nuxt",
    "@nuxtjs/fontaine",
    "nuxt-vitalizer",
    "nuxt-security",
    "@nuxt/eslint",
    "@vueuse/nuxt",
    "shadcn-nuxt",
    "@nuxt/image",
    "@nuxt/fonts",
    // "@nuxtjs/seo", // Temporalmente deshabilitado - causa error useHead
    "@nuxt/icon",
    "nuxt-svgo",
    '@vueuse/nuxt',
    '@nuxt/content',
  ],

  fonts: {
    providers: {
      fontsource: false, // Desactiva Fontsource
      google: false      // Desactiva Google Fonts
    }
  },

  shadcn: {
    prefix: '',
    componentDir: '@/components/ui'
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
    storageKey: 'campus-color-mode',
  },

  css: [
    "~/assets/css/tailwind.css",
    '@fontsource/inter/400.css',
    '@fontsource/inter/600.css',
  ],

  compatibilityDate: "2025-11-03",

  vite: {
     plugins: [tailwindcss()],
  },
  
  devtools: { enabled: true },
  
  icon: {
    componentName: 'Icon',
    provider: 'server',
  },
  // 1. Desactivar CSP en desarrollo
  security: {
    headers: {
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,        // ← desactiva CSP completo
    },
  },
  nitro: {
    externals: {
      external: ['@prisma/client', '.prisma/client']
    },
    publicAssets: [
      {
        dir: 'uploads',
        baseURL: '/uploads',
        maxAge: 60 * 60 * 24 * 365 // 1 año de caché
      }
    ]
  }, 
})