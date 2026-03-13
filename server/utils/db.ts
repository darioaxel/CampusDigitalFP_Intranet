import pkg from '@prisma/client'

const { PrismaClient } = pkg

const prismaClientSingleton = () => {
  // Detectar si es una conexión a Neon (usa el dominio neon.tech)
  const isNeon = process.env.DATABASE_URL?.includes('neon.tech')
  
  if (isNeon) {
    // Solo importar el adaptador de Neon si es necesario
    const { PrismaNeon } = require('@prisma/adapter-neon')
    const pool = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
    return new PrismaClient({ adapter: pool })
  }
  
  // Para PostgreSQL estándar (Docker local, RDS, etc.)
  return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma