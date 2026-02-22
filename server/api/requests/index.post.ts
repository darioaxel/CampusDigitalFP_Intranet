// server/api/requests/index.post.ts
// Crear una nueva solicitud

import { z } from 'zod'
import { canCreateRequest } from '../../utils/workflow/stateMachine'
import type { RequestType } from '@prisma/client'

const createRequestSchema = z.object({
  type: z.enum(['FREE_DAY', 'MEDICAL_APPOINTMENT', 'LEAVE', 'TRAINING', 'OTHER']),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  requestedDate: z.string().datetime().optional(), // ISO string
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export default defineEventHandler(async (event) => {
  // Verificar autenticación
  const session = await getUserSession(event)
  
  if (!session.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'No autenticado',
    })
  }

  // Validar body
  const body = await readBody(event)
  const validation = createRequestSchema.safeParse(body)
  
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: 'Datos inválidos',
      data: validation.error.flatten(),
    })
  }

  const data = validation.data

  // Verificar permisos según el tipo de solicitud
  if (!canCreateRequest(session.user.role as RequestType, data.type as RequestType)) {
    throw createError({
      statusCode: 403,
      message: 'No tienes permiso para crear este tipo de solicitud',
    })
  }

  // Validaciones de fechas
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    if (start > end) {
      throw createError({
        statusCode: 400,
        message: 'La fecha de inicio no puede ser posterior a la fecha de fin',
      })
    }
  }

  try {
    // Crear la solicitud
    const request = await prisma.request.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        requestedDate: data.requestedDate ? new Date(data.requestedDate) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        requesterId: session.user.id,
        status: 'PENDING',
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        documents: {
          select: {
            id: true,
            status: true,
            file: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Crear log de actividad
    await prisma.activityLog.create({
      data: {
        actorId: session.user.id,
        action: 'REQUEST_CREATED',
        description: `Solicitud "${data.title}" creada`,
        entityType: 'REQUEST',
        entityId: request.id,
        requestId: request.id,
        metadata: JSON.stringify({
          type: data.type,
          title: data.title,
        }),
      },
    })

    return {
      success: true,
      data: request,
    }
  } catch (error) {
    console.error('Error creating request:', error)
    throw createError({
      statusCode: 500,
      message: 'Error al crear la solicitud',
    })
  }
})
