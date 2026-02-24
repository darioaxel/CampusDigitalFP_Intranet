import { getUserSession } from '#imports'
import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  try {
    const schedules = await prisma.schedule.findMany({
      where: { 
        userId: session.user.id
      },
      include: {
        blocks: {
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return {
      success: true,
      data: schedules
    }
  } catch (error) {
    console.error('Error fetching schedules:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al cargar horarios'
    })
  }
})