import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import { prisma } from '../../../utils/db'
import { workflowEngine } from '../../../utils/workflow/engine'

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
    // Obtener workflows configurables
    const requestWorkflow = await prisma.workflowDefinition.findUnique({
      where: { code: 'request_standard' },
      include: { states: true }
    })
    
    const taskWorkflow = await prisma.workflowDefinition.findUnique({
      where: { code: 'task_validation' },
      include: { states: true }
    })

    if (!requestWorkflow || !taskWorkflow) {
      throw createError({ statusCode: 500, message: 'Workflows no configurados' })
    }

    const requestInitialState = requestWorkflow.states.find(s => s.isInitial)!
    const taskInitialState = taskWorkflow.states.find(s => s.isInitial)!

    // Crear solicitud de workflow usando el motor configurable
    const request = await prisma.request.create({
      data: {
        workflowId: requestWorkflow.id,
        currentStateId: requestInitialState.id,
        title: `Validar horario: ${schedule.name}`,
        description: `El profesor ${schedule.user.firstName} ${schedule.user.lastName} solicita validación de su horario "${schedule.name}".
        
Bloques: ${schedule.blocks.length} días configurados.
${notes ? `
Notas del profesor: ${notes}` : ''}`,
        requesterId: session.user.id,
        context: JSON.stringify({ type: 'SCHEDULE_VALIDATION', scheduleId: schedule.id })
      }
    })

    // Crear tarea para todos los admins/roots
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'ROOT'] } },
      select: { id: true }
    })

    await prisma.task.create({
      data: {
        workflowId: taskWorkflow.id,
        currentStateId: taskInitialState.id,
        title: `Revisar horario: ${schedule.name}`,
        description: `Validar horario de ${schedule.user.firstName} ${schedule.user.lastName}. Verificar bloques y asignaciones.`,
        creatorId: session.user.id,
        context: JSON.stringify({ type: 'REVIEW', scheduleId: schedule.id, requestId: request.id }),
        assignments: {
          create: admins.map(admin => ({
            assigneeId: admin.id
          }))
        }
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

    return {
      success: true,
      message: 'Horario enviado para validación',
      schedule: updatedSchedule
    }
  } catch (error: any) {
    console.error('Error requesting validation:', error)
    throw createError({ statusCode: 500, message: 'Error al enviar solicitud' })
  }
})
