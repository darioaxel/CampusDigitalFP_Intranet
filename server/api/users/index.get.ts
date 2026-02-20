import { Role } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session.user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: [Role.USER, Role.ADMIN, Role.ROOT, Role.JEFE_DEPT, Role.EXPERTO, Role.PROFESOR] }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })

    return users
  } catch (error) {
    console.error('Error fetching users:', error)
    throw createError({ 
      statusCode: 500, 
      message: 'Error al cargar los usuarios' 
    })
  }
})
