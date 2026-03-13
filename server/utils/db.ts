import pkg from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const { PrismaClient } = pkg

// Verificar si estamos en runtime real (no en build/prerender)
const isRuntime = !process.env.NITRO_PRERENDER && process.env.NITRO_ENV === 'production'

const prismaClientSingleton = () => {
  // Detectar si es una conexión a Neon (usa el dominio neon.tech)
  const isNeon = process.env.DATABASE_URL?.includes('neon.tech')
  
  if (isNeon && isRuntime) {
    const pool = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
    return new PrismaClient({ adapter: pool })
  }
  
  // Para PostgreSQL estándar (Docker local, RDS, etc.) o durante build
  return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma