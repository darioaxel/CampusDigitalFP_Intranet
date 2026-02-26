// DELETE /api/calendars/[id]/events/[eventId] - Eliminar evento
import { prisma } from '../../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  // Verificar que sea ADMIN o ROOT
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  if (!user || (user.role !== 'ADMIN' && user.role !== 'ROOT')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Solo administradores pueden eliminar eventos'
    })
  }

  const calendarId = getRouterParam(event, 'id')
  const eventId = getRouterParam(event, 'eventId')

  if (!calendarId || !eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de calendario y evento requeridos'
    })
  }

  try {
    // Verificar que el evento pertenece al calendario
    const calendarEvent = await prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        calendarId: calendarId
      }
    })

    if (!calendarEvent) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Evento no encontrado'
      })
    }

    // Eliminar evento
    await prisma.calendarEvent.delete({
      where: { id: eventId }
    })

    return {
      success: true,
      message: 'Evento eliminado correctamente'
    }

  } catch (error: any) {
    console.error('Error deleting event:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al eliminar el evento'
    })
  }
})
