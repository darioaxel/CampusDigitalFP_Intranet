// server/api/admin/workflows/[id]/states/[stateId].put.ts
// Actualizar un estado existente

import { z } from 'zod'
import { prisma } from '../../../../../utils/db'

const updateStateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  color: z.string().optional(),
  isInitial: z.boolean().optional(),
  isFinal: z.boolean().optional(),
  isTerminal: z.boolean().optional(),
  config: z.string().optional(),
  order: z.number().int().optional()
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

    const workflowId = getRouterParam(event, 'id')
    const stateId = getRouterParam(event, 'stateId')
    
    if (!workflowId || !stateId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'IDs requeridos'
      })
    }

    const body = await readValidatedBody(event, updateStateSchema.parse)

    // Verificar que el estado existe y pertenece al workflow
    const existingState = await prisma.workflowState.findFirst({
      where: { 
        id: stateId,
        workflowId: workflowId
      }
    })

    if (!existingState) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Estado no encontrado'
      })
    }

    // Si se está marcando como inicial, verificar que no haya otro
    if (body.isInitial && !existingState.isInitial) {
      const workflow = await prisma.workflowDefinition.findUnique({
        where: { id: workflowId },
        include: { states: true }
      })
      
      const existingInitial = workflow?.states.find(s => s.isInitial && s.id !== stateId)
      if (existingInitial) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Ya existe un estado inicial en este workflow'
        })
      }
    }

    const state = await prisma.workflowState.update({
      where: { id: stateId },
      data: body
    })

    return {
      success: true,
      data: state,
      message: 'Estado actualizado correctamente'
    }
  } catch (error: any) {
    console.error('[workflows/states/update] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error al actualizar estado'
    })
  }
})
