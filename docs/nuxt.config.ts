// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Nuxt 4 - Estructura de carpetas moderna
  future: {
    compatibilityVersion: 4,
  },
  
  // Directorio fuente (estructura Nuxt 4)
  srcDir: 'app/',
  
  // Directorio del build
  buildDir: '.nuxt',
  
  // Módulos
  modules: [
    '@nuxt/content',
    '@nuxt/ui'
  ],
  
  // Configuración de la app
  app: {
    head: {
      titleTemplate: '%s - Campus Digital FP',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Documentación de la Intranet Campus Digital FP' }
      ]
    }
  },
  
  // Configuración de Content v3
  content: {
    preview: {
      api: 'https://api.nuxt.studio'
    },
    highlight: {
      theme: {
        default: 'github-light',
        dark: 'github-dark'
      }
    },
    navigation: {
      fields: ['icon', 'title', 'description']
    }
  },
  
  // CSS global
  css: ['~/assets/css/main.css'],
  
  // Configuración de UI
  ui: {
    colors: {
      primary: 'amber',
      neutral: 'slate'
    }
  },
  
  // Configuración de TypeScript
  typescript: {
    strict: true
  },
  
  // Configuración de desarrollo
  devtools: { enabled: true },
  
  // Compatibilidad
  compatibilityDate: '2026-03-10'
})
