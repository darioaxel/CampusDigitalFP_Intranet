// server/api/admin/workflows/index.get.ts
// Listar todos los workflows con sus estados y transiciones

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

    const workflows = await prisma.workflowDefinition.findMany({
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
      },
      orderBy: { createdAt: 'desc' }
    })

    return {
      success: true,
      data: workflows
    }
  } catch (error: any) {
    console.error('[workflows/list] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error al cargar workflows'
    })
  }
})
