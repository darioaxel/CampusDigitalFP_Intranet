// GET /api/workflows/[id] - Obtener detalle de un workflow
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const workflowId = getRouterParam(event, 'id')
  
  if (!workflowId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de workflow requerido'
    })
  }

  try {
    const workflow = await prisma.workflowDefinition.findUnique({
      where: { id: workflowId },
      include: {
        states: {
          orderBy: { order: 'asc' }
        },
        transitions: {
          include: {
            fromState: true,
            toState: true
          }
        },
        _count: {
          select: {
            tasks: true,
            requests: true
          }
        }
      }
    })

    if (!workflow) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Workflow no encontrado'
      })
    }

    return {
      success: true,
      data: workflow
    }
  } catch (error: any) {
    console.error('Error fetching workflow:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Error al cargar el workflow'
    })
  }
})
