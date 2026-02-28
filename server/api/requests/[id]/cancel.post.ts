// server/api/requests/[id]/cancel.post.ts
// Cancelar/eliminar una solicitud de día de libre disposición
// - Si está pendiente: elimina físicamente
// - Si está aprobada: cambia estado a 'cancelled_by_user' y elimina el evento del calendario

import { z } from 'zod'
import { workflowEngine } from '../../../utils/workflow/engine'

const cancelSchema = z.object({
  reason: z.string().optional()
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
  const validation = cancelSchema.safeParse(body)
  
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: 'Datos inválidos',
    })
  }

  const { reason } = validation.data

  try {
    // Obtener la solicitud con su estado actual
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        currentState: true,
        workflow: true
      }
    })

    if (!request) {
      throw createError({
        statusCode: 404,
        message: 'Solicitud no encontrada',
      })
    }

    // Verificar que el usuario sea el propietario de la solicitud
    if (request.requesterId !== session.user.id) {
      throw createError({
        statusCode: 403,
        message: 'No tienes permiso para cancelar esta solicitud',
      })
    }

    // Verificar que sea una solicitud de día de libre disposición
    const context = request.context ? JSON.parse(request.context) : {}
    if (context.type !== 'FREE_DAY') {
      throw createError({
        statusCode: 400,
        message: 'Solo se pueden cancelar solicitudes de días de libre disposición',
      })
    }

    // Si está en estado 'pending': eliminar físicamente
    if (request.currentState?.code === 'pending') {
      await prisma.$transaction(async (tx) => {
        // Eliminar historial de estados
        await tx.stateHistory.deleteMany({
          where: { requestId }
        })

        // Eliminar notificaciones relacionadas
        await tx.workflowNotification.deleteMany({
          where: { requestId }
        })

        // Eliminar la solicitud
        await tx.request.delete({
          where: { id: requestId }
        })
      })

      return {
        success: true,
        message: 'Solicitud eliminada correctamente',
        action: 'deleted'
      }
    }

    // Si está aprobada: cambiar estado a 'cancelled_by_user'
    if (request.currentState?.code === 'approved') {
      // Ejecutar transición mediante el motor de workflow
      const result = await workflowEngine.executeTransition({
        entityId: requestId,
        entityType: 'REQUEST',
        toStateCode: 'cancelled_by_user',
        actorId: session.user.id,
        actorRole: session.user.role,
        comment: reason || 'Cancelada por el usuario',
        metadata: {
          cancelledBy: session.user.id,
          cancelledAt: new Date().toISOString()
        }
      })

      if (!result.success) {
        throw createError({
          statusCode: 400,
          message: result.error || 'No se pudo cancelar la solicitud',
        })
      }

      // Eliminar el UserCalendarEvent asociado (la acción automática puede hacer esto, pero por si acaso)
      if (context.requestedDate) {
        await prisma.userCalendarEvent.deleteMany({
          where: {
            userId: session.user.id,
            date: new Date(context.requestedDate),
            type: 'FREE_DAY'
          }
        })
      }

      return {
        success: true,
        message: 'Solicitud marcada como eliminada por usuario',
        action: 'cancelled'
      }
    }

    // Si está en otro estado, no se puede cancelar
    throw createError({
      statusCode: 400,
      message: `No se puede cancelar una solicitud en estado '${request.currentState?.name}'`,
    })

  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    console.error('Error cancelando solicitud:', error)
    throw createError({
      statusCode: 500,
      message: 'Error al cancelar la solicitud',
    })
  }
})
