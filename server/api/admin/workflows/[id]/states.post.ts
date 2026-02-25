// server/api/admin/workflows/[id]/states.post.ts
// Añadir nuevo estado a un workflow

import { z } from 'zod'
import { prisma } from '../../../../utils/db'

const createStateSchema = z.object({
  code: z.string().min(2).max(50).regex(/^[a-z0-9_]+$/, 'Solo minúsculas, números y guiones bajos'),
  name: z.string().min(2).max(50),
  color: z.string().default('gray'),
  isInitial: z.boolean().default(false),
  isFinal: z.boolean().default(false),
  isTerminal: z.boolean().default(false),
  config: z.string().optional() // JSON string
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

    const body = await readValidatedBody(event, createStateSchema.parse)

    // Verificar que el workflow existe
    const workflow = await prisma.workflowDefinition.findUnique({
      where: { id },
      include: { states: true }
    })

    if (!workflow) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Workflow no encontrado'
      })
    }

    // Verificar que el código no existe en este workflow
    const existingState = workflow.states.find(s => s.code === body.code)
    if (existingState) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ya existe un estado con ese código en este workflow'
      })
    }

    // Si es estado inicial, verificar que no haya otro
    if (body.isInitial) {
      const existingInitial = workflow.states.find(s => s.isInitial)
      if (existingInitial) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Ya existe un estado inicial en este workflow'
        })
      }
    }

    // Calcular el orden (último + 1)
    const maxOrder = workflow.states.reduce((max, s) => Math.max(max, s.order), 0)

    const state = await prisma.workflowState.create({
      data: {
        workflowId: id,
        code: body.code,
        name: body.name,
        color: body.color,
        order: maxOrder + 1,
        isInitial: body.isInitial,
        isFinal: body.isFinal,
        isTerminal: body.isTerminal,
        config: body.config
      }
    })

    return {
      success: true,
      data: state,
      message: 'Estado creado correctamente'
    }
  } catch (error: any) {
    console.error('[workflows/states/create] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error al crear estado'
    })
  }
})
