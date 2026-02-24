// GET /api/tasks/[id] - Obtener una tarea específica
import { defineEventHandler, createError, getRouterParam } from 'h3'
import pkg from '@prisma/client'
import { prisma } from '../../../utils/db'

const { Role } = pkg

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de tarea requerido' })
  }

  try {
    // Verificar rol del usuario
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const isAdminOrRoot = [Role.ADMIN, Role.ROOT].includes(currentUser?.role as any)

    // Buscar la tarea
    const task = await prisma.task.findUnique({
      where: { id },
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
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        request: {
          include: {
            requester: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!task) {
      throw createError({ statusCode: 404, message: 'Tarea no encontrada' })
    }

    // Verificar permisos
    const isAssigned = task.assignments.some(a => a.assigneeId === session.user.id)
    const isCreator = task.creatorId === session.user.id

    if (!isAssigned && !isCreator && !isAdminOrRoot) {
      throw createError({ statusCode: 403, message: 'No autorizado para ver esta tarea' })
    }

    return {
      success: true,
      data: task
    }
  } catch (error: any) {
    console.error('Error fetching task:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al cargar la tarea'
    })
  }
})
