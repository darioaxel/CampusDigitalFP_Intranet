// prisma/seed/data/workflows.ts
// Datos de los workflows configurables

import { EntityType } from '@prisma/client'

// ========================================
// WORKFLOW: Validación de Tarea (REVIEW)
// ========================================
export const taskValidationWorkflow = {
  code: 'task_validation',
  name: 'Validación de Tarea',
  description: 'Flujo simple: Pendiente → En Revisión → Aprobado/Rechazado',
  entityType: EntityType.TASK,
  version: 1,
  isActive: true,
  states: [
    { code: 'todo', name: 'Por hacer', color: 'gray', order: 1, isInitial: true },
    { code: 'in_progress', name: 'En progreso', color: 'blue', order: 2 },
    { code: 'in_review', name: 'En revisión', color: 'amber', order: 3 },
    { code: 'approved', name: 'Aprobado', color: 'green', order: 4, isFinal: true },
    { code: 'rejected', name: 'Rechazado', color: 'red', order: 5, isFinal: true, isTerminal: true },
    { code: 'cancelled', name: 'Cancelado', color: 'gray', order: 6, isTerminal: true }
  ],
  transitions: [
    { fromCode: 'todo', toCode: 'in_progress', allowedRoles: ['PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT'] },
    { fromCode: 'in_progress', toCode: 'in_review', allowedRoles: ['PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT'] },
    { fromCode: 'in_review', toCode: 'approved', allowedRoles: ['JEFE_DEPT', 'ADMIN', 'ROOT'], requiresComment: true, autoActions: ['create_notification', 'notify_assignees'] },
    { fromCode: 'in_review', toCode: 'rejected', allowedRoles: ['JEFE_DEPT', 'ADMIN', 'ROOT'], requiresComment: true, autoActions: ['create_notification', 'notify_assignees'] },
    { fromCode: 'todo', toCode: 'cancelled', allowedRoles: ['JEFE_DEPT', 'ADMIN', 'ROOT'], autoActions: ['notify_assignees'] }
  ]
}

// ========================================
// WORKFLOW: Votación
// ========================================
export const taskVotingWorkflow = {
  code: 'task_voting',
  name: 'Votación',
  description: 'Votación con múltiples opciones',
  entityType: EntityType.TASK,
  version: 1,
  isActive: true,
  states: [
    { code: 'voting_open', name: 'Votación Abierta', color: 'green', order: 1, isInitial: true },
    { code: 'voting_closed', name: 'Votación Cerrada', color: 'amber', order: 2 },
    { code: 'resolved', name: 'Resuelto', color: 'purple', order: 3, isFinal: true }
  ],
  transitions: [
    { fromCode: 'voting_open', toCode: 'voting_closed', allowedRoles: ['JEFE_DEPT', 'ADMIN', 'ROOT'], autoActions: ['notify_assignees'] },
    { fromCode: 'voting_closed', toCode: 'resolved', allowedRoles: ['JEFE_DEPT', 'ADMIN', 'ROOT'], requiresComment: true, autoActions: ['create_notification', 'notify_assignees'] }
  ]
}

// ========================================
// WORKFLOW: Tarea Simple
// ========================================
export const taskSimpleWorkflow = {
  code: 'task_simple',
  name: 'Tarea Simple',
  description: 'Flujo básico para tareas simples',
  entityType: EntityType.TASK,
  version: 1,
  isActive: true,
  states: [
    { code: 'todo', name: 'Por hacer', color: 'gray', order: 1, isInitial: true },
    { code: 'in_progress', name: 'En progreso', color: 'blue', order: 2 },
    { code: 'done', name: 'Completada', color: 'green', order: 3, isFinal: true },
    { code: 'cancelled', name: 'Cancelada', color: 'red', order: 4, isTerminal: true }
  ],
  transitions: [
    { fromCode: 'todo', toCode: 'in_progress', allowedRoles: ['PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT'] },
    { fromCode: 'in_progress', toCode: 'done', allowedRoles: ['PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT'], autoActions: ['create_notification'] },
    { fromCode: 'todo', toCode: 'cancelled', allowedRoles: ['JEFE_DEPT', 'ADMIN', 'ROOT'] },
    { fromCode: 'in_progress', toCode: 'cancelled', allowedRoles: ['JEFE_DEPT', 'ADMIN', 'ROOT'] }
  ]
}

// ========================================
// WORKFLOW: Alta de Nuevo Usuario (REQUEST - único habilitado para pruebas)
// ========================================
export const requestNewUserWorkflow = {
  code: 'request_new_user',
  name: 'Alta de Nuevo Usuario',
  description: 'Flujo para solicitar la creación de nuevos usuarios en el sistema (formulario público)',
  entityType: EntityType.REQUEST,
  version: 1,
  isActive: true,
  states: [
    { code: 'pending', name: 'Pendiente de Validación', color: 'amber', order: 1, isInitial: true },
    { code: 'approved', name: 'Aprobada - Usuario Creado', color: 'green', order: 2, isFinal: true },
    { code: 'rejected', name: 'Rechazada', color: 'red', order: 3, isFinal: true, isTerminal: true }
  ],
  transitions: [
    { fromCode: 'pending', toCode: 'approved', allowedRoles: ['ADMIN', 'ROOT'], requiresComment: true, autoActions: ['create_notification'] },
    { fromCode: 'pending', toCode: 'rejected', allowedRoles: ['ADMIN', 'ROOT'], requiresComment: true, autoActions: ['create_notification'] }
  ]
}

// Exportar todos los workflows
export const allWorkflows = [
  taskValidationWorkflow,
  taskVotingWorkflow,
  taskSimpleWorkflow,
  requestNewUserWorkflow
]
