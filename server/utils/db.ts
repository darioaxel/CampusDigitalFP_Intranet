import type { PrismaClient } from '@prisma/client'

// Declaración global para singleton
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// Factory: crea el cliente apropiado según la URL
async function createPrismaClient(): Promise<PrismaClient> {
  const { PrismaClient } = await import('@prisma/client')
  
  // Detectar si es Neon por el dominio en la URL
  const isNeon = process.env.DATABASE_URL?.includes('neon.tech')
  
  if (isNeon) {
    // Local/DEV con Neon: usar adapter con WebSockets
    const { PrismaNeon } = await import('@prisma/adapter-neon')
    const pool = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
    return new PrismaClient({ adapter: pool })
  }
  
  // Producción (Docker) o PostgreSQL estándar: sin adapter
  return new PrismaClient()
}

// Inicializar en runtime (no durante build/prerender)
if (!globalThis.__prisma && process.env.NITRO_ENV === 'production') {
  createPrismaClient().then(client => {
    globalThis.__prisma = client
  })
}

// Export síncrono - en runtime tendrá el cliente, en build será undefined
export const prisma = globalThis.__prisma as PrismaClient
