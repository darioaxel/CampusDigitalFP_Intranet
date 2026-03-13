import type { PrismaClient } from '@prisma/client'
import { PrismaClient as PrismaClientClass } from '@prisma/client'

// Declaración global
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// Detectar si DATABASE_URL es válida (no placeholder)
const hasValidDatabaseUrl = !!process.env.DATABASE_URL && 
  !process.env.DATABASE_URL.includes('placeholder')

// Crear cliente solo si tenemos URL válida
let prisma: PrismaClient

if (hasValidDatabaseUrl) {
  // Runtime: crear cliente real
  prisma = globalThis.__prisma ?? new PrismaClientClass()
  
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = prisma
  }
} else {
  // Build time: crear stub que lanza error si se usa
  prisma = new Proxy({} as PrismaClient, {
    get(target, prop) {
      if (prop === 'then' || prop === 'catch') {
        return undefined
      }
      throw new Error(
        `Prisma not available during build. DATABASE_URL is: ${process.env.DATABASE_URL ? 'placeholder' : 'missing'}`
      )
    }
  })
}

export { prisma }
