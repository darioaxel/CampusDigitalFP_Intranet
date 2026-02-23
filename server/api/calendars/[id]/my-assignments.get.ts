// GET /api/calendars/[id]/my-assignments - Obtener mis asignaciones en un calendario
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user as any
  
  if (!user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }
  
  const calendarId = getRouterParam(event, 'id')
  if (!calendarId) {
    throw createError({ statusCode: 400, message: 'ID de calendario requerido' })
  }
  
  const prisma = getPrisma()
  
  // Verificar que el calendario existe
  const calendar = await prisma.calendar.findFirst({
    where: {
      id: calendarId,
      isActive: true,
    },
  })
  
  if (!calendar) {
    throw createError({ statusCode: 404, message: 'Calendario no encontrado' })
  }
  
  // Obtener asignaciones del usuario
  const assignments = await prisma.userCalendarEvent.findMany({
    where: {
      userId: user.id,
      event: {
        calendarId,
      },
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          type: true,
          startDate: true,
          endDate: true,
          color: true,
        },
      },
    },
    orderBy: {
      order: 'asc',
    },
  })
  
  return {
    success: true,
    data: assignments,
  }
})
