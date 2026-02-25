// GET /api/tasks - Listar tareas del usuario o todas (si es admin)
import { defineEventHandler, createError, getQuery } from 'h3'
import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const query = getQuery(event)
  const { stateCode, workflowCode, limit = '50', offset = '0' } = query

  try {
    // Verificar rol del usuario
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const isAdminOrRoot = ['ADMIN', 'ROOT'].includes(currentUser?.role || '')

    // Construir where clause
    const where: any = {}

    // Filtrar por código de estado si se proporciona
    if (stateCode) {
      where.currentState = {
        code: stateCode as string
      }
    }

    // Filtrar por código de workflow si se proporciona
    if (workflowCode) {
      where.workflow = {
        code: workflowCode as string
      }
    }

    let tasks: any[] = []

    if (isAdminOrRoot) {
      // Admin/Root: ver tareas asignadas a ellos o todas las tareas
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
            // También ver tareas creadas por ellos
            {
              creatorId: session.user.id
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
          currentState: {
            select: {
              id: true,
              code: true,
              name: true,
              color: true
            }
          },
          workflow: {
            select: {
              id: true,
              code: true,
              name: true
            }
          },
          assignments: {
            where: {
              assigneeId: session.user.id
            },
            select: {
              id: true,
              completedAt: true
            }
          },
          _count: {
            select: {
              assignments: true
            }
          }
        },
        orderBy: [
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
          currentState: {
            select: {
              id: true,
              code: true,
              name: true,
              color: true
            }
          },
          workflow: {
            select: {
              id: true,
              code: true,
              name: true
            }
          },
          assignments: {
            where: {
              assigneeId: session.user.id
            },
            select: {
              id: true,
              completedAt: true
            }
          }
        },
        orderBy: [
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
