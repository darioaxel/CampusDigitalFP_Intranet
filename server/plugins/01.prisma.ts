import type { PrismaClient } from '@prisma/client'

// Plugin de Nitro para inicializar Prisma al arrancar el servidor
// El prefijo "01." asegura que se ejecute antes que otros plugins

export default defineNitroPlugin(async () => {
  console.log('[Prisma Plugin] Inicializando cliente...')
  
  const { PrismaClient } = await import('@prisma/client')
  
  // Detectar si es Neon por el dominio en la URL
  const isNeon = process.env.DATABASE_URL?.includes('neon.tech')
  
  let client: PrismaClient
  
  if (isNeon) {
    console.log('[Prisma Plugin] Usando adaptador Neon (WebSockets)')
    const { PrismaNeon } = await import('@prisma/adapter-neon')
    const pool = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
    client = new PrismaClient({ adapter: pool })
  } else {
    console.log('[Prisma Plugin] Usando PrismaClient estándar (PostgreSQL local)')
    client = new PrismaClient()
  }
  
  // Guardar en global para que db.ts lo pueda usar
  // @ts-expect-error - extendiendo global
  globalThis.__prisma = client
  
  console.log('[Prisma Plugin] Cliente inicializado correctamente')
})
