// GET /api/tasks/[id]/transitions - Obtener transiciones disponibles
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { workflowEngine } from '../../../utils/workflow/engine'
import { prisma } from '../../../utils/db'

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

  try {
    // Verificar que la tarea existe y el usuario tiene acceso
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

    // Verificar acceso (asignado, creador o admin)
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
        statusMessage: 'No tienes acceso a esta tarea'
      })
    }

    // Si no tiene workflow configurable, devolver array vacío
    // (el frontend debe usar el sistema legado)
    if (!task.workflowId) {
      return {
        success: true,
        data: [],
        usingLegacyWorkflow: true,
        message: 'Esta tarea usa el sistema de workflow legado'
      }
    }

    // Obtener transiciones disponibles
    const transitions = await workflowEngine.getAvailableTransitions(
      taskId,
      'TASK',
      currentUser!.role
    )

    return {
      success: true,
      data: transitions,
      usingLegacyWorkflow: false,
      currentState: task.currentStateId
    }
  } catch (error: any) {
    console.error('Error getting transitions:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Error al obtener transiciones'
    })
  }
})
