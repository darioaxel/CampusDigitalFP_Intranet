/**
 * Tests de Integración para el Workflow: Alta de Nuevo Usuario
 * workflowCode: request_new_user
 */
import { describe, it, expect } from 'vitest'
import { requestNewUserWorkflowFixture, validateWorkflowStructure } from '../fixtures/workflows.fixture'
import type { Role } from '@prisma/client'

describe('Workflow: Alta de Nuevo Usuario (request_new_user)', () => {
  const fixture = requestNewUserWorkflowFixture()

  // ============================================
  // VALIDACIÓN DE ESTRUCTURA
  // ============================================
  describe('Estructura del Workflow', () => {
    it('debe tener una estructura válida', () => {
      const validation = validateWorkflowStructure(fixture)
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('debe tener exactamente 3 estados', () => {
      expect(fixture.states).toHaveLength(3)
    })

    it('debe tener el estado inicial: pending', () => {
      const initialState = fixture.states.find(s => s.isInitial)
      expect(initialState).toBeDefined()
      expect(initialState?.code).toBe('pending')
    })

    it('debe tener 2 estados finales: approved y rejected', () => {
      const finalStates = fixture.states.filter(s => s.isFinal)
      expect(finalStates).toHaveLength(2)
      
      const codes = finalStates.map(s => s.code)
      expect(codes).toContain('approved')
      expect(codes).toContain('rejected')
    })

    it('debe tener exactamente 2 transiciones', () => {
      expect(fixture.transitions).toHaveLength(2)
    })

    it('el estado rejected debe ser terminal (sin salida)', () => {
      const rejectedState = fixture.states.find(s => s.code === 'rejected')
      expect(rejectedState?.isTerminal).toBe(true)
      
      const outgoingTransitions = fixture.transitions.filter(
        t => t.fromStateId === rejectedState?.id
      )
      expect(outgoingTransitions).toHaveLength(0)
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

    it('PROFESOR no puede aprobar (sin permisos)', () => {
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

    it('debe ejecutar acción automática: create_notification', () => {
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
    it('ADMIN puede rechazar con comentario', () => {
      const { transitions } = fixture
      const pendingState = fixture.states.find(s => s.code === 'pending')!
      const rejectedState = fixture.states.find(s => s.code === 'rejected')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingState.id && t.toStateId === rejectedState.id
      )!

      const allowedRoles = JSON.parse(transition.allowedRoles)
      expect(allowedRoles).toContain('ADMIN')
    })

    it('debe requerir comentario obligatorio', () => {
      const { transitions } = fixture
      const pendingState = fixture.states.find(s => s.code === 'pending')!
      const rejectedState = fixture.states.find(s => s.code === 'rejected')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingState.id && t.toStateId === rejectedState.id
      )!

      expect(transition.requiresComment).toBe(true)
    })

    it('estado rejected es terminal', () => {
      const rejectedState = fixture.states.find(s => s.code === 'rejected')
      expect(rejectedState?.isTerminal).toBe(true)
      expect(rejectedState?.isFinal).toBe(true)
    })
  })

  // ============================================
  // FLUJO COMPLETO
  // ============================================
  describe('Flujo Completo', () => {
    it('flujo feliz: pending → approved', () => {
      const { workflow, states } = fixture
      
      const pendingState = states.find(s => s.code === 'pending')!
      const approvedState = states.find(s => s.code === 'approved')!

      // Verificar que existe transición directa
      const transition = fixture.transitions.find(
        t => t.fromStateId === pendingState.id && t.toStateId === approvedState.id
      )

      expect(transition).toBeDefined()
      expect(pendingState.isInitial).toBe(true)
      expect(approvedState.isFinal).toBe(true)
    })

    it('flujo alternativo: pending → rejected', () => {
      const { states } = fixture
      
      const pendingState = states.find(s => s.code === 'pending')!
      const rejectedState = states.find(s => s.code === 'rejected')!

      const transition = fixture.transitions.find(
        t => t.fromStateId === pendingState.id && t.toStateId === rejectedState.id
      )

      expect(transition).toBeDefined()
      expect(rejectedState.isTerminal).toBe(true)
    })

    it('no hay transición directa approved → rejected', () => {
      const { states } = fixture
      
      const approvedState = states.find(s => s.code === 'approved')!
      const rejectedState = states.find(s => s.code === 'rejected')!

      const transition = fixture.transitions.find(
        t => t.fromStateId === approvedState.id && t.toStateId === rejectedState.id
      )

      expect(transition).toBeUndefined()
    })
  })
})
