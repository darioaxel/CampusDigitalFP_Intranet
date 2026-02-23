// POST /api/calendars/[id]/assign - Asignar evento a usuario (drag-drop)
import { z } from 'zod'

const assignEventSchema = z.object({
  eventId: z.string().uuid(),
  notes: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user

  const calendarId = getRouterParam(event, 'id')
  if (!calendarId) {
    throw createError({ statusCode: 400, message: 'ID de calendario requerido' })
  }
  
  // Validar body
  const body = await readBody(event)
  const result = assignEventSchema.safeParse(body)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Datos inválidos',
      data: result.error.errors
    })
  }
  
  const { eventId, notes } = result.data
  
  // Verificar que el calendario existe y permite drag-drop
  const calendar = await prisma.calendar.findUnique({
    where: { id: calendarId },
    include: {
      events: {
        where: { id: eventId },
        include: {
          assignments: true,
        },
      },
    },
  })
  
  if (!calendar) {
    throw createError({ statusCode: 404, message: 'Calendario no encontrado' })
  }
  
  if (!calendar.allowDragDrop) {
    throw createError({ statusCode: 403, message: 'Este calendario no permite asignaciones' })
  }
  
  const eventItem = calendar.events[0]
  if (!eventItem) {
    throw createError({ statusCode: 404, message: 'Evento no encontrado en este calendario' })
  }
  
  // Verificar límite de asignaciones globales del calendario
  if (calendar.maxEventsPerUser) {
    const userAssignmentsCount = await prisma.userCalendarEvent.count({
      where: {
        userId: user.id,
        event: {
          calendarId,
        },
      },
    })
    
    if (userAssignmentsCount >= calendar.maxEventsPerUser) {
      throw createError({
        statusCode: 400,
        message: `Has alcanzado el límite de ${calendar.maxEventsPerUser} asignaciones en este calendario`,
      })
    }
  }
  
  // Verificar límite de asignaciones del evento específico
  if (eventItem.maxAssignments && eventItem.assignments.length >= eventItem.maxAssignments) {
    throw createError({
      statusCode: 400,
      message: 'Este evento ha alcanzado el límite de asignaciones',
    })
  }
  
  // Calcular el orden (número de día)
  const existingAssignments = await prisma.userCalendarEvent.count({
    where: {
      userId: user.id,
      event: {
        calendarId,
      },
    },
  })
  
  // Crear asignación
  const assignment = await prisma.userCalendarEvent.create({
    data: {
      eventId,
      userId: user.id,
      order: existingAssignments + 1,
      notes,
      status: 'CONFIRMED',
    },
    include: {
      event: true,
    },
  })
  
  return {
    success: true,
    data: assignment,
  }
})
