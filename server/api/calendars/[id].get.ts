// GET /api/calendars/[id] - Obtener calendario con eventos
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }
  
  const prisma = getPrisma()
  
  // Verificar rol
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })
  
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'ROOT'
  
  const calendar = await prisma.calendar.findFirst({
    where: {
      id,
      // Si no es admin, solo ver calendarios activos y públicos
      ...(isAdmin ? {} : { isActive: true, isPublic: true }),
    },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      events: {
        where: {
          isActive: true,
        },
        include: {
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              assignments: true,
            },
          },
        },
        orderBy: {
          startDate: 'asc',
        },
      },
    },
  })
  
  if (!calendar) {
    throw createError({ statusCode: 404, message: 'Calendario no encontrado' })
  }
  
  return {
    success: true,
    data: calendar,
  }
})
