// GET /api/requests/[id]/transitions - Obtener transiciones disponibles
import { defineEventHandler, createError, getRouterParam } from 'h3'
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
  
  if (!requestId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de solicitud requerido'
    })
  }

  try {
    // Obtener la solicitud
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        requesterId: true,
        currentStateId: true
      }
    })

    if (!request) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Solicitud no encontrada'
      })
    }

    // Verificar permisos
    const isRequester = request.requesterId === session.user.id
    const isAdmin = canManageRequests(session.user.role)

    if (!isAdmin && !isRequester) {
      throw createError({
        statusCode: 403,
        statusMessage: 'No tienes acceso a esta solicitud'
      })
    }

    if (!isAdmin) {
      // El requester no puede ver transiciones
      return {
        success: true,
        data: [],
        message: 'Solo administradores pueden gestionar esta solicitud'
      }
    }

    // Obtener transiciones disponibles del workflow configurable
    const transitions = await workflowEngine.getAvailableTransitions(
      requestId,
      'REQUEST',
      session.user.role
    )

    return {
      success: true,
      data: transitions,
      currentState: request.currentStateId
    }
  } catch (error: any) {
    console.error('Error getting transitions:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Error al obtener transiciones'
    })
  }
})
