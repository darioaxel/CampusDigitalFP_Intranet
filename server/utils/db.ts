import type { PrismaClient } from '@prisma/client'

// Declaración global para singleton
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
  // eslint-disable-next-line no-var
  var __prismaInitPromise: Promise<PrismaClient> | undefined
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

// Función para obtener el cliente (siempre usar esta en API routes)
export async function getPrisma(): Promise<PrismaClient> {
  // Si ya está inicializado, retornarlo
  if (globalThis.__prisma) {
    return globalThis.__prisma
  }
  
  // Si hay una inicialización en progreso, esperarla
  if (globalThis.__prismaInitPromise) {
    return globalThis.__prismaInitPromise
  }
  
  // Iniciar nueva inicialización
  globalThis.__prismaInitPromise = createPrismaClient().then(client => {
    globalThis.__prisma = client
    return client
  })
  
  return globalThis.__prismaInitPromise
}

// Export síncrono para compatibilidad (las rutas DEBEN usar getPrisma() en su lugar)
// Esto está aquí para no romper imports existentes, pero no usar directamente
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    return async (...args: unknown[]) => {
      const client = await getPrisma()
      const method = (client as Record<string | symbol, (...args: unknown[]) => unknown>)[prop]
      if (typeof method !== 'function') {
        throw new Error(`Prisma method ${String(prop)} is not a function`)
      }
      return method.apply(client, args)
    }
  }
})
