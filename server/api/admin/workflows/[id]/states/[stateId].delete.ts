// server/api/admin/workflows/[id]/states/[stateId].delete.ts
// Eliminar un estado (solo si no tiene transiciones asociadas)

import { prisma } from '../../../../../utils/db'

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

    const workflowId = getRouterParam(event, 'id')
    const stateId = getRouterParam(event, 'stateId')
    
    if (!workflowId || !stateId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'IDs requeridos'
      })
    }

    // Verificar que el estado existe y pertenece al workflow
    const existingState = await prisma.workflowState.findFirst({
      where: { 
        id: stateId,
        workflowId: workflowId
      },
      include: {
        transitionsFrom: true,
        transitionsTo: true,
        currentTasks: { take: 1 },
        currentRequests: { take: 1 }
      }
    })

    if (!existingState) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Estado no encontrado'
      })
    }

    // Verificar que no tiene tareas o solicitudes asociadas
    if (existingState.currentTasks.length > 0 || existingState.currentRequests.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No se puede eliminar: hay tareas o solicitudes en este estado'
      })
    }

    // Eliminar primero las transiciones asociadas
    await prisma.workflowTransition.deleteMany({
      where: {
        OR: [
          { fromStateId: stateId },
          { toStateId: stateId }
        ]
      }
    })

    // Eliminar el estado
    await prisma.workflowState.delete({
      where: { id: stateId }
    })

    return {
      success: true,
      message: 'Estado eliminado correctamente'
    }
  } catch (error: any) {
    console.error('[workflows/states/delete] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error al eliminar estado'
    })
  }
})
