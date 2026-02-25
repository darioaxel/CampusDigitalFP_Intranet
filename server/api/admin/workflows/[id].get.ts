// server/api/admin/workflows/[id].get.ts
// Obtener detalle de un workflow específico

import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    // Verificar que el usuario es admin
    const { user } = await getUserSession(event)
    if (!user || !['ADMIN', 'ROOT'].includes(user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'No autorizado'
      })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID requerido'
      })
    }

    const workflow = await prisma.workflowDefinition.findUnique({
      where: { id },
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
            requests: true,
            tasks: true
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
    console.error('[workflows/get] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error al cargar workflow'
    })
  }
})
