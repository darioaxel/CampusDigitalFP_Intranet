// server/api/admin/workflows/[id].put.ts
// Actualizar información básica del workflow

import { z } from 'zod'
import { prisma } from '../../../utils/db'

const updateWorkflowSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional()
})

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

    const body = await readValidatedBody(event, updateWorkflowSchema.parse)

    // Verificar que existe
    const existing = await prisma.workflowDefinition.findUnique({
      where: { id }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Workflow no encontrado'
      })
    }

    const workflow = await prisma.workflowDefinition.update({
      where: { id },
      data: body,
      include: {
        states: {
          orderBy: { order: 'asc' }
        },
        transitions: {
          include: {
            fromState: true,
            toState: true
          }
        }
      }
    })

    return {
      success: true,
      data: workflow,
      message: 'Workflow actualizado correctamente'
    }
  } catch (error: any) {
    console.error('[workflows/update] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error al actualizar workflow'
    })
  }
})
