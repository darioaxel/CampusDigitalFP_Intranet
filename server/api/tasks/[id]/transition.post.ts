// POST /api/tasks/[id]/transition - Ejecutar transición de estado
import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import { workflowEngine } from '../../../utils/workflow/engine'
import { prisma } from '../../../utils/db'

const transitionSchema = z.object({
  toState: z.string().min(1, 'El estado destino es requerido'),
  comment: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const taskId = getRouterParam(event, 'id')
  
  if (!taskId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de tarea requerido'
    })
  }

  // Validar body
  const body = await readBody(event)
  const validation = transitionSchema.safeParse(body)
  
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Datos inválidos: ' + validation.error.errors.map(e => e.message).join(', ')
    })
  }

  const { toState, comment, metadata } = validation.data

  try {
    // Verificar que la tarea existe
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: {
          where: { assigneeId: session.user.id },
          select: { id: true }
        }
      }
    })

    if (!task) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Tarea no encontrada'
      })
    }

    // Verificar permisos
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const isAdmin = ['ADMIN', 'ROOT'].includes(currentUser?.role as string)
    const isCreator = task.creatorId === session.user.id
    const isAssignee = task.assignments.length > 0

    if (!isAdmin && !isCreator && !isAssignee) {
      throw createError({
        statusCode: 403,
        statusMessage: 'No tienes permiso para modificar esta tarea'
      })
    }

    // Si no tiene workflow configurable, rechazar
    if (!task.workflowId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Esta tarea usa el sistema de workflow legado. Use el endpoint correspondiente.'
      })
    }

    // Ejecutar transición
    const result = await workflowEngine.executeTransition({
      entityId: taskId,
      entityType: 'TASK',
      toStateCode: toState,
      actorId: session.user.id,
      actorRole: currentUser!.role,
      comment,
      metadata
    })

    if (!result.success) {
      throw createError({
        statusCode: 400,
        statusMessage: result.error || 'Error en la transición'
      })
    }

    return {
      success: true,
      data: {
        previousState: result.previousState,
        newState: result.newState
      },
      message: `Estado actualizado a: ${result.newState?.name}`
    }
  } catch (error: any) {
    console.error('Error executing transition:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Error al ejecutar la transición'
    })
  }
})
