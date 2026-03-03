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
    select: { role: true, firstName: true, lastName: true }
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
    include: { 
      request: true,
      user: { select: { firstName: true, lastName: true, email: true } }
    }
  })

  if (!schedule) throw createError({ statusCode: 404, message: 'Horario no encontrado' })
  
  // Solo se puede validar si está en PENDIENTE
  if (schedule.validationStatus !== 'PENDIENTE') {
    throw createError({ statusCode: 400, message: 'El horario no está pendiente de validación' })
  }

  const newStatus = action === 'VALIDAR' ? 'VALIDADO' : 'RECHAZADO'
  const toStateCode = action === 'VALIDAR' ? 'approved' : 'rejected'

  try {
    // Si tiene solicitud asociada, usar el workflow engine para transicionar
    if (schedule.request) {
      // Ejecutar transición usando el workflow engine
      await workflowEngine.executeTransition({
        entityId: schedule.request.id,
        entityType: 'REQUEST',
        toStateCode: toStateCode,
        actorId: session.user.id,
        actorRole: currentUser!.role,
        comment: notes || `Horario ${action === 'VALIDAR' ? 'validado' : 'rechazado'} por ${currentUser?.firstName} ${currentUser?.lastName}`,
        metadata: { scheduleId: schedule.id, action }
      })

      // Actualizar adminId y notas manualmente
      await prisma.request.update({
        where: { id: schedule.request.id },
        data: {
          adminId: session.user.id,
          adminNotes: notes || null
        }
      })
    }

    // Actualizar horario
    const updated = await prisma.schedule.update({
      where: { id: scheduleId },
      data: { 
        validationStatus: newStatus,
        isActive: action === 'VALIDAR' // Solo activo si está validado
      }
    })

    // Crear log de actividad
    await prisma.activityLog.create({
      data: {
        actorId: session.user.id,
        action: action === 'VALIDAR' ? 'SCHEDULE_VALIDATED' : 'SCHEDULE_REJECTED',
        description: `Horario "${schedule.name}" ${action === 'VALIDAR' ? 'validado' : 'rechazado'} por ${currentUser?.firstName} ${currentUser?.lastName}`,
        entityType: 'SCHEDULE',
        entityId: schedule.id,
        requestId: schedule.request?.id || null
      }
    })
    
    // Crear notificación para el profesor
    try {
      await prisma.workflowNotification.create({
        data: {
          userId: schedule.userId,
          title: action === 'VALIDAR' ? 'Horario validado' : 'Horario rechazado',
          message: action === 'VALIDAR' 
            ? `Tu horario "${schedule.name}" ha sido validado correctamente.`
            : `Tu horario "${schedule.name}" ha sido rechazado. ${notes ? `Motivo: ${notes}` : 'Contacta con administración para más detalles.'}`,
          type: action === 'VALIDAR' ? 'success' : 'error',
          requestId: schedule.request?.id || null,
          actionUrl: `/usuario/horarios`,
          actionLabel: 'Ver horarios'
        }
      })
    } catch (notifError) {
      console.error('Error creando notificación:', notifError)
    }

    return {
      success: true,
      message: action === 'VALIDAR' ? 'Horario validado correctamente' : 'Horario rechazado',
      schedule: updated
    }
  } catch (error: any) {
    console.error('Error validating schedule:', error)
    throw createError({ statusCode: 500, message: error.message || 'Error al procesar validación' })
  }
})
