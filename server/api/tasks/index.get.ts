// GET /api/tasks - Listar tareas del usuario o todas (si es admin)
import { defineEventHandler, createError, getQuery } from 'h3'
import pkg from '@prisma/client'
import { prisma } from '../../utils/db'

const { Role, WorkflowStatus } = pkg

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const query = getQuery(event)
  const { status, type, limit = '50', offset = '0' } = query

  try {
    // Verificar rol del usuario
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const isAdminOrRoot = [Role.ADMIN, Role.ROOT].includes(currentUser?.role as any)

    // Construir where clause
    const where: any = {}

    // Filtrar por estado si se proporciona
    if (status) {
      where.status = status as string
    }

    // Filtrar por tipo si se proporciona
    if (type) {
      where.type = type as string
    }

    let tasks: any[] = []

    if (isAdminOrRoot) {
      // Admin/Root: ver tareas asignadas a ellos o tareas de revisión pendientes
      tasks = await prisma.task.findMany({
        where: {
          ...where,
          OR: [
            {
              assignments: {
                some: {
                  assigneeId: session.user.id
                }
              }
            },
            // También ver tareas de revisión que no tienen asignaciones específicas
            {
              type: 'REVIEW',
              status: { in: ['TODO', 'IN_PROGRESS'] }
            }
          ]
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          assignments: {
            where: {
              assigneeId: session.user.id
            },
            select: {
              id: true,
              status: true
            }
          },
          request: {
            select: {
              id: true,
              type: true,
              status: true
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { createdAt: 'desc' }
        ],
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      })
    } else {
      // Usuario normal: solo ver tareas asignadas a él
      tasks = await prisma.task.findMany({
        where: {
          ...where,
          assignments: {
            some: {
              assigneeId: session.user.id
            }
          }
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          assignments: {
            where: {
              assigneeId: session.user.id
            },
            select: {
              id: true,
              status: true
            }
          },
          request: {
            select: {
              id: true,
              type: true,
              status: true
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { createdAt: 'desc' }
        ],
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      })
    }

    return {
      success: true,
      data: tasks,
      meta: {
        total: tasks.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    }
  } catch (error: any) {
    console.error('Error fetching tasks:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al cargar las tareas'
    })
  }
})
