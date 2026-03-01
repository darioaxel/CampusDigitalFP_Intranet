/**
 * Tests de Integración para el Workflow: Día Libre Disposición
 * workflowCode: request_free_day
 */
import { describe, it, expect } from 'vitest'
import { freeDayWorkflowFixture, validateWorkflowStructure } from '../fixtures/workflows.fixture'
import type { Role } from '@prisma/client'

describe('Workflow: Día Libre Disposición (request_free_day)', () => {
  const fixture = freeDayWorkflowFixture()

  // ============================================
  // VALIDACIÓN DE ESTRUCTURA
  // ============================================
  describe('Estructura del Workflow', () => {
    it('debe tener una estructura válida', () => {
      const validation = validateWorkflowStructure(fixture)
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('debe tener exactamente 4 estados', () => {
      expect(fixture.states).toHaveLength(4)
    })

    it('debe tener el estado inicial: pending', () => {
      const initialState = fixture.states.find(s => s.isInitial)
      expect(initialState?.code).toBe('pending')
    })

    it('debe tener 3 estados finales', () => {
      const finalStates = fixture.states.filter(s => s.isFinal)
      expect(finalStates).toHaveLength(3)
      
      const codes = finalStates.map(s => s.code)
      expect(codes).toContain('approved')
      expect(codes).toContain('rejected')
      expect(codes).toContain('cancelled_by_user')
    })

    it('debe tener 2 estados terminales', () => {
      const terminalStates = fixture.states.filter(s => s.isTerminal)
      expect(terminalStates).toHaveLength(2)
      
      const codes = terminalStates.map(s => s.code)
      expect(codes).toContain('rejected')
      expect(codes).toContain('cancelled_by_user')
    })

    it('debe tener exactamente 4 transiciones', () => {
      expect(fixture.transitions).toHaveLength(4)
    })
  })

  // ============================================
  // FLUJO: Pending → Approved
  // ============================================
  describe('Transición: pending → approved', () => {
    it('ADMIN puede aprobar', () => {
      const { transitions } = fixture
      const pendingState = fixture.states.find(s => s.code === 'pending')!
      const approvedState = fixture.states.find(s => s.code === 'approved')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingState.id && t.toStateId === approvedState.id
      )!

      const allowedRoles = JSON.parse(transition.allowedRoles)
      expect(allowedRoles).toContain('ADMIN')
    })

    it('ROOT puede aprobar', () => {
      const { transitions } = fixture
      const pendingState = fixture.states.find(s => s.code === 'pending')!
      const approvedState = fixture.states.find(s => s.code === 'approved')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingState.id && t.toStateId === approvedState.id
      )!

      const allowedRoles = JSON.parse(transition.allowedRoles)
      expect(allowedRoles).toContain('ROOT')
    })

    it('PROFESOR no puede aprobar', () => {
      const { transitions } = fixture
      const pendingState = fixture.states.find(s => s.code === 'pending')!
      const approvedState = fixture.states.find(s => s.code === 'approved')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingState.id && t.toStateId === approvedState.id
      )!

      const allowedRoles = JSON.parse(transition.allowedRoles)
      expect(allowedRoles).not.toContain('PROFESOR')
    })

    it('debe requerir comentario obligatorio', () => {
      const { transitions } = fixture
      const pendingState = fixture.states.find(s => s.code === 'pending')!
      const approvedState = fixture.states.find(s => s.code === 'approved')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingState.id && t.toStateId === approvedState.id
      )!

      expect(transition.requiresComment).toBe(true)
    })

    it('debe ejecutar create_notification', () => {
      const { transitions } = fixture
      const pendingState = fixture.states.find(s => s.code === 'pending')!
      const approvedState = fixture.states.find(s => s.code === 'approved')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingState.id && t.toStateId === approvedState.id
      )!

      const autoActions = JSON.parse(transition.autoActions || '[]')
      expect(autoActions).toContain('create_notification')
    })
  })

  // ============================================
  // FLUJO: Pending → Rejected
  // ============================================
  describe('Transición: pending → rejected', () => {
    it('solo ADMIN y ROOT pueden rechazar', () => {
      const { transitions } = fixture
      const pendingState = fixture.states.find(s => s.code === 'pending')!
      const rejectedState = fixture.states.find(s => s.code === 'rejected')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingState.id && t.toStateId === rejectedState.id
      )!

      const allowedRoles = JSON.parse(transition.allowedRoles)
      expect(allowedRoles).toEqual(['ADMIN', 'ROOT'])
    })

    it('estado rejected es terminal', () => {
      const rejectedState = fixture.states.find(s => s.code === 'rejected')
      expect(rejectedState?.isTerminal).toBe(true)
    })
  })

  // ============================================
  // FLUJO: Pending → Cancelled by User
  // ============================================
  describe('Transición: pending → cancelled_by_user', () => {
    it('cualquier usuario puede cancelar su propia solicitud', () => {
      const { transitions } = fixture
      const pendingState = fixture.states.find(s => s.code === 'pending')!
      const cancelledState = fixture.states.find(s => s.code === 'cancelled_by_user')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingState.id && t.toStateId === cancelledState.id
      )!

      const allowedRoles = JSON.parse(transition.allowedRoles)
      expect(allowedRoles).toContain('PROFESOR')
      expect(allowedRoles).toContain('EXPERTO')
      expect(allowedRoles).toContain('JEFE_DEPT')
      expect(allowedRoles).toContain('ADMIN')
      expect(allowedRoles).toContain('ROOT')
    })

    it('no requiere comentario', () => {
      const { transitions } = fixture
      const pendingState = fixture.states.find(s => s.code === 'pending')!
      const cancelledState = fixture.states.find(s => s.code === 'cancelled_by_user')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingState.id && t.toStateId === cancelledState.id
      )!

      expect(transition.requiresComment).toBe(false)
    })

    it('debe ejecutar create_notification', () => {
      const { transitions } = fixture
      const pendingState = fixture.states.find(s => s.code === 'pending')!
      const cancelledState = fixture.states.find(s => s.code === 'cancelled_by_user')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingState.id && t.toStateId === cancelledState.id
      )!

      const autoActions = JSON.parse(transition.autoActions || '[]')
      expect(autoActions).toContain('create_notification')
    })

    it('estado cancelled es terminal', () => {
      const cancelledState = fixture.states.find(s => s.code === 'cancelled_by_user')
      expect(cancelledState?.isTerminal).toBe(true)
    })
  })

  // ============================================
  // FLUJO: Approved → Cancelled by User
  // ============================================
  describe('Transición: approved → cancelled_by_user', () => {
    it('cualquier usuario puede cancelar una solicitud aprobada', () => {
      const { transitions } = fixture
      const approvedState = fixture.states.find(s => s.code === 'approved')!
      const cancelledState = fixture.states.find(s => s.code === 'cancelled_by_user')!
      
      const transition = transitions.find(
        t => t.fromStateId === approvedState.id && t.toStateId === cancelledState.id
      )!

      const allowedRoles = JSON.parse(transition.allowedRoles)
      expect(allowedRoles).toContain('PROFESOR')
      expect(allowedRoles).toContain('EXPERTO')
      expect(allowedRoles).toContain('JEFE_DEPT')
    })

    it('no requiere comentario para cancelar', () => {
      const { transitions } = fixture
      const approvedState = fixture.states.find(s => s.code === 'approved')!
      const cancelledState = fixture.states.find(s => s.code === 'cancelled_by_user')!
      
      const transition = transitions.find(
        t => t.fromStateId === approvedState.id && t.toStateId === cancelledState.id
      )!

      expect(transition.requiresComment).toBe(false)
    })

    it('debe ejecutar create_notification y remove_calendar_event', () => {
      const { transitions } = fixture
      const approvedState = fixture.states.find(s => s.code === 'approved')!
      const cancelledState = fixture.states.find(s => s.code === 'cancelled_by_user')!
      
      const transition = transitions.find(
        t => t.fromStateId === approvedState.id && t.toStateId === cancelledState.id
      )!

      const autoActions = JSON.parse(transition.autoActions || '[]')
      expect(autoActions).toContain('create_notification')
      expect(autoActions).toContain('remove_calendar_event')
    })

    it('la cancelación de approved requiere eliminar evento del calendario (configuración)', () => {
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
  // VALIDACIONES DE PERMISOS
  // ============================================
  describe('Validaciones de Permisos', () => {
    it('USER básico no puede realizar ninguna transición', () => {
      const allowedRolesInWorkflow = new Set<Role>()
      
      for (const transition of fixture.transitions) {
        const roles = JSON.parse(transition.allowedRoles) as Role[]
        roles.forEach(r => allowedRolesInWorkflow.add(r))
      }

      expect(allowedRolesInWorkflow.has('USER' as Role)).toBe(false)
    })

    it('PROFESOR solo puede cancelar (pending → cancelled)', () => {
      const profesorAllowedTransitions = fixture.transitions.filter(t => {
        const roles = JSON.parse(t.allowedRoles) as Role[]
        return roles.includes('PROFESOR')
      })

      expect(profesorAllowedTransitions).toHaveLength(2)
      
      // Solo transiciones hacia cancelled_by_user
      for (const t of profesorAllowedTransitions) {
        const toState = fixture.states.find(s => s.id === t.toStateId)
        expect(toState?.code).toBe('cancelled_by_user')
      }
    })
  })

  // ============================================
  // FLUJOS COMPLETOS
  // ============================================
  describe('Flujos Completos', () => {
    it('flujo feliz: pending → approved', () => {
      const pending = fixture.states.find(s => s.code === 'pending')!
      const approved = fixture.states.find(s => s.code === 'approved')!
      
      const transition = fixture.transitions.find(
        t => t.fromStateId === pending.id && t.toStateId === approved.id
      )

      expect(transition).toBeDefined()
      expect(pending.isInitial).toBe(true)
      expect(approved.isFinal).toBe(true)
      expect(approved.isTerminal).toBe(false) // Se puede cancelar después
    })

    it('flujo de rechazo: pending → rejected', () => {
      const pending = fixture.states.find(s => s.code === 'pending')!
      const rejected = fixture.states.find(s => s.code === 'rejected')!
      
      const transition = fixture.transitions.find(
        t => t.fromStateId === pending.id && t.toStateId === rejected.id
      )

      expect(transition).toBeDefined()
      expect(rejected.isTerminal).toBe(true)
    })

    it('cancelación pendiente: pending → cancelled_by_user', () => {
      const pending = fixture.states.find(s => s.code === 'pending')!
      const cancelled = fixture.states.find(s => s.code === 'cancelled_by_user')!
      
      const transition = fixture.transitions.find(
        t => t.fromStateId === pending.id && t.toStateId === cancelled.id
      )

      expect(transition).toBeDefined()
    })

    it('cancelación post-aprobación: approved → cancelled_by_user', () => {
      const approved = fixture.states.find(s => s.code === 'approved')!
      const cancelled = fixture.states.find(s => s.code === 'cancelled_by_user')!
      
      const transition = fixture.transitions.find(
        t => t.fromStateId === approved.id && t.toStateId === cancelled.id
      )

      expect(transition).toBeDefined()
    })

    it('no hay transición directa rejected → approved', () => {
      const rejected = fixture.states.find(s => s.code === 'rejected')!
      const approved = fixture.states.find(s => s.code === 'approved')!
      
      const transition = fixture.transitions.find(
        t => t.fromStateId === rejected.id && t.toStateId === approved.id
      )

      expect(transition).toBeUndefined()
    })
  })
})
