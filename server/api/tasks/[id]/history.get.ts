// GET /api/tasks/[id]/history - Obtener historial de estados
import { defineEventHandler, createError, getRouterParam, getQuery } from 'h3'
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
  const query = getQuery(event)
  const limit = Math.min(parseInt(query.limit as string) || 50, 100)
  const offset = parseInt(query.offset as string) || 0
  
  if (!taskId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de tarea requerido'
    })
  }

  try {
    // Verificar que la tarea existe
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        creatorId: true,
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

    // Verificar acceso
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

    // Obtener historial
    const history = await workflowEngine.getStateHistory(taskId, 'TASK')

    // Paginar
    const paginated = history.slice(offset, offset + limit)

    return {
      success: true,
      data: paginated,
      meta: {
        total: history.length,
        limit,
        offset
      }
    }
  } catch (error: any) {
    console.error('Error getting history:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Error al obtener el historial'
    })
  }
})
