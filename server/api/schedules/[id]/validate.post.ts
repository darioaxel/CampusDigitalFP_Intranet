import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import pkg from '@prisma/client'
import { prisma } from '../../../utils/db'

const { Role, WorkflowStatus } = pkg

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }

  // Verificar que es admin/root
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  if (![Role.ADMIN, Role.ROOT].includes(currentUser?.role as any)) {
    throw createError({ statusCode: 403, message: 'No autorizado' })
  }

  const scheduleId = getRouterParam(event, 'id')
  if (!scheduleId) throw createError({ statusCode: 400, message: 'ID requerido' })

  const body = await readBody(event)
  const { action, notes } = body // action: 'VALIDAR' | 'RECHAZAR'

  if (!['VALIDAR', 'RECHAZAR'].includes(action)) {
    throw createError({ statusCode: 400, message: 'Acción inválida' })
  }

  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: { request: true }
  })

  if (!schedule) throw createError({ statusCode: 404, message: 'Horario no encontrado' })

  const newStatus = action === 'VALIDAR' ? 'VALIDADO' : 'RECHAZADO'

  try {
    // Actualizar horario
    const updated = await prisma.schedule.update({
      where: { id: scheduleId },
      data: { validationStatus: newStatus }
    })

    // Si tiene solicitud asociada, actualizarla
    if (schedule.request) {
      await prisma.request.update({
        where: { id: schedule.request.id },
        data: {
          status: action === 'VALIDAR' ? WorkflowStatus.APPROVED : WorkflowStatus.REJECTED,
          adminId: session.user.id,
          adminNotes: notes || null
        }
      })

      // Completar todas las tareas asociadas
      await prisma.task.updateMany({
        where: { requestId: schedule.request.id },
        data: { status: WorkflowStatus.DONE }
      })

      // Crear log de actividad
      await prisma.activityLog.create({
        data: {
          actorId: session.user.id,
          action: action === 'VALIDAR' ? 'SCHEDULE_VALIDATED' : 'SCHEDULE_REJECTED',
          description: `Horario "${schedule.name}" ${action === 'VALIDAR' ? 'validado' : 'rechazado'} por administración`,
          entityType: 'SCHEDULE',
          entityId: schedule.id,
          requestId: schedule.request.id
        }
      })
    }

    return {
      success: true,
      message: action === 'VALIDAR' ? 'Horario validado correctamente' : 'Horario rechazado',
      schedule: updated
    }
  } catch (error: any) {
    console.error('Error validating schedule:', error)
    throw createError({ statusCode: 500, message: 'Error al procesar validación' })
  }
})