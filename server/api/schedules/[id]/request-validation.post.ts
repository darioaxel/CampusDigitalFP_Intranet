import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }

  const scheduleId = getRouterParam(event, 'id')
  if (!scheduleId) throw createError({ statusCode: 400, message: 'ID requerido' })

  const body = await readBody(event)
  const { notes } = body || {}

  // Verificar horario existe y pertenece al usuario
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: { 
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      blocks: true 
    }
  })

  if (!schedule) throw createError({ statusCode: 404, message: 'Horario no encontrado' })
  if (schedule.userId !== session.user.id) {
    throw createError({ statusCode: 403, message: 'No puedes enviar a validación un horario que no es tuyo' })
  }

  // Solo se puede enviar si está en BORRADOR o RECHAZADO
  if (!['BORRADOR', 'RECHAZADO'].includes(schedule.validationStatus)) {
    throw createError({ statusCode: 400, message: 'El horario ya está pendiente de validación o validado' })
  }

  try {
    // Obtener workflow de validación de horarios
    const workflow = await prisma.workflowDefinition.findUnique({
      where: { code: 'request_schedule_validation' },
      include: { states: true }
    })

    if (!workflow) {
      throw createError({ statusCode: 500, message: 'Workflow de validación de horarios no configurado' })
    }

    const initialState = workflow.states.find(s => s.isInitial)
    if (!initialState) {
      throw createError({ statusCode: 500, message: 'Estado inicial del workflow no encontrado' })
    }

    // Crear solicitud de validación
    const request = await prisma.request.create({
      data: {
        workflowId: workflow.id,
        currentStateId: initialState.id,
        title: `Validar horario: ${schedule.name}`,
        description: `El profesor ${schedule.user.firstName} ${schedule.user.lastName} solicita validación de su horario "${schedule.name}".
        
Bloques: ${schedule.blocks.length} días configurados.
${notes ? `
Notas del profesor: ${notes}` : ''}`,
        requesterId: session.user.id,
        context: JSON.stringify({ type: 'SCHEDULE_VALIDATION', scheduleId: schedule.id })
      }
    })

    // Actualizar horario vinculándolo a la solicitud
    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        validationStatus: 'PENDIENTE',
        requestId: request.id
      }
    })

    // Crear notificaciones para los admins
    try {
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'ROOT'] } },
        select: { id: true }
      })
      
      await prisma.workflowNotification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          title: 'Nuevo horario pendiente de validación',
          message: `${schedule.user.firstName} ${schedule.user.lastName} ha solicitado la validación de su horario "${schedule.name}".`,
          type: 'warning',
          requestId: request.id,
          actionUrl: `/admin/solicitudes/${request.id}`,
          actionLabel: 'Revisar'
        }))
      })
    } catch (notifError) {
      console.error('Error creando notificaciones:', notifError)
    }

    return {
      success: true,
      message: 'Horario enviado para validación',
      schedule: updatedSchedule,
      requestId: request.id
    }
  } catch (error: any) {
    console.error('Error requesting validation:', error)
    throw createError({ statusCode: 500, message: error.message || 'Error al enviar solicitud' })
  }
})
