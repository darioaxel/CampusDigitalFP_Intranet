// server/api/admin/workflows/[id]/export.get.ts
// Exportar workflow a formato JSON

import { prisma } from '../../../../utils/db'
import { workflowDbToJson } from '../../../../../app/lib/workflow-validation'

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
        states: { orderBy: { order: 'asc' } },
        transitions: {
          include: { fromState: true, toState: true }
        }
      }
    })

    if (!workflow) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Workflow no encontrado'
      })
    }

    // Convertir a formato JSON
    const jsonData = workflowDbToJson(workflow)

    return {
      success: true,
      data: jsonData,
      json: JSON.stringify(jsonData, null, 2)
    }

  } catch (error: any) {
    console.error('[workflows/export] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error al exportar workflow'
    })
  }
})
