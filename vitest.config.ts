import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    name: 'Campus Digital FP - Workflow Tests',
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**', '.nuxt/**', '.output/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './tests/coverage',
      exclude: [
        'node_modules/**',
        '.nuxt/**',
        '.output/**',
        'tests/**',
        '*.config.ts',
        'prisma/seed/**'
      ]
    },
    // Configuración de pool para tests con mocks de Prisma
    singleThread: true,
    testTimeout: 30000,
    hookTimeout: 30000
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './'),
      '@/': path.resolve(__dirname, './'),
      '~~': path.resolve(__dirname, './'),
      '@@': path.resolve(__dirname, './')
    }
  }
})
