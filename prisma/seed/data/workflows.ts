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
          { code: 'rejected', name: 'Rechazada', color: 'red', order: 3, isFinal: true, isTerminal: true },
          { code: 'cancelled_by_user', name: 'Eliminada por usuario', color: 'gray', order: 4, isFinal: true, isTerminal: true }
      ],
      transitions: [
          { fromCode: 'pending', toCode: 'approved', allowedRoles: ['ADMIN', 'ROOT'], requiresComment: true, autoActions: ['create_notification'] },
          { fromCode: 'pending', toCode: 'rejected', allowedRoles: ['ADMIN', 'ROOT'], requiresComment: true, autoActions: ['create_notification'] },
          { fromCode: 'pending', toCode: 'cancelled_by_user', allowedRoles: ['PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT'], requiresComment: false, autoActions: ['create_notification'] },
          { fromCode: 'approved', toCode: 'cancelled_by_user', allowedRoles: ['PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT'], requiresComment: false, autoActions: ['create_notification', 'remove_calendar_event'] }
      ]      
  }

// ========================================  
// WORKFLOW: Comunicación de Bajas
// ========================================
// Flujo: Profesor → Admin → Profesor (docs) → Admin → Validado
export const sickLeaveWorkflow = {
  code: 'request_sick_leave',
  name: 'Comunicación de Bajas',
  description: 'Flujo para comunicar bajas laborales con justificación documental (Profesor → Admin)',
  entityType: 'REQUEST',
  version: 1,
  isActive: true,
  states: [
    { code: 'pending_notification', name: 'Pendiente de Notificación', color: 'amber', order: 1, isInitial: true },
    { code: 'notified', name: 'Notificado', color: 'blue', order: 2 },
    { code: 'pending_docs', name: 'Esperando Documentación', color: 'amber', order: 3 },
    { code: 'pending_validation', name: 'Esperando Validación', color: 'purple', order: 4 },
    { code: 'validated', name: 'Validado', color: 'green', order: 5, isFinal: true },
    { code: 'rejected', name: 'Rechazado', color: 'red', order: 6, isFinal: true, isTerminal: true }
  ],
  transitions: [
    // Admin acepta la notificación inicial
    { fromCode: 'pending_notification', toCode: 'notified', allowedRoles: ['ADMIN', 'ROOT'], requiresComment: false, autoActions: ['create_notification'] },
    // El sistema (o profesor) pasa a esperar documentos
    { fromCode: 'notified', toCode: 'pending_docs', allowedRoles: ['ADMIN', 'ROOT', 'PROFESOR'], requiresComment: false, autoActions: ['create_notification'] },
    // Profesor solicita validación tras subir documentos
    { fromCode: 'pending_docs', toCode: 'pending_validation', allowedRoles: ['PROFESOR'], requiresComment: false, autoActions: ['create_notification'] },
    // Admin valida la solicitud
    { fromCode: 'pending_validation', toCode: 'validated', allowedRoles: ['ADMIN', 'ROOT'], requiresComment: true, validatorCode: 'check_documents', autoActions: ['create_notification'] },
    // Admin devuelve para corregir documentación
    { fromCode: 'pending_validation', toCode: 'pending_docs', allowedRoles: ['ADMIN', 'ROOT'], requiresComment: true, autoActions: ['create_notification'] },
    // Admin rechaza la solicitud
    { fromCode: 'pending_validation', toCode: 'rejected', allowedRoles: ['ADMIN', 'ROOT'], requiresComment: true, autoActions: ['create_notification'] }
  ]
}

// Exportar todos los workflows
export const allWorkflows = [
  freeDayWorkflow,
  requestNewUserWorkflow,
  sickLeaveWorkflow
]
