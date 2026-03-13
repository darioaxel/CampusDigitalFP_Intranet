import type { PrismaClient } from '@prisma/client'

// Declaración global
declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined
}

// Stub para build/prerender - no hace nada pero tiene la misma forma
const buildStub = new Proxy({} as PrismaClient, {
  get() {
    return () => {
      throw new Error('Prisma not initialized - this should not happen in runtime')
    }
  }
})

// Exportar el cliente real o el stub
export const prisma = (globalThis.__prismaClient ?? buildStub) as PrismaClient
