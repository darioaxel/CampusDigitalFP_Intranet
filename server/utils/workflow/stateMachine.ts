// server/utils/workflow/stateMachine.ts
// Máquina de estados para solicitudes y tareas

import type { WorkflowStatus, RequestType, Role } from '@prisma/client'

// ============================================
// TIPOS
// ============================================

export type EntityType = 'REQUEST' | 'TASK' | 'TASK_ASSIGNMENT'

export interface TransitionConfig {
  from: WorkflowStatus
  to: WorkflowStatus
  allowedRoles: Role[]
  requiresComment?: boolean
  validate?: (context: TransitionContext) => Promise<boolean> | boolean
}

export interface TransitionContext {
  userId: string
  userRole: Role
  entityId: string
  entityType: EntityType
  fromStatus: WorkflowStatus
  toStatus: WorkflowStatus
  comment?: string
  metadata?: Record<string, unknown>
}

export interface StateMachineResult {
  success: boolean
  error?: string
  transition?: TransitionConfig
}

// ============================================
// CONFIGURACIÓN DE TRANSICIONES PARA SOLICITUDES
// ============================================

// Estados específicos para solicitudes
const REQUEST_STATES = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMMUNICATED: 'COMMUNICATED',
  CLOSED: 'CLOSED',
} as const

// Transiciones para solicitudes de tipo FREE_DAY, LEAVE, TRAINING, OTHER
const STANDARD_REQUEST_TRANSITIONS: TransitionConfig[] = [
  // Profesor crea (automático a PENDING)
  {
    from: 'PENDING' as WorkflowStatus,
    to: 'APPROVED' as WorkflowStatus,
    allowedRoles: ['ADMIN', 'ROOT'],
    requiresComment: false,
  },
  {
    from: 'PENDING' as WorkflowStatus,
    to: 'REJECTED' as WorkflowStatus,
    allowedRoles: ['ADMIN', 'ROOT'],
    requiresComment: true, // Requiere justificación
  },
  // Reapertura (admin puede revertir)
  {
    from: 'APPROVED' as WorkflowStatus,
    to: 'PENDING' as WorkflowStatus,
    allowedRoles: ['ADMIN', 'ROOT'],
  },
  {
    from: 'REJECTED' as WorkflowStatus,
    to: 'PENDING' as WorkflowStatus,
    allowedRoles: ['ADMIN', 'ROOT'],
  },
]

// Transiciones especiales para MEDICAL_APPOINTMENT
const MEDICAL_REQUEST_TRANSITIONS: TransitionConfig[] = [
  // Administración marca como "comunicada" (el profesor avisó)
  {
    from: 'PENDING' as WorkflowStatus,
    to: 'COMMUNICATED' as WorkflowStatus,
    allowedRoles: ['ADMIN', 'ROOT'],
  },
  // Cierre directo si no requiere documentación
  {
    from: 'PENDING' as WorkflowStatus,
    to: 'CLOSED' as WorkflowStatus,
    allowedRoles: ['ADMIN', 'ROOT'],
  },
  {
    from: 'COMMUNICATED' as WorkflowStatus,
    to: 'CLOSED' as WorkflowStatus,
    allowedRoles: ['ADMIN', 'ROOT'],
    // Podría validarse que haya documentos adjuntos válidos
  },
  // Rechazo en cualquier estado previo
  {
    from: 'PENDING' as WorkflowStatus,
    to: 'REJECTED' as WorkflowStatus,
    allowedRoles: ['ADMIN', 'ROOT'],
    requiresComment: true,
  },
  {
    from: 'COMMUNICATED' as WorkflowStatus,
    to: 'REJECTED' as WorkflowStatus,
    allowedRoles: ['ADMIN', 'ROOT'],
    requiresComment: true,
  },
  // Reapertura
  {
    from: 'CLOSED' as WorkflowStatus,
    to: 'COMMUNICATED' as WorkflowStatus,
    allowedRoles: ['ADMIN', 'ROOT'],
  },
  {
    from: 'REJECTED' as WorkflowStatus,
    to: 'PENDING' as WorkflowStatus,
    allowedRoles: ['ADMIN', 'ROOT'],
  },
]

