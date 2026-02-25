// server/api/admin/workflows/[id]/transitions/[transitionId].delete.ts
// Eliminar una transición

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
    const transitionId = getRouterParam(event, 'transitionId')
    
    if (!workflowId || !transitionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'IDs requeridos'
      })
    }

    // Verificar que la transición existe y pertenece al workflow
    const existingTransition = await prisma.workflowTransition.findFirst({
      where: { 
        id: transitionId,
        workflowId: workflowId
      }
    })

    if (!existingTransition) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Transición no encontrada'
      })
    }

    await prisma.workflowTransition.delete({
      where: { id: transitionId }
    })

    return {
      success: true,
      message: 'Transición eliminada correctamente'
    }
  } catch (error: any) {
    console.error('[workflows/transitions/delete] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error al eliminar transición'
    })
  }
})
