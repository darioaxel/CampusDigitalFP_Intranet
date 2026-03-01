/**
 * Tests de Integración para el Workflow: Comunicación de Bajas
 * workflowCode: request_sick_leave
 */
import { describe, it, expect } from 'vitest'
import { sickLeaveWorkflowFixture, validateWorkflowStructure } from '../fixtures/workflows.fixture'
import type { Role } from '@prisma/client'

describe('Workflow: Comunicación de Bajas (request_sick_leave)', () => {
  const fixture = sickLeaveWorkflowFixture()

  // ============================================
  // VALIDACIÓN DE ESTRUCTURA
  // ============================================
  describe('Estructura del Workflow', () => {
    it('debe tener una estructura válida', () => {
      const validation = validateWorkflowStructure(fixture)
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('debe tener exactamente 6 estados', () => {
      expect(fixture.states).toHaveLength(6)
    })

    it('debe tener el estado inicial: pending_notification', () => {
      const initialState = fixture.states.find(s => s.isInitial)
      expect(initialState?.code).toBe('pending_notification')
    })

    it('debe tener secuencia lógica de estados', () => {
      const codes = fixture.states.map(s => ({ code: s.code, order: s.order }))
        .sort((a, b) => a.order - b.order)
        .map(s => s.code)

      expect(codes).toEqual([
        'pending_notification',
        'notified',
        'pending_docs',
        'pending_validation',
        'validated',
        'rejected'
      ])
    })

    it('debe tener 2 estados finales: validated y rejected', () => {
      const finalStates = fixture.states.filter(s => s.isFinal)
      expect(finalStates).toHaveLength(2)
      
      const codes = finalStates.map(s => s.code)
      expect(codes).toContain('validated')
      expect(codes).toContain('rejected')
    })

    it('solo rejected debe ser terminal', () => {
      const terminalStates = fixture.states.filter(s => s.isTerminal)
      expect(terminalStates).toHaveLength(1)
      expect(terminalStates[0].code).toBe('rejected')
    })

    it('debe tener exactamente 6 transiciones', () => {
      expect(fixture.transitions).toHaveLength(6)
    })
  })

  // ============================================
  // FLUJO: Pending Notification → Notified
  // ============================================
  describe('Transición: pending_notification → notified', () => {
    it('solo ADMIN y ROOT pueden notificar', () => {
      const { transitions, states } = fixture
      const fromState = states.find(s => s.code === 'pending_notification')!
      const toState = states.find(s => s.code === 'notified')!
      
      const transition = transitions.find(
        t => t.fromStateId === fromState.id && t.toStateId === toState.id
      )!

      const allowedRoles = JSON.parse(transition.allowedRoles)
      expect(allowedRoles).toEqual(['ADMIN', 'ROOT'])
    })

    it('no requiere comentario', () => {
      const { transitions, states } = fixture
      const fromState = states.find(s => s.code === 'pending_notification')!
      const toState = states.find(s => s.code === 'notified')!
      
      const transition = transitions.find(
        t => t.fromStateId === fromState.id && t.toStateId === toState.id
      )!

      expect(transition.requiresComment).toBe(false)
    })

    it('debe ejecutar create_notification', () => {
      const { transitions, states } = fixture
      const fromState = states.find(s => s.code === 'pending_notification')!
      const toState = states.find(s => s.code === 'notified')!
      
      const transition = transitions.find(
        t => t.fromStateId === fromState.id && t.toStateId === toState.id
      )!

      const autoActions = JSON.parse(transition.autoActions || '[]')
      expect(autoActions).toContain('create_notification')
    })
  })

  // ============================================
  // FLUJO: Notified → Pending Docs
  // ============================================
  describe('Transición: notified → pending_docs', () => {
    it('ADMIN, ROOT y PROFESOR pueden mover a espera de documentos', () => {
      const { transitions, states } = fixture
      const fromState = states.find(s => s.code === 'notified')!
      const toState = states.find(s => s.code === 'pending_docs')!
      
      const transition = transitions.find(
        t => t.fromStateId === fromState.id && t.toStateId === toState.id
      )!

      const allowedRoles = JSON.parse(transition.allowedRoles)
      expect(allowedRoles).toContain('ADMIN')
      expect(allowedRoles).toContain('ROOT')
      expect(allowedRoles).toContain('PROFESOR')
    })

    it('no requiere comentario', () => {
      const { transitions, states } = fixture
      const fromState = states.find(s => s.code === 'notified')!
      const toState = states.find(s => s.code === 'pending_docs')!
      
      const transition = transitions.find(
        t => t.fromStateId === fromState.id && t.toStateId === toState.id
      )!

      expect(transition.requiresComment).toBe(false)
    })
  })

  // ============================================
  // FLUJO: Pending Docs → Pending Validation
  // ============================================
  describe('Transición: pending_docs → pending_validation', () => {
    it('solo PROFESOR puede solicitar validación', () => {
      const { transitions, states } = fixture
      const fromState = states.find(s => s.code === 'pending_docs')!
      const toState = states.find(s => s.code === 'pending_validation')!
      
      const transition = transitions.find(
        t => t.fromStateId === fromState.id && t.toStateId === toState.id
      )!

      const allowedRoles = JSON.parse(transition.allowedRoles)
      expect(allowedRoles).toEqual(['PROFESOR'])
    })

    it('es la única transición exclusiva de PROFESOR', () => {
      const profesorTransitions = fixture.transitions.filter(t => {
        const roles = JSON.parse(t.allowedRoles) as Role[]
        return roles.includes('PROFESOR') && 
               !roles.includes('ADMIN') && 
               !roles.includes('ROOT')
      })

      expect(profesorTransitions).toHaveLength(1)
      
      const toState = fixture.states.find(s => s.id === profesorTransitions[0].toStateId)
      expect(toState?.code).toBe('pending_validation')
    })
  })

  // ============================================
  // FLUJO: Pending Validation → Validated
  // ============================================
  describe('Transición: pending_validation → validated', () => {
    it('solo ADMIN y ROOT pueden validar', () => {
      const { transitions, states } = fixture
      const fromState = states.find(s => s.code === 'pending_validation')!
      const toState = states.find(s => s.code === 'validated')!
      
      const transition = transitions.find(
        t => t.fromStateId === fromState.id && t.toStateId === toState.id
      )!

      const allowedRoles = JSON.parse(transition.allowedRoles)
      expect(allowedRoles).toEqual(['ADMIN', 'ROOT'])
    })

    it('requiere comentario obligatorio', () => {
      const { transitions, states } = fixture
      const fromState = states.find(s => s.code === 'pending_validation')!
      const toState = states.find(s => s.code === 'validated')!
      
      const transition = transitions.find(
        t => t.fromStateId === fromState.id && t.toStateId === toState.id
      )!

      expect(transition.requiresComment).toBe(true)
    })

    it('tiene validador de documentos: check_documents', () => {
      const { transitions, states } = fixture
      const fromState = states.find(s => s.code === 'pending_validation')!
      const toState = states.find(s => s.code === 'validated')!
      
      const transition = transitions.find(
        t => t.fromStateId === fromState.id && t.toStateId === toState.id
      )!

      expect(transition.validatorCode).toBe('check_documents')
    })

    it('debe ejecutar create_notification', () => {
      const { transitions, states } = fixture
      const fromState = states.find(s => s.code === 'pending_validation')!
      const toState = states.find(s => s.code === 'validated')!
      
      const transition = transitions.find(
        t => t.fromStateId === fromState.id && t.toStateId === toState.id
      )!

      const autoActions = JSON.parse(transition.autoActions || '[]')
      expect(autoActions).toContain('create_notification')
    })
  })

  // ============================================
  // FLUJO: Pending Validation → Pending Docs (Devolución)
  // ============================================
  describe('Transición: pending_validation → pending_docs (devolución)', () => {
    it('ADMIN puede devolver para corregir documentación', () => {
      const { transitions, states } = fixture
      const fromState = states.find(s => s.code === 'pending_validation')!
      const toState = states.find(s => s.code === 'pending_docs')!
      
      const transition = transitions.find(
        t => t.fromStateId === fromState.id && t.toStateId === toState.id
      )!

      const allowedRoles = JSON.parse(transition.allowedRoles)
      expect(allowedRoles).toContain('ADMIN')
    })

    it('requiere comentario explicando la devolución', () => {
      const { transitions, states } = fixture
      const fromState = states.find(s => s.code === 'pending_validation')!
      const toState = states.find(s => s.code === 'pending_docs')!
      
      const transition = transitions.find(
        t => t.fromStateId === fromState.id && t.toStateId === toState.id
      )!

      expect(transition.requiresComment).toBe(true)
    })

    it('permite ciclo: docs → validation → docs', () => {
      const { transitions, states } = fixture
      const pendingDocs = states.find(s => s.code === 'pending_docs')!
      const pendingValidation = states.find(s => s.code === 'pending_validation')!

      // docs → validation
      const forward = transitions.find(
        t => t.fromStateId === pendingDocs.id && t.toStateId === pendingValidation.id
      )

      // validation → docs
      const backward = transitions.find(
        t => t.fromStateId === pendingValidation.id && t.toStateId === pendingDocs.id
      )

      expect(forward).toBeDefined()
      expect(backward).toBeDefined()
    })
  })

  // ============================================
  // FLUJO: Pending Validation → Rejected
  // ============================================
  describe('Transición: pending_validation → rejected', () => {
    it('solo ADMIN y ROOT pueden rechazar', () => {
      const { transitions, states } = fixture
      const fromState = states.find(s => s.code === 'pending_validation')!
      const toState = states.find(s => s.code === 'rejected')!
      
      const transition = transitions.find(
        t => t.fromStateId === fromState.id && t.toStateId === toState.id
      )!

      const allowedRoles = JSON.parse(transition.allowedRoles)
      expect(allowedRoles).toEqual(['ADMIN', 'ROOT'])
    })

    it('requiere comentario obligatorio', () => {
      const { transitions, states } = fixture
      const fromState = states.find(s => s.code === 'pending_validation')!
      const toState = states.find(s => s.code === 'rejected')!
      
      const transition = transitions.find(
        t => t.fromStateId === fromState.id && t.toStateId === toState.id
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
  // VALIDADOR: check_documents
  // ============================================
  describe('Validador: check_documents', () => {
    it('debe existir la configuración del validador check_documents', () => {
      const { transitions, states } = fixture
      const pendingValidation = states.find(s => s.code === 'pending_validation')!
      const validated = states.find(s => s.code === 'validated')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingValidation.id && t.toStateId === validated.id
      )!

      expect(transition.validatorCode).toBe('check_documents')
    })

    it('el validador check_documents está configurado para verificar documentos adjuntos', () => {
      const { transitions, states } = fixture
      const pendingValidation = states.find(s => s.code === 'pending_validation')!
      const validated = states.find(s => s.code === 'validated')!
      
      const transition = transitions.find(
        t => t.fromStateId === pendingValidation.id && t.toStateId === validated.id
      )!

      // Este validador verifica que existan documentos antes de aprobar
      expect(transition.validatorCode).toBe('check_documents')
      expect(transition.requiresComment).toBe(true)
    })
  })

  // ============================================
  // FLUJOS COMPLETOS
  // ============================================
  describe('Flujos Completos', () => {
    it('flujo feliz completo', () => {
      const states = fixture.states
      const transitions = fixture.transitions

      // Secuencia esperada
      const sequence = [
        'pending_notification',
        'notified',
        'pending_docs',
        'pending_validation',
        'validated'
      ]

      // Verificar que existe transición entre cada par consecutivo
      for (let i = 0; i < sequence.length - 1; i++) {
        const fromState = states.find(s => s.code === sequence[i])!
        const toState = states.find(s => s.code === sequence[i + 1])!
        
        const transition = transitions.find(
          t => t.fromStateId === fromState.id && t.toStateId === toState.id
        )

        expect(transition).toBeDefined()
      }
    })

    it('flujo con devolución de documentación', () => {
      const states = fixture.states
      const transitions = fixture.transitions

      // pending_validation → pending_docs → pending_validation
      const pendingValidation = states.find(s => s.code === 'pending_validation')!
      const pendingDocs = states.find(s => s.code === 'pending_docs')!

      const validationToDocs = transitions.find(
        t => t.fromStateId === pendingValidation.id && t.toStateId === pendingDocs.id
      )
      const docsToValidation = transitions.find(
        t => t.fromStateId === pendingDocs.id && t.toStateId === pendingValidation.id
      )

      expect(validationToDocs).toBeDefined()
      expect(docsToValidation).toBeDefined()
    })

    it('flujo de rechazo desde validación', () => {
      const states = fixture.states
      const transitions = fixture.transitions

      const pendingValidation = states.find(s => s.code === 'pending_validation')!
      const rejected = states.find(s => s.code === 'rejected')!

      const transition = transitions.find(
        t => t.fromStateId === pendingValidation.id && t.toStateId === rejected.id
      )

      expect(transition).toBeDefined()
      expect(rejected.isTerminal).toBe(true)
    })

    it('no hay transición directa desde inicial a rechazado', () => {
      const states = fixture.states
      const transitions = fixture.transitions

      const pendingNotification = states.find(s => s.code === 'pending_notification')!
      const rejected = states.find(s => s.code === 'rejected')!

      const transition = transitions.find(
        t => t.fromStateId === pendingNotification.id && t.toStateId === rejected.id
      )

      expect(transition).toBeUndefined()
    })
  })

  // ============================================
  // PERMISOS POR ROL
  // ============================================
  describe('Permisos por Rol', () => {
    it('ADMIN tiene acceso a 5 de 6 transiciones (excepto pending_docs → pending_validation)', () => {
      const adminTransitions = fixture.transitions.filter(t => {
        const roles = JSON.parse(t.allowedRoles) as Role[]
        return roles.includes('ADMIN')
      })

      // ADMIN tiene acceso a todas excepto la transición exclusiva de PROFESOR
      expect(adminTransitions).toHaveLength(5)
    })

    it('ROOT tiene acceso a 5 de 6 transiciones (excepto pending_docs → pending_validation)', () => {
      const rootTransitions = fixture.transitions.filter(t => {
        const roles = JSON.parse(t.allowedRoles) as Role[]
        return roles.includes('ROOT')
      })

      // ROOT tiene acceso a todas excepto la transición exclusiva de PROFESOR
      expect(rootTransitions).toHaveLength(5)
    })

    it('PROFESOR tiene acceso limitado', () => {
      const profesorTransitions = fixture.transitions.filter(t => {
        const roles = JSON.parse(t.allowedRoles) as Role[]
        return roles.includes('PROFESOR')
      })

      // PROFESOR solo puede: notified→pending_docs y pending_docs→pending_validation
      expect(profesorTransitions).toHaveLength(2)
    })

    it('USER no tiene acceso a ninguna transición', () => {
      const userTransitions = fixture.transitions.filter(t => {
        const roles = JSON.parse(t.allowedRoles) as Role[]
        return roles.includes('USER')
      })

      expect(userTransitions).toHaveLength(0)
    })
  })
})
