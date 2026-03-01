/**
 * Tests Unitarios para el WorkflowEngine
 * Prueba la lógica del motor de workflows
 * 
 * NOTA: Estos tests se enfocan en probar la estructura y validaciones
 * de los workflows. Las operaciones que requieren transacciones de base
 * de datos son testeadas en los tests de integración.
 */
import { describe, it, expect } from 'vitest'
import { WorkflowBuilder } from '../factories/workflow.factory'
import { 
  requestNewUserWorkflowFixture,
  freeDayWorkflowFixture, 
  sickLeaveWorkflowFixture,
  validateWorkflowStructure
} from '../fixtures/workflows.fixture'
import type { Role } from '@prisma/client'

describe('WorkflowEngine - Validaciones de Estructura', () => {
  
  // ============================================
  // VALIDACIÓN DE ESTRUCTURA DE WORKFLOWS
  // ============================================
  describe('Estructura de Workflows', () => {
    it('request_new_user tiene estructura válida', () => {
      const fixture = requestNewUserWorkflowFixture()
      const validation = validateWorkflowStructure(fixture)
      expect(validation.valid).toBe(true)
    })

    it('request_free_day tiene estructura válida', () => {
      const fixture = freeDayWorkflowFixture()
      const validation = validateWorkflowStructure(fixture)
      expect(validation.valid).toBe(true)
    })

    it('request_sick_leave tiene estructura válida', () => {
      const fixture = sickLeaveWorkflowFixture()
      const validation = validateWorkflowStructure(fixture)
      expect(validation.valid).toBe(true)
    })
  })

  // ============================================
  // VALIDACIÓN DE TRANSICIONES
  // ============================================
  describe('Validación de Transiciones', () => {
    it('debe requerir comentario cuando está configurado', () => {
      const fixture = requestNewUserWorkflowFixture()
      const { transitions, states } = fixture
      
      const pendingState = states.find(s => s.code === 'pending')!
      const approvedState = states.find(s => s.code === 'approved')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingState.id && t.toStateId === approvedState.id
      )!

      expect(transition.requiresComment).toBe(true)
    })

    it('debe permitir transición sin comentario cuando no está configurado', () => {
      const fixture = freeDayWorkflowFixture()
      const { transitions, states } = fixture
      
      const pendingState = states.find(s => s.code === 'pending')!
      const cancelledState = states.find(s => s.code === 'cancelled_by_user')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingState.id && t.toStateId === cancelledState.id
      )!

      expect(transition.requiresComment).toBe(false)
    })

    it('debe tener campos requeridos cuando están configurados', () => {
      const fixture = sickLeaveWorkflowFixture()
      const { transitions, states } = fixture
      
      const pendingValidation = states.find(s => s.code === 'pending_validation')!
      const validated = states.find(s => s.code === 'validated')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingValidation.id && t.toStateId === validated.id
      )!

      expect(transition.validatorCode).toBe('check_documents')
    })
  })

  // ============================================
  // VALIDACIÓN DE PERMISOS POR ROL
  // ============================================
  describe('Validación de Permisos por Rol', () => {
    it('ADMIN debe poder ejecutar transiciones de aprobación', () => {
      const fixture = requestNewUserWorkflowFixture()
      const { transitions, states } = fixture
      
      const pendingState = states.find(s => s.code === 'pending')!
      const approvedState = states.find(s => s.code === 'approved')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingState.id && t.toStateId === approvedState.id
      )!

      const allowedRoles = JSON.parse(transition.allowedRoles) as Role[]
      expect(allowedRoles).toContain('ADMIN')
    })

    it('PROFESOR no debe poder aprobar solicitudes', () => {
      const fixture = requestNewUserWorkflowFixture()
      const { transitions, states } = fixture
      
      const pendingState = states.find(s => s.code === 'pending')!
      const approvedState = states.find(s => s.code === 'approved')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingState.id && t.toStateId === approvedState.id
      )!

      const allowedRoles = JSON.parse(transition.allowedRoles) as Role[]
      expect(allowedRoles).not.toContain('PROFESOR')
    })

    it('PROFESOR solo debe poder cancelar sus solicitudes pendientes', () => {
      const fixture = freeDayWorkflowFixture()
      const { transitions, states } = fixture
      
      const pendingState = states.find(s => s.code === 'pending')!
      const cancelledState = states.find(s => s.code === 'cancelled_by_user')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingState.id && t.toStateId === cancelledState.id
      )!

      const allowedRoles = JSON.parse(transition.allowedRoles) as Role[]
      expect(allowedRoles).toContain('PROFESOR')
      
      // No debe haber otras transiciones desde pending que permita PROFESOR
      const otherTransitions = transitions.filter(
        t => t.fromStateId === pendingState.id && t.toStateId !== cancelledState.id
      )
      
      for (const t of otherTransitions) {
        const roles = JSON.parse(t.allowedRoles) as Role[]
        expect(roles).not.toContain('PROFESOR')
      }
    })
  })

  // ============================================
  // VALIDACIÓN DE ACCIONES AUTOMÁTICAS
  // ============================================
  describe('Validación de Acciones Automáticas', () => {
    it('debe crear notificación al aprobar', () => {
      const fixture = requestNewUserWorkflowFixture()
      const { transitions, states } = fixture
      
      const pendingState = states.find(s => s.code === 'pending')!
      const approvedState = states.find(s => s.code === 'approved')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingState.id && t.toStateId === approvedState.id
      )!

      const autoActions = JSON.parse(transition.autoActions || '[]')
      expect(autoActions).toContain('create_notification')
    })

    it('debe eliminar evento del calendario al cancelar aprobación', () => {
      const fixture = freeDayWorkflowFixture()
      const { transitions, states } = fixture
      
      const approvedState = states.find(s => s.code === 'approved')!
      const cancelledState = states.find(s => s.code === 'cancelled_by_user')!
      
      const transition = transitions.find(
        t => t.fromStateId === approvedState.id && t.toStateId === cancelledState.id
      )!

      const autoActions = JSON.parse(transition.autoActions || '[]')
      expect(autoActions).toContain('remove_calendar_event')
    })
  })

  // ============================================
  // VALIDACIÓN DE ESTADOS
  // ============================================
  describe('Validación de Estados', () => {
    it('debe tener exactamente un estado inicial', () => {
      const fixture = freeDayWorkflowFixture()
      const initialStates = fixture.states.filter(s => s.isInitial)
      expect(initialStates).toHaveLength(1)
    })

    it('debe tener al menos un estado final', () => {
      const fixture = freeDayWorkflowFixture()
      const finalStates = fixture.states.filter(s => s.isFinal)
      expect(finalStates.length).toBeGreaterThan(0)
    })

    it('estados terminales deben ser finales', () => {
      const fixture = requestNewUserWorkflowFixture()
      const terminalStates = fixture.states.filter(s => s.isTerminal)
      
      for (const state of terminalStates) {
        expect(state.isFinal).toBe(true)
      }
    })

    it('estado inicial no debe ser final', () => {
      const fixture = freeDayWorkflowFixture()
      const initialState = fixture.states.find(s => s.isInitial)
      expect(initialState?.isFinal).toBe(false)
    })
  })

  // ============================================
  // VALIDACIÓN DE FLUJOS COMPLETOS
  // ============================================
  describe('Validación de Flujos Completos', () => {
    it('flujo simple: pending → approved → final', () => {
      const fixture = requestNewUserWorkflowFixture()
      const { states, transitions } = fixture
      
      const pending = states.find(s => s.code === 'pending')!
      const approved = states.find(s => s.code === 'approved')!
      
      // Existe transición
      const transition = transitions.find(
        t => t.fromStateId === pending.id && t.toStateId === approved.id
      )
      expect(transition).toBeDefined()
      
      // Estados correctos
      expect(pending.isInitial).toBe(true)
      expect(approved.isFinal).toBe(true)
    })

    it('flujo con cancelación: pending → cancelled', () => {
      const fixture = freeDayWorkflowFixture()
      const { states, transitions } = fixture
      
      const pending = states.find(s => s.code === 'pending')!
      const cancelled = states.find(s => s.code === 'cancelled_by_user')!
      
      const transition = transitions.find(
        t => t.fromStateId === pending.id && t.toStateId === cancelled.id
      )
      
      expect(transition).toBeDefined()
      expect(cancelled.isTerminal).toBe(true)
    })

    it('flujo multi-paso: notified → pending_docs → pending_validation', () => {
      const fixture = sickLeaveWorkflowFixture()
      const { states, transitions } = fixture
      
      const notified = states.find(s => s.code === 'notified')!
      const pendingDocs = states.find(s => s.code === 'pending_docs')!
      const pendingValidation = states.find(s => s.code === 'pending_validation')!
      
      // notified → pending_docs
      const t1 = transitions.find(
        t => t.fromStateId === notified.id && t.toStateId === pendingDocs.id
      )
      expect(t1).toBeDefined()
      
      // pending_docs → pending_validation
      const t2 = transitions.find(
        t => t.fromStateId === pendingDocs.id && t.toStateId === pendingValidation.id
      )
      expect(t2).toBeDefined()
    })
  })
})
