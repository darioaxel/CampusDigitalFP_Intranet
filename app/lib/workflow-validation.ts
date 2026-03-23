// app/lib/workflow-validation.ts
// Validación de workflows JSON (esquema Zod + validación semántica)

import { z } from 'zod'
import type {
  WorkflowDefinitionJson,
  WorkflowValidationResult,
  WorkflowValidationError
} from '~/types/workflow-editor'
import {
  WORKFLOW_STATE_COLORS,
  WORKFLOW_ROLES,
  WORKFLOW_AUTO_ACTIONS,
  WORKFLOW_VALIDATORS
} from '~/types/workflow-editor'

// ========================================
// SCHEMAS ZOD
// ========================================

const workflowStateSchema = z.object({
  code: z.string()
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(50, 'El código no puede tener más de 50 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Solo minúsculas, números y guiones bajos'),
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede tener más de 100 caracteres'),
  color: z.enum(WORKFLOW_STATE_COLORS).optional().default('gray'),
  order: z.number().int().min(0).optional(),
  isInitial: z.boolean().optional().default(false),
  isFinal: z.boolean().optional().default(false),
  isTerminal: z.boolean().optional().default(false),
  config: z.record(z.any()).optional()
})

const workflowTransitionSchema = z.object({
  from: z.string().min(1, 'El estado origen es obligatorio'),
  to: z.string().min(1, 'El estado destino es obligatorio'),
  allowedRoles: z.array(z.enum(WORKFLOW_ROLES))
    .min(1, 'Debe especificar al menos un rol permitido'),
  requiresComment: z.boolean().optional().default(false),
  requiresFields: z.array(z.string()).optional(),
  autoActions: z.array(z.enum(WORKFLOW_AUTO_ACTIONS.map(a => a.code) as [string, ...string[]])).optional(),
  validatorCode: z.enum(WORKFLOW_VALIDATORS.map(v => v.code) as [string, ...string[]]).optional()
})

export const workflowDefinitionSchema = z.object({
  code: z.string()
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(50, 'El código no puede tener más de 50 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Solo minúsculas, números y guiones bajos'),
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede tener más de 100 caracteres'),
  description: z.string().max(500, 'La descripción no puede tener más de 500 caracteres').optional(),
  entityType: z.enum(['REQUEST', 'TASK']),
  version: z.number().int().min(1).optional().default(1),
  isActive: z.boolean().optional().default(true),
  states: z.array(workflowStateSchema)
    .min(2, 'El workflow debe tener al menos 2 estados')
    .max(20, 'El workflow no puede tener más de 20 estados'),
  transitions: z.array(workflowTransitionSchema)
    .min(1, 'El workflow debe tener al menos 1 transición')
})

// ========================================
// VALIDACIÓN SEMÁNTICA
// ========================================

export function validateWorkflowSemantics(
  workflow: WorkflowDefinitionJson
): WorkflowValidationResult {
  const errors: WorkflowValidationError[] = []

  // 1. Verificar que hay exactamente un estado inicial
  const initialStates = workflow.states.filter(s => s.isInitial)
  if (initialStates.length === 0) {
    errors.push({
      path: 'states',
      message: 'Debe haber exactamente un estado inicial (isInitial: true)',
      severity: 'error'
    })
  } else if (initialStates.length > 1) {
    errors.push({
      path: 'states',
      message: `Hay ${initialStates.length} estados iniciales. Solo debe haber uno.`,
      severity: 'error'
    })
  }

  // 2. Verificar que hay al menos un estado final
  const finalStates = workflow.states.filter(s => s.isFinal)
  if (finalStates.length === 0) {
    errors.push({
      path: 'states',
      message: 'Debe haber al menos un estado final (isFinal: true)',
      severity: 'error'
    })
  }

  // 3. Verificar códigos de estados únicos
  const stateCodes = workflow.states.map(s => s.code)
  const duplicateCodes = stateCodes.filter((code, index) => stateCodes.indexOf(code) !== index)
  if (duplicateCodes.length > 0) {
    errors.push({
      path: 'states',
      message: `Códigos de estado duplicados: ${[...new Set(duplicateCodes)].join(', ')}`,
      severity: 'error'
    })
  }

  // 4. Verificar que las transiciones referencian estados existentes
  const validStateCodes = new Set(stateCodes)
  workflow.transitions.forEach((trans, index) => {
    if (!validStateCodes.has(trans.from)) {
      errors.push({
        path: `transitions[${index}]`,
        message: `El estado origen "${trans.from}" no existe`,
        severity: 'error'
      })
    }
    if (!validStateCodes.has(trans.to)) {
      errors.push({
        path: `transitions[${index}]`,
        message: `El estado destino "${trans.to}" no existe`,
        severity: 'error'
      })
    }
  })

  // 5. Verificar transiciones duplicadas
  const transitionKeys = workflow.transitions.map(t => `${t.from}->${t.to}`)
  const duplicateTransitions = transitionKeys.filter((key, index) =>
    transitionKeys.indexOf(key) !== index
  )
  if (duplicateTransitions.length > 0) {
    errors.push({
      path: 'transitions',
      message: `Transiciones duplicadas: ${[...new Set(duplicateTransitions)].join(', ')}`,
      severity: 'error'
    })
  }

  // 6. Verificar que todos los estados (excepto terminales) tienen al menos una transición saliente
  const terminalStates = new Set(workflow.states.filter(s => s.isTerminal).map(s => s.code))
  const statesWithOutgoingTrans = new Set(workflow.transitions.map(t => t.from))

  workflow.states.forEach(state => {
    if (!state.isTerminal && !statesWithOutgoingTrans.has(state.code)) {
      errors.push({
        path: `states.${state.code}`,
        message: `El estado "${state.code}" no tiene transiciones salientes (debería ser terminal o añadir transiciones)`,
        severity: 'warning'
      })
    }
  })

  // 7. Verificar que todos los estados (excepto inicial) tienen al menos una transición entrante
  const initialStateCode = workflow.states.find(s => s.isInitial)?.code
  const statesWithIncomingTrans = new Set(workflow.transitions.map(t => t.to))

  workflow.states.forEach(state => {
    if (state.code !== initialStateCode && !statesWithIncomingTrans.has(state.code)) {
      errors.push({
        path: `states.${state.code}`,
        message: `El estado "${state.code}" no tiene transiciones entrantes (no es alcanzable)`,
        severity: 'warning'
      })
    }
  })

  // 8. Advertir si hay estados inalcanzables desde el inicial
  const reachableStates = getReachableStates(workflow)
  workflow.states.forEach(state => {
    if (!reachableStates.has(state.code)) {
      errors.push({
        path: `states.${state.code}`,
        message: `El estado "${state.code}" no es alcanzable desde el estado inicial`,
        severity: 'warning'
      })
    }
  })

  // 9. Advertir si hay estados finales que no son terminales y no tienen salida
  workflow.states
    .filter(s => s.isFinal && !s.isTerminal)
    .forEach(state => {
      const hasOutgoing = workflow.transitions.some(t => t.from === state.code)
      if (hasOutgoing) {
        errors.push({
          path: `states.${state.code}`,
          message: `El estado "${state.code}" es final pero tiene transiciones salientes`,
          severity: 'warning'
        })
      }
    })

  return {
    valid: !errors.some(e => e.severity === 'error'),
    errors
  }
}

