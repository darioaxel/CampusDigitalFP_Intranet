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

  // Obtener parámetros de query (para filtrar por curso)
  const query = getQuery(event)
  const academicYearId = query.academicYearId as string | undefined

  try {
    // Construir where clause
    const where: any = { 
      userId: session.user.id
    }

    // Si se especifica un curso, filtrar por él
    if (academicYearId) {
      where.academicYearId = academicYearId
    } else {
      // Por defecto, mostrar horarios del curso activo o sin curso asignado
      const currentYear = await prisma.academicYear.findFirst({
        where: { isActive: true },
        select: { id: true }
      })
      
      if (currentYear) {
        where.OR = [
          { academicYearId: currentYear.id },
          { academicYearId: null } // Horarios antiguos sin curso asignado
        ]
      }
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        blocks: {
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        },
        academicYear: {
          select: { name: true, isActive: true }
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