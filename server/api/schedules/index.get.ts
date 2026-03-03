import { defineEventHandler, createError } from 'h3'
import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  // Verificar autenticación
  const session = await getUserSession(event)
  
  if (!session.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'No autenticado',
    })
  }

  // Verificar que es admin
  if (!['ADMIN', 'ROOT'].includes(session.user.role)) {
    throw createError({
      statusCode: 403,
      message: 'No tienes permiso para ver todos los horarios',
    })
  }

  try {
    const schedules = await prisma.schedule.findMany({
      where: {
        isTemplate: false // Excluir templates
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        blocks: true,
        request: {
          select: {
            id: true,
            currentState: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      success: true,
      data: schedules,
    }
  } catch (error) {
    console.error('Error fetching schedules:', error)
    throw createError({
      statusCode: 500,
      message: 'Error al obtener los horarios',
    })
  }
})
