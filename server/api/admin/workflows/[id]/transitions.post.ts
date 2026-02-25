// server/api/admin/workflows/[id]/transitions.post.ts
// Crear nueva transición entre estados

import { z } from 'zod'
import { prisma } from '../../../../utils/db'

const createTransitionSchema = z.object({
  fromStateId: z.string().uuid(),
  toStateId: z.string().uuid(),
  allowedRoles: z.array(z.string()).min(1, 'Al menos un rol permitido'),
  requiresComment: z.boolean().default(false),
  requiresFields: z.array(z.string()).optional(),
  autoActions: z.array(z.string()).optional(),
  validatorCode: z.string().optional()
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
    if (!workflowId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID requerido'
      })
    }

    const body = await readValidatedBody(event, createTransitionSchema.parse)

    // Verificar que el workflow existe
    const workflow = await prisma.workflowDefinition.findUnique({
      where: { id: workflowId },
      include: { 
        states: true,
        transitions: true
      }
    })

    if (!workflow) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Workflow no encontrado'
      })
    }

    // Verificar que ambos estados pertenecen al workflow
    const fromState = workflow.states.find(s => s.id === body.fromStateId)
    const toState = workflow.states.find(s => s.id === body.toStateId)

    if (!fromState || !toState) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Estados no válidos para este workflow'
      })
    }

    // Verificar que no existe una transición idéntica
    const existingTransition = workflow.transitions.find(
      t => t.fromStateId === body.fromStateId && t.toStateId === body.toStateId
    )

    if (existingTransition) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ya existe una transición entre estos estados'
      })
    }

    const transition = await prisma.workflowTransition.create({
      data: {
        workflowId,
        fromStateId: body.fromStateId,
        toStateId: body.toStateId,
        allowedRoles: JSON.stringify(body.allowedRoles),
        requiresComment: body.requiresComment,
        requiresFields: body.requiresFields ? JSON.stringify(body.requiresFields) : null,
        autoActions: body.autoActions ? JSON.stringify(body.autoActions) : null,
        validatorCode: body.validatorCode
      },
      include: {
        fromState: true,
        toState: true
      }
    })

    return {
      success: true,
      data: transition,
      message: 'Transición creada correctamente'
    }
  } catch (error: any) {
    console.error('[workflows/transitions/create] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error al crear transición'
    })
  }
})
