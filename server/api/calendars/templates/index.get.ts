// GET /api/calendars/templates - Listar calendarios plantilla disponibles
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  // Verificar que sea ADMIN o ROOT
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  if (!user || (user.role !== 'ADMIN' && user.role !== 'ROOT')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Solo administradores pueden ver plantillas'
    })
  }

  try {
    const templates = await prisma.calendar.findMany({
      where: {
        type: 'TEMPLATE',
        isActive: true
      },
      include: {
        _count: {
          select: { events: true }
        }
      },
      orderBy: [
        { academicYear: 'desc' },
        { name: 'asc' }
      ]
    })

    return {
      success: true,
      data: templates
    }
  } catch (error) {
    console.error('Error fetching calendar templates:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al cargar las plantillas'
    })
  }
})
