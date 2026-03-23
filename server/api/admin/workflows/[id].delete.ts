// server/api/admin/workflows/[id].delete.ts
// Eliminar workflow

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

    // Verificar que existe
    const workflow = await prisma.workflowDefinition.findUnique({
      where: { id },
      include: {
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

    // Verificar que no tiene entidades asociadas
    if (workflow._count.requests > 0 || workflow._count.tasks > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `No se puede eliminar: tiene ${workflow._count.requests} solicitudes y ${workflow._count.tasks} tareas asociadas`
      })
    }

    // Eliminar (las transiciones y estados se eliminan en cascada)
    await prisma.workflowDefinition.delete({
      where: { id }
    })

    return {
      success: true,
      message: 'Workflow eliminado correctamente'
    }

  } catch (error: any) {
    console.error('[workflows/delete] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error al eliminar workflow'
    })
  }
})
