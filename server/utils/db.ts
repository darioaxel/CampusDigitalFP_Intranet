import type { PrismaClient } from '@prisma/client'

// El cliente es inicializado por server/plugins/01.prisma.ts
// Este archivo solo exporta la referencia al global

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// Exportar el cliente (será undefined durante build, pero disponible en runtime)
export const prisma = globalThis.__prisma as PrismaClient

// Helper async por si se necesita esperar explícitamente (rara vez necesario)
export async function getPrisma(): Promise<PrismaClient> {
  if (!globalThis.__prisma) {
    throw new Error('Prisma no está inicializado. El plugin debería haberlo inicializado.')
  }
  return globalThis.__prisma
}