// ========================================
// UTILIDADES
// ========================================

function getReachableStates(workflow: WorkflowDefinitionJson): Set<string> {
  const initialState = workflow.states.find(s => s.isInitial)
  if (!initialState) return new Set()

  const reachable = new Set<string>()
  const toVisit = [initialState.code]

  while (toVisit.length > 0) {
    const current = toVisit.pop()!
    if (reachable.has(current)) continue

    reachable.add(current)

    // Encontrar estados alcanzables desde el actual
    workflow.transitions
      .filter(t => t.from === current)
      .forEach(t => {
        if (!reachable.has(t.to)) {
          toVisit.push(t.to)
        }
      })
  }

  return reachable
}

// ========================================
// VALIDACIÓN COMPLETA
// ========================================

export function validateWorkflowJson(jsonString: string): {
  valid: boolean
  data?: WorkflowDefinitionJson
  errors: WorkflowValidationError[]
  parseError?: string
} {
  // 1. Parsear JSON
  let data: any
  try {
    data = JSON.parse(jsonString)
  } catch (e: any) {
    return {
      valid: false,
      errors: [{
        path: '',
        message: `Error de sintaxis JSON: ${e.message}`,
        severity: 'error'
      }],
      parseError: e.message
    }
  }

  // 2. Validar con Zod
  const zodResult = workflowDefinitionSchema.safeParse(data)
  if (!zodResult.success) {
    const zodErrors: WorkflowValidationError[] = zodResult.error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
      severity: 'error'
    }))

    return {
      valid: false,
      data,
      errors: zodErrors
    }
  }

  // 3. Validación semántica
  const semanticValidation = validateWorkflowSemantics(zodResult.data)

  return {
    valid: semanticValidation.valid,
    data: zodResult.data,
    errors: semanticValidation.errors
  }
}

// ========================================
// FORMATEAR JSON
// ========================================

export function formatWorkflowJson(json: WorkflowDefinitionJson): string {
  return JSON.stringify(json, null, 2)
}

// ========================================
// CONVERTIR WORKFLOW DE BD A JSON
// ========================================

export function workflowDbToJson(dbWorkflow: any): WorkflowDefinitionJson {
  return {
    code: dbWorkflow.code,
    name: dbWorkflow.name,
    description: dbWorkflow.description || undefined,
    entityType: dbWorkflow.entityType,
    version: dbWorkflow.version,
    isActive: dbWorkflow.isActive,
    states: dbWorkflow.states.map((s: any) => ({
      code: s.code,
      name: s.name,
      color: s.color,
      order: s.order,
      isInitial: s.isInitial,
      isFinal: s.isFinal,
      isTerminal: s.isTerminal,
      config: s.config ? JSON.parse(s.config) : undefined
    })),
    transitions: dbWorkflow.transitions.map((t: any) => ({
      from: t.fromState.code,
      to: t.toState.code,
      allowedRoles: JSON.parse(t.allowedRoles),
      requiresComment: t.requiresComment,
      requiresFields: t.requiresFields ? JSON.parse(t.requiresFields) : undefined,
      autoActions: t.autoActions ? JSON.parse(t.autoActions) : undefined,
      validatorCode: t.validatorCode || undefined
    }))
  }
}
