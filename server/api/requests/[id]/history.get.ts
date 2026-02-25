// GET /api/requests/[id]/history - Obtener historial de estados
import { defineEventHandler, createError, getRouterParam, getQuery } from 'h3'
import { workflowEngine } from '../../../utils/workflow/engine'
import { canManageRequests } from '../../../utils/workflow/stateMachine'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const requestId = getRouterParam(event, 'id')
  const query = getQuery(event)
  const limit = Math.min(parseInt(query.limit as string) || 50, 100)
  const offset = parseInt(query.offset as string) || 0
  
  if (!requestId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de solicitud requerido'
    })
  }

  try {
    // Verificar que la solicitud existe
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        requesterId: true
      }
    })

    if (!request) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Solicitud no encontrada'
      })
    }

    // Verificar acceso
    const isRequester = request.requesterId === session.user.id
    const isAdmin = canManageRequests(session.user.role)

    if (!isAdmin && !isRequester) {
      throw createError({
        statusCode: 403,
        statusMessage: 'No tienes acceso a esta solicitud'
      })
    }

    // Obtener historial del workflow configurable
    const history = await workflowEngine.getStateHistory(requestId, 'REQUEST')
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
