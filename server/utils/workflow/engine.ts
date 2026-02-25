// server/utils/workflow/engine.ts
// Motor de workflows configurable (data-driven)
// Compatible con el sistema legado de stateMachine.ts

import { prisma } from '../../utils/db'
import type { 
  UserRole, 
  WorkflowDefinition, 
  WorkflowState, 
  WorkflowTransition,
  Task,
  Request
} from '@prisma/client'

// ============================================
// TIPOS
// ============================================

export interface TransitionContext {
  entityId: string
  entityType: 'TASK' | 'REQUEST'
  toStateCode: string
  actorId: string
  actorRole: UserRole
  comment?: string
  metadata?: Record<string, any>
}

export interface TransitionResult {
  success: boolean
  error?: string
  newState?: WorkflowState
  previousState?: WorkflowState
}

export interface AvailableTransition {
  id: string
  fromState: WorkflowState
  toState: WorkflowState
  requiresComment: boolean
  requiresFields?: string[]
  autoActions?: string[]
}

// ============================================
// MOTOR DE WORKFLOW
// ============================================

export class WorkflowEngine {
  
  /**
   * Obtiene las transiciones disponibles para una entidad
   */
  async getAvailableTransitions(
    entityId: string, 
    entityType: 'TASK' | 'REQUEST',
    userRole: UserRole
  ): Promise<AvailableTransition[]> {
    const entity = await this.getEntityWithWorkflow(entityId, entityType)
    
    if (!entity) {
      throw new Error(`${entityType} no encontrada`)
    }

    // Si no tiene workflow configurable, usar sistema legado
    if (!entity.workflow) {
      return []
    }

    const transitions = await prisma.workflowTransition.findMany({
      where: {
        workflowId: entity.workflowId!,
        fromStateId: entity.currentStateId!,
        allowedRoles: { contains: userRole }
      },
      include: {
        fromState: true,
        toState: true
      }
    })

    return transitions.map(t => ({
      id: t.id,
      fromState: t.fromState,
      toState: t.toState,
      requiresComment: t.requiresComment,
      requiresFields: t.requiresFields ? JSON.parse(t.requiresFields) : undefined,
      autoActions: t.autoActions ? JSON.parse(t.autoActions) : undefined
    }))
  }

  /**
   * Valida si una transición es permitida
   */
  async validateTransition(context: TransitionContext): Promise<TransitionResult> {
    const { entityId, entityType, toStateCode, actorRole } = context
    
    const entity = await this.getEntityWithWorkflow(entityId, entityType)
    
    if (!entity) {
      return { success: false, error: `${entityType} no encontrada` }
    }

    // Si no tiene workflow configurable, rechazar (usar sistema legado)
    if (!entity.workflow) {
      return { 
        success: false, 
        error: 'Esta entidad usa el sistema de workflow legado' 
      }
    }

    // Buscar estado destino
    const targetState = await prisma.workflowState.findFirst({
      where: {
        workflowId: entity.workflowId!,
        code: toStateCode
      }
    })

    if (!targetState) {
      return { success: false, error: `Estado '${toStateCode}' no existe en este workflow` }
    }

    // Buscar transición válida
    const transition = await prisma.workflowTransition.findFirst({
      where: {
        workflowId: entity.workflowId!,
        fromStateId: entity.currentStateId!,
        toStateId: targetState.id,
        allowedRoles: { contains: actorRole }
      },
      include: {
        fromState: true,
        toState: true
      }
    })

    if (!transition) {
      return {
        success: false,
        error: `Transición no permitida: ${entity.currentState?.code || 'unknown'} → ${toStateCode}`
      }
    }

    // Validar comentario requerido
    if (transition.requiresComment && !context.comment) {
      return {
        success: false,
        error: 'Esta transición requiere un comentario'
      }
    }

    // Validar campos requeridos
    if (transition.requiresFields) {
      const requiredFields = JSON.parse(transition.requiresFields)
      const missingFields = requiredFields.filter((field: string) => !context.metadata?.[field])
      if (missingFields.length > 0) {
        return {
          success: false,
          error: `Campos requeridos faltantes: ${missingFields.join(', ')}`
        }
      }
    }

    return {
      success: true,
      newState: transition.toState,
      previousState: transition.fromState
    }
  }

