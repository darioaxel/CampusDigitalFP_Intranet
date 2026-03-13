import pkg from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const { PrismaClient } = pkg

// Variable para almacenar la instancia
declare global {
  // eslint-disable-next-line no-var
  var __prisma: pkg.PrismaClient | undefined
}

// Factory function
function createPrismaClient(): pkg.PrismaClient {
  const isNeon = process.env.DATABASE_URL?.includes('neon.tech')
  
  if (isNeon) {
    const pool = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
    return new PrismaClient({ adapter: pool })
  }
  
  return new PrismaClient()
}

// Singleton pattern compatible con hot reload
export const prisma = globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}
