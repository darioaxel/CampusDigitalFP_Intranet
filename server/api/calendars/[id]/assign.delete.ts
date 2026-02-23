// DELETE /api/calendars/[id]/assign - Desasignar evento de usuario
import { z } from 'zod'

const unassignEventSchema = z.object({
  eventId: z.string().uuid(),
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
  const result = unassignEventSchema.safeParse(body)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Datos inválidos',
      data: result.error.errors
    })
  }
  
  const { eventId } = result.data
  
  const prisma = getPrisma()
  
  // Verificar que el calendario existe y permite drag-drop
  const calendar = await prisma.calendar.findUnique({
    where: { id: calendarId },
  })
  
  if (!calendar) {
    throw createError({ statusCode: 404, message: 'Calendario no encontrado' })
  }
  
  if (!calendar.allowDragDrop) {
    throw createError({ statusCode: 403, message: 'Este calendario no permite modificaciones' })
  }
  
  // Buscar y eliminar la asignación
  const assignment = await prisma.userCalendarEvent.findFirst({
    where: {
      eventId,
      userId: user.id,
    },
  })
  
  if (!assignment) {
    throw createError({ statusCode: 404, message: 'Asignación no encontrada' })
  }
  
  await prisma.userCalendarEvent.delete({
    where: { id: assignment.id },
  })
  
  // Reordenar las asignaciones restantes del usuario
  const remainingAssignments = await prisma.userCalendarEvent.findMany({
    where: {
      userId: user.id,
      event: {
        calendarId,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })
  
  // Actualizar orden
  for (let i = 0; i < remainingAssignments.length; i++) {
    await prisma.userCalendarEvent.update({
      where: { id: remainingAssignments[i].id },
      data: { order: i + 1 },
    })
  }
  
  return {
    success: true,
    message: 'Asignación eliminada correctamente',
  }
})
