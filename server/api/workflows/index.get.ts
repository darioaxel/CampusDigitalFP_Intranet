// GET /api/workflows - Listar workflows disponibles
import { defineEventHandler, createError, getQuery } from 'h3'
import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const query = getQuery(event)
  const { entityType, isActive = 'true', includeInactive = 'false' } = query

  try {
    // Construir where clause
    const where: any = {}

    if (entityType) {
      where.entityType = entityType as string
    }

    // Por defecto, solo mostrar activos
    if (includeInactive !== 'true') {
      where.isActive = true
    }

    const workflows = await prisma.workflowDefinition.findMany({
      where,
      include: {
        states: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            tasks: true,
            requests: true
          }
        }
      },
      orderBy: [
        { entityType: 'asc' },
        { name: 'asc' }
      ]
    })

    return {
      success: true,
      data: workflows
    }
  } catch (error: any) {
    console.error('Error fetching workflows:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al cargar los workflows'
    })
  }
})
