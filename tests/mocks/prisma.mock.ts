/**
 * Mock del cliente Prisma para testing
 * Proporciona acceso al mock de Prisma configurado en setup.ts
 */
import { vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'

// Importamos el mock global configurado en setup.ts
declare global {
  var __prismaMock: any
}

// Obtener el mock de Prisma desde el global o crear uno nuevo
export const prismaMock: any = globalThis.__prismaMock || {
  user: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
  request: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
  task: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
  workflowDefinition: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
  workflowState: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
  workflowTransition: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
  stateHistory: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
  workflowNotification: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
  requestDocument: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
  taskAssignment: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
  userCalendarEvent: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
  $transaction: vi.fn((callback: any) => callback(prismaMock)),
  $queryRaw: vi.fn(),
  $executeRaw: vi.fn(),
  $disconnect: vi.fn(),
  $connect: vi.fn()
}

// Guardar en global para reutilizar
globalThis.__prismaMock = prismaMock

/**
 * Resetea todos los mocks de Prisma
 */
export function resetPrismaMocks() {
  Object.values(prismaMock).forEach((model: any) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((fn: any) => {
        if (typeof fn === 'function' && 'mockReset' in fn) {
          fn.mockReset()
        }
      })
    }
  })
}

/**
 * Helper para crear respuestas de Prisma con relaciones incluidas
 */
export function createPrismaResponse<T>(data: T, includes?: Record<string, any>): T & Record<string, any> {
  return { ...data, ...includes } as T & Record<string, any>
}

/**
 * Configura el mock de $transaction para tests complejos
 * Permite personalizar el comportamiento de la transacción
 */
export function setupTransactionMock(transactionImpl?: any) {
  if (transactionImpl) {
    prismaMock.$transaction.mockImplementation(transactionImpl)
  } else {
    prismaMock.$transaction.mockImplementation((callback: any) => callback(prismaMock))
  }
}
