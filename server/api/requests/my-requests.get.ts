// server/api/requests/my-requests.get.ts
// Listar solicitudes del usuario autenticado con filtros

import { z } from 'zod'

const querySchema = z.object({
  type: z.string().optional(),
  status: z.string().optional(),
  include: z.enum(['all', 'active', 'completed']).optional().default('active'),
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

  // Validar query params
  const query = getQuery(event)
  const validation = querySchema.safeParse(query)
  
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: 'Parámetros inválidos',
      data: validation.error.flatten(),
    })
  }

  const { type, status, include } = validation.data

  try {
    // Construir where clause
    const where: any = {
      requesterId: session.user.id,
    }

    // Filtrar por tipo (buscando en el contexto JSON)
    if (type) {
      where.context = {
        contains: `"type":"${type}"`,
      }
    }

    // Filtrar por estado de finalización
    if (include === 'active') {
      where.currentState = {
        isFinal: false,
      }
    } else if (include === 'completed') {
      where.currentState = {
        isFinal: true,
      }
    }

    // Filtrar por código de estado específico
    if (status) {
      where.currentState = {
        code: status,
      }
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        currentState: true,
        documents: {
          include: {
            file: {
              select: {
                id: true,
                name: true,
                size: true,
              },
            },
          },
        },
        _count: {
          select: {
            documents: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      success: true,
      data: requests,
    }
  } catch (error) {
    console.error('Error fetching requests:', error)
    throw createError({
      statusCode: 500,
      message: 'Error al obtener las solicitudes',
    })
  }
})
