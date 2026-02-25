// POST /api/tasks/[id]/complete - Completar una tarea (transición a estado done)
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { prisma } from '../../../utils/db'
import { workflowEngine } from '../../../utils/workflow/engine'

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
        currentState: true
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

    const isAdminOrRoot = ['ADMIN', 'ROOT'].includes(currentUser?.role || '')
    const isAssigned = task.assignments.length > 0

    if (!isAssigned && !isAdminOrRoot) {
      throw createError({ statusCode: 403, message: 'No estás asignado a esta tarea' })
    }

    // Ejecutar transición al estado 'done' usando el workflow engine
    const result = await workflowEngine.executeTransition({
      entityId: id,
      entityType: 'TASK',
      toStateCode: 'done',
      actorId: session.user.id,
      actorRole: currentUser!.role,
      comment: 'Tarea completada por el usuario',
      metadata: { completedBy: session.user.id, completedAt: new Date() }
    })

    if (!result.success) {
      // Si la transición a 'done' no es posible, intentar actualizar manualmente
      // (para workflows que no tengan estado 'done')
      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          completedAt: new Date()
        },
        include: {
          currentState: true
        }
      })

      return {
        success: true,
        message: 'Tarea marcada como completada',
        data: updatedTask
      }
    }

    // Actualizar fecha de completado
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { completedAt: new Date() },
      include: {
        currentState: true
      }
    })

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