// ============================================
// CONFIGURACIÓN DE TRANSICIONES PARA TAREAS
// ============================================

const TASK_TRANSITIONS: TransitionConfig[] = [
  // Creador (jefe depto) puede cancelar
  {
    from: 'TODO' as WorkflowStatus,
    to: 'CANCELLED' as WorkflowStatus,
    allowedRoles: ['JEFE_DEPT', 'ADMIN', 'ROOT'],
  },
  // Asignado actualiza estado
  {
    from: 'TODO' as WorkflowStatus,
    to: 'IN_PROGRESS' as WorkflowStatus,
    allowedRoles: ['PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT'],
  },
  {
    from: 'IN_PROGRESS' as WorkflowStatus,
    to: 'DONE' as WorkflowStatus,
    allowedRoles: ['PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT'],
  },
  // Volver atrás
  {
    from: 'IN_PROGRESS' as WorkflowStatus,
    to: 'TODO' as WorkflowStatus,
    allowedRoles: ['PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT'],
  },
  {
    from: 'DONE' as WorkflowStatus,
    to: 'IN_PROGRESS' as WorkflowStatus,
    allowedRoles: ['PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT'],
  },
]

const TASK_ASSIGNMENT_TRANSITIONS: TransitionConfig[] = [
  ...TASK_TRANSITIONS,
  // El creador de la tarea puede forzar estado
  {
    from: 'TODO' as WorkflowStatus,
    to: 'DONE' as WorkflowStatus,
    allowedRoles: ['JEFE_DEPT', 'ADMIN', 'ROOT'],
  },
]

// ============================================
// STATE MACHINE
// ============================================

export class WorkflowStateMachine {
  private transitions: Map<string, TransitionConfig[]>

  constructor() {
    this.transitions = new Map()
    this.initializeTransitions()
  }

  private initializeTransitions(): void {
    // Solicitudes estándar
    this.transitions.set('REQUEST_STANDARD', STANDARD_REQUEST_TRANSITIONS)
    // Solicitudes médicas
    this.transitions.set('REQUEST_MEDICAL', MEDICAL_REQUEST_TRANSITIONS)
    // Tareas
    this.transitions.set('TASK', TASK_TRANSITIONS)
    // Asignaciones de tareas
    this.transitions.set('TASK_ASSIGNMENT', TASK_ASSIGNMENT_TRANSITIONS)
  }

  /**
   * Obtiene las transiciones válidas para una entidad
   */
  getTransitions(
    entityType: EntityType,
    currentStatus: WorkflowStatus,
    requestType?: RequestType
  ): WorkflowStatus[] {
    const key = this.getKey(entityType, requestType)
    const transitions = this.transitions.get(key) || []
    
    return transitions
      .filter(t => t.from === currentStatus)
      .map(t => t.to)
  }

  /**
   * Valida si una transición es permitida
   */
  validateTransition(
    entityType: EntityType,
    fromStatus: WorkflowStatus,
    toStatus: WorkflowStatus,
    userRole: Role,
    requestType?: RequestType
  ): StateMachineResult {
    const key = this.getKey(entityType, requestType)
    const transitions = this.transitions.get(key) || []
    
    const transition = transitions.find(
      t => t.from === fromStatus && t.to === toStatus
    )

    if (!transition) {
      return {
        success: false,
        error: `Transición no permitida de ${fromStatus} a ${toStatus}`,
      }
    }

    if (!transition.allowedRoles.includes(userRole)) {
      return {
        success: false,
        error: `El rol ${userRole} no tiene permiso para esta transición`,
      }
    }

    return {
      success: true,
      transition,
    }
  }

