// app/types/workflow-editor.ts
// Tipos para el editor JSON de workflows

import type { EntityType } from '@prisma/client'

// ========================================
// COLORES DE ESTADO DISPONIBLES
// ========================================
export const WORKFLOW_STATE_COLORS = [
  'gray',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose'
] as const

export type WorkflowStateColor = typeof WORKFLOW_STATE_COLORS[number]

// ========================================
// ROLES DISPONIBLES
// ========================================
export const WORKFLOW_ROLES = [
  'USER',
  'PROFESOR',
  'EXPERTO',
  'JEFE_DEPT',
  'ADMIN',
  'ROOT'
] as const

export type WorkflowRole = typeof WORKFLOW_ROLES[number]

// ========================================
// ACCIONES AUTOMÁTICAS DISPONIBLES
// ========================================
export const WORKFLOW_AUTO_ACTIONS = [
  { code: 'create_notification', name: 'Crear notificación', description: 'Notifica al creador de la entidad' },
  { code: 'update_calendar', name: 'Actualizar calendario', description: 'Actualiza eventos del calendario (para días libres)' },
  { code: 'remove_calendar_event', name: 'Eliminar evento calendario', description: 'Elimina asignación de calendario' },
  { code: 'notify_creator', name: 'Notificar creador', description: 'Envía notificación específica al creador' },
  { code: 'notify_assignees', name: 'Notificar asignados', description: 'Notifica a todos los asignados de la tarea' }
] as const

export type WorkflowAutoAction = typeof WORKFLOW_AUTO_ACTIONS[number]['code']

// ========================================
// VALIDADORES DISPONIBLES
// ========================================
export const WORKFLOW_VALIDATORS = [
  { code: 'check_quota', name: 'Verificar cuota', description: 'Valida cuota de días libres disponibles' },
  { code: 'validate_schedule', name: 'Validar horario', description: 'Valida conflictos de horario' },
  { code: 'check_documents', name: 'Verificar documentos', description: 'Requiere al menos un documento adjunto' }
] as const

export type WorkflowValidator = typeof WORKFLOW_VALIDATORS[number]['code']

// ========================================
// ESTRUCTURA JSON DEL WORKFLOW
// ========================================

export interface WorkflowStateJson {
  code: string
  name: string
  color?: WorkflowStateColor
  order?: number
  isInitial?: boolean
  isFinal?: boolean
  isTerminal?: boolean
  config?: Record<string, any>
}

export interface WorkflowTransitionJson {
  from: string  // código del estado origen
  to: string    // código del estado destino
  allowedRoles: WorkflowRole[]
  requiresComment?: boolean
  requiresFields?: string[]
  autoActions?: WorkflowAutoAction[]
  validatorCode?: WorkflowValidator
}

export interface WorkflowDefinitionJson {
  code: string
  name: string
  description?: string
  entityType: EntityType
  version?: number
  isActive?: boolean
  states: WorkflowStateJson[]
  transitions: WorkflowTransitionJson[]
}

// ========================================
// RESULTADO DE VALIDACIÓN
// ========================================

export interface WorkflowValidationError {
  path: string
  message: string
  severity: 'error' | 'warning'
}

export interface WorkflowValidationResult {
  valid: boolean
  errors: WorkflowValidationError[]
}

// ========================================
// SNIPPETS PARA EL EDITOR
// ========================================

export interface WorkflowSnippet {
  name: string
  description: string
  code: string
}

export const WORKFLOW_SNIPPETS: WorkflowSnippet[] = [
  {
    name: 'Estado inicial',
    description: 'Estado de inicio del workflow',
    code: `{
  "code": "pending",
  "name": "Pendiente",
  "color": "amber",
  "isInitial": true
}`
  },
  {
    name: 'Estado final aprobado',
    description: 'Estado de aprobación final',
    code: `{
  "code": "approved",
  "name": "Aprobado",
  "color": "green",
  "isFinal": true
}`
  },
  {
    name: 'Estado final rechazado',
    description: 'Estado de rechazo terminal',
    code: `{
  "code": "rejected",
  "name": "Rechazado",
  "color": "red",
  "isFinal": true,
  "isTerminal": true
}`
  },
  {
    name: 'Transición simple',
    description: 'Transición básica entre estados',
    code: `{
  "from": "pending",
  "to": "approved",
  "allowedRoles": ["ADMIN", "ROOT"],
  "requiresComment": true
}`
  },
  {
    name: 'Transición con acciones',
    description: 'Transición que ejecuta acciones automáticas',
    code: `{
  "from": "pending",
  "to": "approved",
  "allowedRoles": ["ADMIN", "ROOT"],
  "requiresComment": true,
  "autoActions": ["create_notification", "update_calendar"]
}`
  },
  {
    name: 'Workflow mínimo',
    description: 'Estructura mínima completa de workflow',
    code: `{
  "code": "mi_workflow",
  "name": "Mi Workflow",
  "entityType": "REQUEST",
  "states": [
    { "code": "pending", "name": "Pendiente", "color": "amber", "isInitial": true },
    { "code": "approved", "name": "Aprobado", "color": "green", "isFinal": true }
  ],
  "transitions": [
    { "from": "pending", "to": "approved", "allowedRoles": ["ADMIN"], "requiresComment": true }
  ]
}`
  }
]
