// PUT /api/calendars/[id]/events/[eventId] - Actualizar evento (solo ADMIN/ROOT)
import { z } from 'zod'
import { prisma } from '../../../../utils/db'

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['HOLIDAY', 'LECTIVE', 'EVALUATION', 'FREE_DISPOSITION', 'MEETING', 'DEADLINE', 'OTHER']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isAllDay: z.boolean().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  maxAssignments: z.number().int().min(1).optional().nullable(),
  isActive: z.boolean().optional(),
})

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
      statusMessage: 'Solo administradores pueden actualizar eventos'
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
    // Verificar que el evento existe y pertenece al calendario
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        calendarId: calendarId
      }
    })

    if (!existingEvent) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Evento no encontrado'
      })
    }

    // Validar body
    const body = await readBody(event)
    const result = updateEventSchema.safeParse(body)
    
    if (!result.success) {
      throw createError({
        statusCode: 400,
        message: 'Datos inválidos',
        data: result.error.errors
      })
    }

    const data = result.data

    // Preparar datos de actualización
    const updateData: any = {}
    
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.type !== undefined) updateData.type = data.type
    if (data.isAllDay !== undefined) updateData.isAllDay = data.isAllDay
    if (data.startTime !== undefined) updateData.startTime = data.startTime
    if (data.endTime !== undefined) updateData.endTime = data.endTime
    if (data.color !== undefined) updateData.color = data.color
    if (data.maxAssignments !== undefined) updateData.maxAssignments = data.maxAssignments
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    
    // Normalizar fechas si se proporcionan
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate + 'T00:00:00')
    }
    if (data.endDate) {
      updateData.endDate = new Date(data.endDate + 'T23:59:59')
    }

    // Actualizar evento
    const updatedEvent = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: updateData
    })

    return {
      success: true,
      data: updatedEvent,
      message: 'Evento actualizado correctamente'
    }

  } catch (error: any) {
    console.error('Error updating event:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al actualizar el evento'
    })
  }
})
