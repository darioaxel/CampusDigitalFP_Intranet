/**
 * Fixtures con los workflows reales del sistema
 * Basados en prisma/seed/data/workflows.ts
 */
import { WorkflowBuilder } from '../factories/workflow.factory'
import type { Role, EntityType } from '@prisma/client'

// ============================================
// WORKFLOW: Alta de Nuevo Usuario
// ============================================
export const requestNewUserWorkflowFixture = () => {
  const builder = new WorkflowBuilder(
    'request_new_user',
    'Alta de Nuevo Usuario',
    'REQUEST' as EntityType
  )

  return builder
    .addState('pending', 'Pendiente de Validación', { 
      color: 'amber', 
      order: 1, 
      isInitial: true 
    })
    .addState('approved', 'Aprobada - Usuario Creado', { 
      color: 'green', 
      order: 2, 
      isFinal: true 
    })
    .addState('rejected', 'Rechazada', { 
      color: 'red', 
      order: 3, 
      isFinal: true, 
      isTerminal: true 
    })
    // Transiciones
    .addTransition(
      'pending', 
      'approved', 
      ['ADMIN', 'ROOT'] as Role[],
      { requiresComment: true, autoActions: ['create_notification'] }
    )
    .addTransition(
      'pending', 
      'rejected', 
      ['ADMIN', 'ROOT'] as Role[],
      { requiresComment: true, autoActions: ['create_notification'] }
    )
    .build()
}

// ============================================
// WORKFLOW: Día Libre Disposición
// ============================================
export const freeDayWorkflowFixture = () => {
  const builder = new WorkflowBuilder(
    'request_free_day',
    'Día Libre Disposición',
    'REQUEST' as EntityType
  )

  return builder
    .addState('pending', 'Pendiente', { 
      color: 'amber', 
      order: 1, 
      isInitial: true 
    })
    .addState('approved', 'Aprobada', { 
      color: 'green', 
      order: 2, 
      isFinal: true 
    })
    .addState('rejected', 'Rechazada', { 
      color: 'red', 
      order: 3, 
      isFinal: true, 
      isTerminal: true 
    })
    .addState('cancelled_by_user', 'Eliminada por usuario', { 
      color: 'gray', 
      order: 4, 
      isFinal: true, 
      isTerminal: true 
    })
    // Transiciones
    .addTransition(
      'pending', 
      'approved', 
      ['ADMIN', 'ROOT'] as Role[],
      { requiresComment: true, autoActions: ['create_notification'] }
    )
    .addTransition(
      'pending', 
      'rejected', 
      ['ADMIN', 'ROOT'] as Role[],
      { requiresComment: true, autoActions: ['create_notification'] }
    )
    .addTransition(
      'pending', 
      'cancelled_by_user', 
      ['PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT'] as Role[],
      { requiresComment: false, autoActions: ['create_notification'] }
    )
    .addTransition(
      'approved', 
      'cancelled_by_user', 
      ['PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT'] as Role[],
      { requiresComment: false, autoActions: ['create_notification', 'remove_calendar_event'] }
    )
    .build()
}

// ============================================
// WORKFLOW: Comunicación de Bajas
// ============================================
export const sickLeaveWorkflowFixture = () => {
  const builder = new WorkflowBuilder(
    'request_sick_leave',
    'Comunicación de Bajas',
    'REQUEST' as EntityType
  )

  return builder
    .addState('pending_notification', 'Pendiente de Notificación', { 
      color: 'amber', 
      order: 1, 
      isInitial: true 
    })
    .addState('notified', 'Notificado', { 
      color: 'blue', 
      order: 2 
    })
    .addState('pending_docs', 'Esperando Documentación', { 
      color: 'amber', 
      order: 3 
    })
    .addState('pending_validation', 'Esperando Validación', { 
      color: 'purple', 
      order: 4 
    })
    .addState('validated', 'Validado', { 
      color: 'green', 
      order: 5, 
      isFinal: true 
    })
    .addState('rejected', 'Rechazado', { 
      color: 'red', 
      order: 6, 
      isFinal: true, 
      isTerminal: true 
    })
    // Transiciones
    .addTransition(
      'pending_notification', 
      'notified', 
      ['ADMIN', 'ROOT'] as Role[],
      { requiresComment: false, autoActions: ['create_notification'] }
    )
    .addTransition(
      'notified', 
      'pending_docs', 
      ['ADMIN', 'ROOT', 'PROFESOR'] as Role[],
      { requiresComment: false, autoActions: ['create_notification'] }
    )
    .addTransition(
      'pending_docs', 
      'pending_validation', 
      ['PROFESOR'] as Role[],
      { requiresComment: false, autoActions: ['create_notification'] }
    )
    .addTransition(
      'pending_validation', 
      'validated', 
      ['ADMIN', 'ROOT'] as Role[],
      { requiresComment: true, validatorCode: 'check_documents', autoActions: ['create_notification'] }
    )
    .addTransition(
      'pending_validation', 
      'pending_docs', 
      ['ADMIN', 'ROOT'] as Role[],
      { requiresComment: true, autoActions: ['create_notification'] }
    )
    .addTransition(
      'pending_validation', 
      'rejected', 
      ['ADMIN', 'ROOT'] as Role[],
      { requiresComment: true, autoActions: ['create_notification'] }
    )
    .build()
}

// ============================================
// TODOS LOS WORKFLOWS
// ============================================
export const allWorkflowFixtures = () => [
  requestNewUserWorkflowFixture(),
  freeDayWorkflowFixture(),
  sickLeaveWorkflowFixture()
]

// ============================================
// VALIDACIONES DE WORKFLOW
// ============================================

/**
 * Valida que un workflow tenga exactamente un estado inicial
 */
export function validateWorkflowStructure(workflow: ReturnType<typeof requestNewUserWorkflowFixture>) {
  const errors: string[] = []
  
  // Debe tener exactamente un estado inicial
  const initialStates = workflow.states.filter(s => s.isInitial)
  if (initialStates.length !== 1) {
    errors.push(`Debe tener exactamente 1 estado inicial, tiene ${initialStates.length}`)
  }
  
  // Debe tener al menos un estado final
  const finalStates = workflow.states.filter(s => s.isFinal)
  if (finalStates.length === 0) {
    errors.push('Debe tener al menos 1 estado final')
  }
  
  // Todos los estados deben tener transiciones válidas (excepto finales terminales)
  const nonTerminalStates = workflow.states.filter(s => !s.isTerminal)
  for (const state of nonTerminalStates) {
    const hasOutgoing = workflow.transitions.some(t => t.fromStateId === state.id)
    if (!hasOutgoing && !state.isFinal) {
      errors.push(`El estado '${state.code}' no tiene transiciones salientes`)
    }
  }
  
  // Verificar que todas las transiciones referencien estados existentes
  for (const transition of workflow.transitions) {
    const fromExists = workflow.states.some(s => s.id === transition.fromStateId)
    const toExists = workflow.states.some(s => s.id === transition.toStateId)
    if (!fromExists) errors.push(`Transición referencia fromStateId inexistente: ${transition.fromStateId}`)
    if (!toExists) errors.push(`Transición referencia toStateId inexistente: ${transition.toStateId}`)
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
