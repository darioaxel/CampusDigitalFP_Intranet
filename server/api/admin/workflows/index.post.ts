// server/api/admin/workflows/index.post.ts
// Crear nuevo workflow con estado inicial

import { z } from 'zod'
import { prisma } from '../../../utils/db'

const createWorkflowSchema = z.object({
  code: z.string().min(3).max(50).regex(/^[a-z0-9_]+$/, 'Solo minúsculas, números y guiones bajos'),
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  entityType: z.enum(['REQUEST', 'TASK']),
  initialStateName: z.string().min(2).max(50),
  initialStateCode: z.string().min(2).max(50).regex(/^[a-z0-9_]+$/)
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

    const body = await readValidatedBody(event, createWorkflowSchema.parse)

    // Verificar que el código no existe
    const existing = await prisma.workflowDefinition.findUnique({
      where: { code: body.code }
    })

    if (existing) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ya existe un workflow con ese código'
      })
    }

    // Crear workflow con estado inicial
    const workflow = await prisma.workflowDefinition.create({
      data: {
        code: body.code,
        name: body.name,
        description: body.description,
        entityType: body.entityType,
        version: 1,
        isActive: true,
        states: {
          create: {
            code: body.initialStateCode,
            name: body.initialStateName,
            color: 'blue',
            order: 1,
            isInitial: true,
            isFinal: false,
            isTerminal: false
          }
        }
      },
      include: {
        states: true,
        transitions: true
      }
    })

    return {
      success: true,
      data: workflow,
      message: 'Workflow creado correctamente'
    }
  } catch (error: any) {
    console.error('[workflows/create] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error al crear workflow'
    })
  }
})
