// POST /api/tasks/[id]/complete - Completar una tarea
import { defineEventHandler, createError, getRouterParam } from 'h3'
import pkg from '@prisma/client'
import { prisma } from '../../../utils/db'

const { WorkflowStatus, Role } = pkg

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
    // Verificar que la tarea existe y pertenece al usuario (o es admin)
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { assigneeId: session.user.id }
        },
        request: true
      }
    })

    if (!task) {
      throw createError({ statusCode: 404, message: 'Tarea no encontrada' })
    }

    // Verificar permisos
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const isAdminOrRoot = [Role.ADMIN, Role.ROOT].includes(currentUser?.role as any)
    const isAssigned = task.assignments.length > 0

    if (!isAssigned && !isAdminOrRoot) {
      throw createError({ statusCode: 403, message: 'No estás asignado a esta tarea' })
    }

    // Completar la tarea
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: WorkflowStatus.DONE,
        completedAt: new Date()
      }
    })

    // Si tiene solicitud asociada, actualizar el estado de la asignación
    if (task.request) {
      await prisma.taskAssignment.updateMany({
        where: {
          taskId: id,
          assigneeId: session.user.id
        },
        data: {
          status: WorkflowStatus.DONE
        }
      })
    }

    return {
      success: true,
      message: 'Tarea completada correctamente',
      data: updatedTask
    }
  } catch (error: any) {
    console.error('Error completing task:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al completar la tarea'
    })
  }
})
