// server/utils/workflow/stateMachine.ts
// Utilidades de permisos y roles para workflows (sistema legado simplificado)

import type { UserRole } from '@prisma/client'

// ============================================
// TIPOS
// ============================================

export type EntityType = 'REQUEST' | 'TASK' | 'TASK_ASSIGNMENT'

export interface TransitionContext {
  userId: string
  userRole: UserRole
  entityId: string
  entityType: EntityType
  fromStatus: string
  toStatus: string
  comment?: string
  metadata?: Record<string, unknown>
}

export interface StateMachineResult {
  success: boolean
  error?: string
}

// ============================================
// STATE MACHINE (Legacy - mantener para compatibilidad de funciones utilitarias)
// ============================================

export class WorkflowStateMachine {
  /**
   * Obtiene las transiciones válidas para una entidad (legacy)
   * Ahora solo devuelve array vacío ya que se usa el sistema configurable
   */
  getTransitions(
    entityType: EntityType,
    currentStatus: string,
    requestType?: string
  ): string[] {
    // Este método está deprecado, usar workflowEngine.getAvailableTransitions
    return []
  }

  /**
   * Valida si una transición es permitida (legacy)
   * Ahora siempre retorna error para forzar uso del nuevo sistema
   */
  validateTransition(
    entityType: EntityType,
    fromStatus: string,
    toStatus: string,
    userRole: UserRole,
    requestType?: string
  ): StateMachineResult {
    return {
      success: false,
      error: 'Use el sistema de workflow configurable (workflowEngine)'
    }
  }

  /**
   * Ejecuta una transición con validación adicional opcional (legacy)
   */
  async executeTransition(
    context: TransitionContext
  ): Promise<StateMachineResult> {
    return {
      success: false,
      error: 'Use el sistema de workflow configurable (workflowEngine.executeTransition)'
    }
  }

  /**
   * Obtiene el estado inicial para un tipo de entidad (legacy)
   */
  getInitialStatus(entityType: EntityType): string {
    switch (entityType) {
      case 'REQUEST':
        return 'pending'
      case 'TASK':
      case 'TASK_ASSIGNMENT':
        return 'todo'
      default:
        return 'pending'
    }
  }

  /**
   * Determina si el estado es terminal (legacy)
   */
  isTerminalStatus(
    entityType: EntityType,
    status: string,
    requestType?: string
  ): boolean {
    const terminalStates = ['approved', 'rejected', 'closed', 'done', 'cancelled']
    return terminalStates.includes(status.toLowerCase())
  }
}

// Instancia singleton
export const workflowStateMachine = new WorkflowStateMachine()

// ============================================
// HELPERS DE PERMISOS
// ============================================

/**
 * Verifica si un usuario puede crear una solicitud de cierto tipo
 */
export function canCreateRequest(userRole: UserRole): boolean {
  // Profesores, expertos y superiores pueden crear solicitudes
  const allowedRoles: UserRole[] = ['PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT']
  return allowedRoles.includes(userRole)
}

/**
 * Verifica si un usuario puede gestionar solicitudes (administración)
 */
export function canManageRequests(userRole: UserRole): boolean {
  return ['ADMIN', 'ROOT'].includes(userRole)
}

/**
 * Verifica si un usuario puede crear tareas
 */
export function canCreateTasks(userRole: UserRole): boolean {
  return ['JEFE_DEPT', 'ADMIN', 'ROOT'].includes(userRole)
}

/**
 * Obtiene los estados posibles para el frontend (legacy)
 * Ahora devuelve labels genéricos ya que los estados vienen de la BD
 */
export function getStatusLabel(status: string, entityType: EntityType = 'REQUEST'): string {
  // Los estados ahora vienen de WorkflowState.name
  return status
}
