// server/api/requests/index.get.ts
// Listar solicitudes (para administradores)

import { z } from 'zod'

const querySchema = z.object({
  type: z.string().optional(),
  status: z.string().optional(),
  state: z.string().optional(),
  include: z.enum(['all', 'active', 'completed']).optional().default('all'),
  limit: z.string().optional().default('50'),
  offset: z.string().optional().default('0'),
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

  // Verificar que es admin
  if (!['ADMIN', 'ROOT'].includes(session.user.role)) {
    throw createError({
      statusCode: 403,
      message: 'No tienes permiso para ver todas las solicitudes',
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

  const { type, status, state, include, limit, offset } = validation.data

  try {
    // Construir where clause
    const where: any = {}

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
    if (state) {
      where.currentState = {
        code: state,
      }
    }

    // Filtrar por estado legacy
    if (status) {
      where.status = status
    }

    const limitNum = parseInt(limit)
    const offsetNum = parseInt(offset)

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
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
          stateHistory: {
            include: {
              toState: true,
              actor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limitNum,
        skip: offsetNum,
      }),
      prisma.request.count({ where }),
    ])

    return {
      success: true,
      data: requests,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total,
      },
    }
  } catch (error) {
    console.error('Error fetching requests:', error)
    throw createError({
      statusCode: 500,
      message: 'Error al obtener las solicitudes',
    })
  }
})
