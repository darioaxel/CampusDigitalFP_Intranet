import { PrismaClient } from '@prisma/client'

// Detectar si estamos en build time (placeholder) o runtime real
const isBuildTime = !process.env.DATABASE_URL || 
  process.env.DATABASE_URL.includes('placeholder') ||
  process.env.DATABASE_URL === 'postgresql://user:pass@localhost:5432/db'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Función para crear el cliente (solo en runtime)
function createPrismaClient(): PrismaClient {
  return new PrismaClient()
}

// Exportar: stub durante build, cliente real en runtime
export const prisma = isBuildTime
  ? ({} as PrismaClient) // Stub vacío - no se usará en build
  : (globalForPrisma.prisma ?? createPrismaClient())

// Guardar en global para hot reload (solo en runtime)
if (!isBuildTime && process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma as PrismaClient
}
