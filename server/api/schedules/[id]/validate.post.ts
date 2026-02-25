import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import { prisma } from '../../../utils/db'
import { workflowEngine } from '../../../utils/workflow/engine'

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

  if (!['ADMIN', 'ROOT'].includes(currentUser?.role || '')) {
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

    // Si tiene solicitud asociada, usar el workflow engine para transicionar
    if (schedule.request) {
      const toStateCode = action === 'VALIDAR' ? 'approved' : 'rejected'
      
      // Ejecutar transición usando el workflow engine
      await workflowEngine.executeTransition({
        entityId: schedule.request.id,
        entityType: 'REQUEST',
        toStateCode: toStateCode,
        actorId: session.user.id,
        actorRole: currentUser!.role,
        comment: notes || `Horario ${action === 'VALIDAR' ? 'validado' : 'rechazado'}`,
        metadata: { scheduleId: schedule.id, action }
      })

      // Actualizar adminId y notas manualmente (si es necesario)
      await prisma.request.update({
        where: { id: schedule.request.id },
        data: {
          adminId: session.user.id,
          adminNotes: notes || null
        }
      })

      // Completar todas las tareas asociadas (usando el workflow engine)
      const relatedTasks = await prisma.task.findMany({
        where: { 
          context: {
            contains: `"requestId":"${schedule.request.id}"`
          }
        }
      })

      for (const task of relatedTasks) {
        try {
          await workflowEngine.executeTransition({
            entityId: task.id,
            entityType: 'TASK',
            toStateCode: 'done',
            actorId: session.user.id,
            actorRole: currentUser!.role,
            comment: `Completada por ${action === 'VALIDAR' ? 'validación' : 'rechazo'} de horario`
          })
        } catch (e) {
          // Si la transición falla, simplemente marcar como completada
          await prisma.task.update({
            where: { id: task.id },
            data: { completedAt: new Date() }
          })
        }
      }

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
