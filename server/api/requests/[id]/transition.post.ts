// server/api/requests/[id]/transition.post.ts
// Transicionar el estado de una solicitud

import { z } from 'zod'
import { 
  workflowStateMachine, 
  canManageRequests,
  type EntityType 
} from '../../../utils/workflow/stateMachine'
import type { WorkflowStatus } from '@prisma/client'

const transitionSchema = z.object({
  toStatus: z.enum([
    'PENDING', 'APPROVED', 'REJECTED', 'COMMUNICATED', 'CLOSED',
    'TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'
  ]),
  comment: z.string().max(2000).optional(),
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

  // Validar body
  const body = await readBody(event)
  const validation = transitionSchema.safeParse(body)
  
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: 'Datos inválidos',
      data: validation.error.flatten(),
    })
  }

  const { toStatus, comment } = validation.data

  try {
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

    // Verificar permisos según el tipo de transición
    const isRequester = request.requesterId === session.user.id
    const isAdmin = canManageRequests(session.user.role)
    
    // Solo admin puede hacer transiciones (excepto casos especiales)
    // El requester puede "cancelar" su solicitud si aún está PENDING
    const canTransition = isAdmin || (
      isRequester && 
      request.status === 'PENDING' && 
      toStatus === 'CANCELLED'
    )

    if (!canTransition) {
      throw createError({
        statusCode: 403,
        message: 'No tienes permiso para cambiar el estado de esta solicitud',
      })
    }

    // Validar transición con la máquina de estados
    const transitionResult = await workflowStateMachine.executeTransition({
      userId: session.user.id,
      userRole: session.user.role,
      entityId: requestId,
      entityType: 'REQUEST' as EntityType,
      fromStatus: request.status,
      toStatus: toStatus as WorkflowStatus,
      comment,
      metadata: {
        hasValidDocuments: request.documents.length > 0,
      },
    })

    if (!transitionResult.success) {
      throw createError({
        statusCode: 400,
        message: transitionResult.error || 'Transición no permitida',
      })
    }

    // Actualizar la solicitud
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: toStatus as WorkflowStatus,
        adminId: isAdmin ? session.user.id : request.adminId,
        adminNotes: comment || request.adminNotes,
      },
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
      },
    })

    // Crear log de actividad
    await prisma.activityLog.create({
      data: {
        actorId: session.user.id,
        action: 'REQUEST_STATUS_CHANGED',
        description: `Estado cambiado de ${request.status} a ${toStatus}`,
        entityType: 'REQUEST',
        entityId: requestId,
        requestId: requestId,
        metadata: JSON.stringify({
          fromStatus: request.status,
          toStatus,
          comment,
          changedBy: session.user.role,
        }),
      },
    })

    return {
      success: true,
      data: updatedRequest,
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
