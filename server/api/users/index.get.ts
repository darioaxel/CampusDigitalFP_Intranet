import pkg from '@prisma/client'
const { Role } = pkg

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session.user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }

  // Verificar que el usuario sea ADMIN o ROOT
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  if (!currentUser || ![Role.ADMIN, Role.ROOT].includes(currentUser.role)) {
    throw createError({ statusCode: 403, message: 'No autorizado' })
  }

  // Obtener parámetros de paginación
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 15
  const skip = (page - 1) * limit

  try {
    // Obtener total de usuarios para la paginación
    const total = await prisma.user.count({
      where: { role: { not: Role.ROOT } }
    })

    const users = await prisma.user.findMany({
      skip,
      take: limit,
      where: { role: { not: Role.ROOT } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    throw createError({ 
      statusCode: 500, 
      message: 'Error al cargar los usuarios' 
    })
  }
})
