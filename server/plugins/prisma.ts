import type { PrismaClient } from '@prisma/client'

// Plugin para inicializar Prisma en runtime
export default defineNitroPlugin(async () => {
  const { PrismaClient } = await import('@prisma/client')
  
  const isNeon = process.env.DATABASE_URL?.includes('neon.tech')
  
  let client: PrismaClient
  
  if (isNeon) {
    const { PrismaNeon } = await import('@prisma/adapter-neon')
    const pool = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
    client = new PrismaClient({ adapter: pool })
  } else {
    client = new PrismaClient()
  }
  
  // Guardar en global para uso desde db.ts
  // @ts-expect-error - extendiendo global
  globalThis.__prismaClient = client
})
