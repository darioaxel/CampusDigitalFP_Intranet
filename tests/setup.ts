/**
 * Setup file para Vitest
 * Configura el entorno de testing antes de ejecutar los tests
 */
import { vi } from 'vitest'

// Mock de variables de entorno
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.NODE_ENV = 'test'

// Mock global de la base de datos antes de importar cualquier módulo
vi.mock('~/server/utils/db', () => {
  return {
    prisma: {
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
      $transaction: vi.fn((callback) => callback({
        user: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
        request: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
        task: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
        workflowDefinition: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
        workflowState: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
        workflowTransition: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
        stateHistory: { create: vi.fn() },
        workflowNotification: { create: vi.fn() },
        requestDocument: { count: vi.fn() },
        taskAssignment: { findMany: vi.fn() },
        userCalendarEvent: { create: vi.fn(), deleteMany: vi.fn() }
      })),
      $queryRaw: vi.fn(),
      $executeRaw: vi.fn(),
      $disconnect: vi.fn(),
      $connect: vi.fn()
    }
  }
})
