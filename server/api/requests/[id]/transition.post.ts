// server/api/requests/[id]/transition.post.ts
// Transicionar el estado de una solicitud usando workflow configurable

import { z } from 'zod'
import { canManageRequests } from '../../../utils/workflow/stateMachine'
import { workflowEngine } from '../../../utils/workflow/engine'

const transitionSchema = z.object({
  toState: z.string().min(1, 'El estado destino es requerido'),
  comment: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export default defineEventHandler(async (event) => {
  // Verificar autenticación
  const session = await getUserSession(event)
  
  if (!session.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'No autenticado',
    })
  }

  const requestId = getRouterParam(event, 'id')
  
  if (!requestId) {
    throw createError({
      statusCode: 400,
      message: 'ID de solicitud requerido',
    })
  }

  // Obtener la solicitud actual
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      documents: {
        where: { status: 'VALID' },
        select: { id: true },
      },
    },
  })

  if (!request) {
    throw createError({
      statusCode: 404,
      message: 'Solicitud no encontrada',
    })
  }

  // Verificar permisos
  const isAdmin = canManageRequests(session.user.role)
  
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      message: 'No tienes permiso para cambiar el estado de esta solicitud',
    })
  }

  // Validar body
  const body = await readBody(event)
  const validation = transitionSchema.safeParse(body)
  
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: 'Datos inválidos: ' + validation.error.errors.map(e => e.message).join(', '),
    })
  }

  const { toState, comment, metadata } = validation.data

  try {
    // Ejecutar transición
    const result = await workflowEngine.executeTransition({
      entityId: requestId,
      entityType: 'REQUEST',
      toStateCode: toState,
      actorId: session.user.id,
      actorRole: session.user.role,
      comment,
      metadata: {
        ...metadata,
        hasValidDocuments: request.documents.length > 0,
      }
    })

    if (!result.success) {
      throw createError({
        statusCode: 400,
        message: result.error || 'Transición no permitida',
      })
    }

    // Obtener solicitud actualizada
    const updatedRequest = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        documents: {
          select: {
            id: true,
            status: true,
          },
        },
        currentState: true,
      },
    })

    return {
      success: true,
      data: updatedRequest,
      message: `Estado actualizado a: ${result.newState?.name}`,
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    console.error('Error transitioning request:', error)
    throw createError({
      statusCode: 500,
      message: 'Error al cambiar el estado de la solicitud',
    })
  }
})