  /**
   * Ejecuta una transición de estado
   */
  async executeTransition(context: TransitionContext): Promise<TransitionResult> {
    const validation = await this.validateTransition(context)
    
    if (!validation.success) {
      return validation
    }

    const { entityId, entityType, toStateCode, actorId, comment, metadata } = context

    return await prisma.$transaction(async (tx) => {
      // Obtener entidad y estado destino (dentro de la transacción)
      const entity = await this.getEntityWithWorkflowTx(tx, entityId, entityType)
      
      if (!entity || !entity.workflow) {
        return { success: false, error: 'Entidad o workflow no encontrado' }
      }

      const targetState = await tx.workflowState.findFirst({
        where: {
          workflowId: entity.workflowId!,
          code: toStateCode
        }
      })

      if (!targetState) {
        return { success: false, error: 'Estado destino no encontrado' }
      }

      // Obtener transición para acciones automáticas
      const transition = await tx.workflowTransition.findFirst({
        where: {
          workflowId: entity.workflowId!,
          fromStateId: entity.currentStateId!,
          toStateId: targetState.id
        }
      })

      // Ejecutar validador custom si existe
      if (transition?.validatorCode) {
        const validator = this.getValidator(transition.validatorCode)
        const validationResult = await validator(entity, context, tx)
        if (!validationResult.valid) {
          return { success: false, error: validationResult.error || 'Validación fallida' }
        }
      }

      // Actualizar estado de la entidad
      const updatedEntity = await this.updateEntityState(
        tx, 
        entityId, 
        entityType, 
        targetState.id
      )

      // Registrar historial
      await tx.stateHistory.create({
        data: {
          [`${entityType.toLowerCase()}Id`]: entityId,
          fromStateId: entity.currentStateId!,
          toStateId: targetState.id,
          actorId,
          comment,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      })

      // Ejecutar acciones automáticas
      if (transition?.autoActions) {
        const actions = JSON.parse(transition.autoActions)
        for (const action of actions) {
          await this.executeAction(action, entity, context, tx)
        }
      }

      return {
        success: true,
        newState: targetState,
        previousState: entity.currentState
      }
    })
  }

  /**
   * Crea una nueva entidad con workflow configurable
   */
  async createEntityWithWorkflow(
    entityType: 'TASK' | 'REQUEST',
    workflowCode: string,
    data: any
  ): Promise<Task | Request | null> {
    const workflow = await prisma.workflowDefinition.findFirst({
      where: { code: workflowCode, isActive: true },
      include: { states: { where: { isInitial: true } } }
    })

    if (!workflow || workflow.states.length === 0) {
      throw new Error(`Workflow '${workflowCode}' no encontrado o sin estado inicial`)
    }

    const initialState = workflow.states[0]

    if (entityType === 'TASK') {
      return await prisma.task.create({
        data: {
          ...data,
          workflowId: workflow.id,
          currentStateId: initialState.id,
          // Mantener compatibilidad con sistema legado
          status: this.mapStateToLegacyStatus(initialState.code)
        }
      }) as Task
    } else {
      return await prisma.request.create({
        data: {
          ...data,
          workflowId: workflow.id,
          currentStateId: initialState.id,
          // Mantener compatibilidad con sistema legado
          status: this.mapStateToLegacyStatus(initialState.code)
        }
      }) as Request
    }
  }

  /**
   * Obtiene el historial de estados de una entidad
   */
  async getStateHistory(
    entityId: string,
    entityType: 'TASK' | 'REQUEST'
  ) {
    return await prisma.stateHistory.findMany({
      where: {
        [`${entityType.toLowerCase()}Id`]: entityId
      },
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        toState: true
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  private async getEntityWithWorkflow(
    entityId: string,
    entityType: 'TASK' | 'REQUEST'
  ) {
    if (entityType === 'TASK') {
      return await prisma.task.findUnique({
        where: { id: entityId },
        include: { workflow: true, currentState: true }
      })
    } else {
      return await prisma.request.findUnique({
        where: { id: entityId },
        include: { workflow: true, currentState: true }
      })
    }
  }

  private async getEntityWithWorkflowTx(
    tx: any,
    entityId: string,
    entityType: 'TASK' | 'REQUEST'
  ) {
    if (entityType === 'TASK') {
      return await tx.task.findUnique({
        where: { id: entityId },
        include: { workflow: true, currentState: true }
      })
    } else {
      return await tx.request.findUnique({
        where: { id: entityId },
        include: { workflow: true, currentState: true }
      })
    }
  }

  private async updateEntityState(
    tx: any,
    entityId: string,
    entityType: 'TASK' | 'REQUEST',
    newStateId: string
  ) {
    if (entityType === 'TASK') {
      return await tx.task.update({
        where: { id: entityId },
        data: { currentStateId: newStateId }
      })
    } else {
      return await tx.request.update({
        where: { id: entityId },
        data: { currentStateId: newStateId }
      })
    }
  }



  /**
   * Obtiene un validador custom por código
   */
  private getValidator(code: string): (entity: any, context: any, tx: any) => Promise<{ valid: boolean; error?: string }> {
    const validators: Record<string, Function> = {
      // Verifica cuota de días libres
      check_quota: async (entity: any, context: any, tx: any) => {
        // TODO: Implementar lógica de cuota
        return { valid: true }
      },
      
      // Valida conflictos de horario
      validate_schedule: async (entity: any, context: any, tx: any) => {
        // TODO: Implementar validación de horario
        return { valid: true }
      },

      // Verifica que haya documentos adjuntos
      check_documents: async (entity: any, context: any, tx: any) => {
        const documents = await tx.requestDocument.count({
          where: { requestId: entity.id }
        })
        if (documents === 0) {
          return { valid: false, error: 'Se requiere al menos un documento adjunto' }
        }
        return { valid: true }
      }
    }

    return validators[code] || (() => Promise.resolve({ valid: true }))
  }

  /**
   * Ejecuta acciones automáticas
   */
  private async executeAction(
    action: string,
    entity: any,
    context: TransitionContext,
    tx: any
  ): Promise<void> {
    switch (action) {
      case 'create_notification':
        await this.createNotification(entity, context, tx)
        break
        
      case 'update_calendar':
        await this.updateCalendar(entity, context, tx)
        break
        
      case 'notify_creator':
        await this.notifyCreator(entity, context, tx)
        break
        
      case 'notify_assignees':
        await this.notifyAssignees(entity, context, tx)
        break
    }
  }

  private async createNotification(
    entity: any,
    context: TransitionContext,
    tx: any
  ): Promise<void> {
    const userId = entity.creatorId || entity.requesterId
    if (!userId) return

    await tx.workflowNotification.create({
      data: {
        userId,
        title: 'Cambio de estado',
        message: `Tu ${entity.workflow.entityType.toLowerCase()} cambió a: ${entity.currentState?.name || 'nuevo estado'}`,
        type: 'info',
        [`${context.entityType.toLowerCase()}Id`]: entity.id
      }
    })
  }

  private async updateCalendar(
    entity: any,
    context: TransitionContext,
    tx: any
  ): Promise<void> {
    // Solo para aprobaciones de días libres
    if (entity.workflow?.code === 'request_free_day' && entity.currentState?.code === 'approved') {
      // Parsear contexto para obtener fecha
      const ctx = entity.context ? JSON.parse(entity.context) : {}
      if (ctx.requestedDate) {
        await tx.userCalendarEvent.create({
          data: {
            userId: entity.requesterId,
            date: new Date(ctx.requestedDate),
            type: 'FREE_DAY',
            title: 'Día de libre disposición'
          }
        })
      }
    }
  }

  private async notifyCreator(
    entity: any,
    context: TransitionContext,
    tx: any
  ): Promise<void> {
    const creatorId = entity.creatorId
    if (!creatorId || creatorId === context.actorId) return

    await tx.workflowNotification.create({
      data: {
        userId: creatorId,
        title: 'Actualización de tarea',
        message: `La tarea "${entity.title}" ha sido actualizada`,
        type: 'info',
        taskId: entity.id
      }
    })
  }

  private async notifyAssignees(
    entity: any,
    context: TransitionContext,
    tx: any
  ): Promise<void> {
    const assignees = await tx.taskAssignment.findMany({
      where: { taskId: entity.id },
      select: { assigneeId: true }
    })

    for (const { assigneeId } of assignees) {
      if (assigneeId === context.actorId) continue
      
      await tx.workflowNotification.create({
        data: {
          userId: assigneeId,
          title: 'Tarea actualizada',
          message: `La tarea "${entity.title}" tiene un nuevo estado`,
          type: 'info',
          taskId: entity.id
        }
      })
    }
  }
}

// Instancia singleton
export const workflowEngine = new WorkflowEngine()
