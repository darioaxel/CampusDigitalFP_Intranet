// GET /api/calendars - Listar calendarios
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user

  // Verificar rol (PROFESOR, ADMIN, ROOT)
  const allowedRoles = ['PROFESOR', 'ADMIN', 'ROOT']
  if (!allowedRoles.includes(user.role)) {
    throw createError({ statusCode: 403, message: 'No autorizado' })
  }
  
  const query = getQuery(event)
  const { type, academicYear, isActive } = query
  
  const where: any = {}
  
  // Filtrar por tipo
  if (type) {
    where.type = type
  }
  
  // Filtrar por año académico
  if (academicYear) {
    where.academicYear = academicYear
  }
  
  // Filtrar por activo (solo admin puede ver inactivos)
  if (isActive !== undefined) {
    if (user.role === 'ADMIN' || user.role === 'ROOT') {
      where.isActive = isActive === 'true'
    } else {
      where.isActive = true
    }
  } else {
    // Profesores solo ven activos
    if (user.role !== 'ADMIN' && user.role !== 'ROOT') {
      where.isActive = true
    }
  }
  
  const prisma = getPrisma()
  const calendars = await prisma.calendar.findMany({
    where,
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      _count: {
        select: {
          events: true,
        },
      },
    },
    orderBy: {
      startDate: 'desc',
    },
  })
  
  return calendars
})