  /**
   * Ejecuta una transición con validación adicional opcional
   */
  async executeTransition(
    context: TransitionContext
  ): Promise<StateMachineResult> {
    const { entityType, fromStatus, toStatus, userRole, requestType } = context

    // Validación básica
    const validation = this.validateTransition(
      entityType,
      fromStatus,
      toStatus,
      userRole,
      requestType
    )

    if (!validation.success) {
      return validation
    }

    // Validación personalizada si existe
    if (validation.transition?.validate) {
      const customValid = await validation.transition.validate(context)
      if (!customValid) {
        return {
          success: false,
          error: 'Validación adicional fallida',
        }
      }
    }

    // Validación de comentario requerido
    if (validation.transition?.requiresComment && !context.comment) {
      return {
        success: false,
        error: 'Esta transición requiere un comentario',
      }
    }

    return validation
  }

  /**
   * Obtiene el estado inicial para un tipo de entidad
   */
  getInitialStatus(entityType: EntityType): WorkflowStatus {
    switch (entityType) {
      case 'REQUEST':
        return 'PENDING' as WorkflowStatus
      case 'TASK':
      case 'TASK_ASSIGNMENT':
        return 'TODO' as WorkflowStatus
      default:
        return 'PENDING' as WorkflowStatus
    }
  }

  /**
   * Determina si el estado es terminal
   */
  isTerminalStatus(
    entityType: EntityType,
    status: WorkflowStatus,
    requestType?: RequestType
  ): boolean {
    const terminalStates: Record<string, WorkflowStatus[]> = {
      REQUEST_STANDARD: ['APPROVED', 'REJECTED', 'CLOSED'],
      REQUEST_MEDICAL: ['CLOSED', 'REJECTED'],
      TASK: ['DONE', 'CANCELLED'],
      TASK_ASSIGNMENT: ['DONE', 'CANCELLED'],
    }

    const key = this.getKey(entityType, requestType)
    const terminals = terminalStates[key] || []
    return terminals.includes(status)
  }

  private getKey(entityType: EntityType, requestType?: RequestType): string {
    if (entityType === 'REQUEST' && requestType === 'MEDICAL_APPOINTMENT') {
      return 'REQUEST_MEDICAL'
    }
    if (entityType === 'REQUEST') {
      return 'REQUEST_STANDARD'
    }
    return entityType
  }
}

// Instancia singleton
export const workflowStateMachine = new WorkflowStateMachine()

// ============================================
// HELPERS
// ============================================

/**
 * Verifica si un usuario puede crear una solicitud de cierto tipo
 */
export function canCreateRequest(userRole: Role, requestType: RequestType): boolean {
  // Profesores, expertos y superiores pueden crear solicitudes
  const allowedRoles: Role[] = ['PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT']
  return allowedRoles.includes(userRole)
}

/**
 * Verifica si un usuario puede gestionar solicitudes (administración)
 */
export function canManageRequests(userRole: Role): boolean {
  return ['ADMIN', 'ROOT'].includes(userRole)
}

/**
 * Verifica si un usuario puede crear tareas
 */
export function canCreateTasks(userRole: Role): boolean {
  return ['JEFE_DEPT', 'ADMIN', 'ROOT'].includes(userRole)
}

/**
 * Obtiene los estados posibles para el frontend
 */
export function getStatusLabel(status: WorkflowStatus, entityType: EntityType = 'REQUEST'): string {
  const labels: Record<string, Record<string, string>> = {
    REQUEST: {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobada',
      REJECTED: 'Rechazada',
      COMMUNICATED: 'Comunicada',
      CLOSED: 'Cerrada',
    },
    TASK: {
      TODO: 'Por hacer',
      IN_PROGRESS: 'En progreso',
      DONE: 'Completada',
      CANCELLED: 'Cancelada',
    },
  }

  return labels[entityType]?.[status] || status
}
