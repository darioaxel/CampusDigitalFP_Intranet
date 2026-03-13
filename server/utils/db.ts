import type { PrismaClient } from '@prisma/client'

let prismaInstance: PrismaClient | undefined

// Función que crea el cliente solo cuando se necesita
function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    // Dynamic import para evitar que se bundlee inmediatamente
    const { PrismaClient } = require('@prisma/client')
    prismaInstance = new PrismaClient()
  }
  return prismaInstance
}

// Exportar proxy que inicializa LAZY al acceder a cualquier propiedad
// Esto evita que se instancie durante el build de Nitro
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    // Solo inicializar cuando se accede a propiedades de modelo (no métodos internos)
    const client = getPrismaClient()
    return (client as any)[prop]
  }
})

// Helper para casos donde se necesita el cliente directamente
export function getPrisma(): PrismaClient {
  return getPrismaClient()
}
