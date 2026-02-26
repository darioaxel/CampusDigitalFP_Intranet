// prisma/seed/data/workflows.ts
// Datos de los workflows configurables

import { EntityType } from '@prisma/client'

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

// ========================================
// WORKFLOW: Solicitud de Día Libre
// ========================================
// Flujo simplificado: Profesor → Admin/Root 
export const freeDayWorkflow = {
      code: 'request_free_day',
      name: 'Día Libre Disposición',
      description: 'Flujo de aprobación para días de libre disposición (Profesor → Admin)',
      entityType: 'REQUEST',
      version: 1,
      isActive: true,
      states: [
          { code: 'pending', name: 'Pendiente', color: 'amber', order: 1, isInitial: true },
          { code: 'approved', name: 'Aprobada', color: 'green', order: 2, isFinal: true },
          { code: 'rejected', name: 'Rechazada', color: 'red', order: 3, isFinal: true, isTerminal: true }
      ],
      transitions: [
          { fromCode: 'pending', toCode: 'approved', allowedRoles: ['ADMIN', 'ROOT'], requiresComment: true, autoActions: ['create_notification'] },
          { fromCode: 'pending', toCode: 'rejected', allowedRoles: ['ADMIN', 'ROOT'], requiresComment: true, autoActions: ['create_notification'] }
      ]      
  }

// Exportar todos los workflows
export const allWorkflows = [
  freeDayWorkflow,
  requestNewUserWorkflow
]
