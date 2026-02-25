// POST /api/calendars/free-disposition/request - Solicitar un día de libre disposición
import { defineEventHandler, createError, readBody } from 'h3'
import { z } from 'zod'
import { prisma } from '../../../utils/db'

const requestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  reason: z.string().max(500).optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session?.user?.id) {
      throw createError({ statusCode: 401, message: 'No autenticado' })
    }

    const body = await readBody(event)
    const { date, reason } = requestSchema.parse(body)

    // Parsear la fecha solicitada
    const [year, month, day] = date.split('-').map(Number)
    const requestedDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))

    // Buscar calendario activo
    const calendar = await prisma.calendar.findFirst({
      where: {
        type: 'FREE_DISPOSITION',
        isActive: true,
      }
    })

    if (!calendar) {
      throw createError({ statusCode: 404, message: 'No hay calendario de libre disposición activo' })
    }

    // Verificar que la fecha está en el calendario
    // Buscamos comparando solo la fecha (YYYY-MM-DD) para evitar problemas de timezone
    const allEvents = await prisma.calendarEvent.findMany({
      where: {
        calendarId: calendar.id,
        isActive: true
      },
      select: {
        id: true,
        startDate: true,
        maxAssignments: true
      }
    })
    
    // Encontrar evento que coincida con la fecha solicitada
    const eventDay = allEvents.find(event => {
      const eventDateStr = event.startDate.toISOString().split('T')[0]
      return eventDateStr === date
    })

    if (!eventDay) {
      throw createError({ statusCode: 400, message: 'La fecha seleccionada no está disponible para libre disposición' })
    }

    // Obtener workflow de días libres
    const freeDayWorkflow = await prisma.workflowDefinition.findUnique({
      where: { code: 'request_free_day' }
    })

    if (!freeDayWorkflow) {
      throw createError({ statusCode: 500, message: 'Workflow no configurado' })
    }

    // Obtener estado inicial del workflow
    const initialState = await prisma.workflowState.findFirst({
      where: {
        workflowId: freeDayWorkflow.id,
        isInitial: true
      }
    })

    if (!initialState) {
      throw createError({ statusCode: 500, message: 'Estado inicial no configurado' })
    }

    // Verificar que no ha excedido el límite de días aprobados
    const approvedState = await prisma.workflowState.findFirst({
      where: {
        workflowId: freeDayWorkflow.id,
        code: 'approved'
      }
    })

    const userApprovedCount = await prisma.request.count({
      where: {
        requesterId: session.user.id,
        workflowId: freeDayWorkflow.id,
        currentStateId: approvedState?.id
      }
    })

    if (userApprovedCount >= (calendar.maxEventsPerUser || 4)) {
      throw createError({ statusCode: 400, message: 'Has alcanzado el límite de días de libre disposición' })
    }

    // Verificar que no hay solicitud previa para esa fecha
    // Comparamos fechas ignorando la hora
    const allUserRequests = await prisma.request.findMany({
      where: {
        requesterId: session.user.id,
        workflowId: freeDayWorkflow.id
      },
      select: {
        id: true,
        requestedDate: true
      }
    })
    
    const existingRequest = allUserRequests.find(req => {
      if (!req.requestedDate) return false
      const reqDateStr = req.requestedDate.toISOString().split('T')[0]
      return reqDateStr === date
    })

    if (existingRequest) {
      throw createError({ statusCode: 400, message: 'Ya tienes una solicitud para esa fecha' })
    }

    // Verificar que no está lleno (3 solicitudes aprobadas)
    const allApprovedRequests = await prisma.request.findMany({
      where: {
        workflowId: freeDayWorkflow.id,
        currentStateId: approvedState?.id
      },
      select: {
        requestedDate: true
      }
    })
    
    const approvedCount = allApprovedRequests.filter(req => {
      if (!req.requestedDate) return false
      const reqDateStr = req.requestedDate.toISOString().split('T')[0]
      return reqDateStr === date
    }).length

    if (approvedCount >= 3) {
      throw createError({ statusCode: 400, message: 'Ese día ya tiene el máximo de solicitudes aprobadas' })
    }

    // Crear la solicitud usando el workflow
    const request = await prisma.request.create({
      data: {
        title: `Día libre disposición - ${date}`,
        description: reason || undefined,
        requestedDate: requestedDate,
        requesterId: session.user.id,
        workflowId: freeDayWorkflow.id,
        currentStateId: initialState.id,
        context: JSON.stringify({ type: 'FREE_DAY', date: date })
      }
    })

    // Crear historial de estado inicial
    await prisma.stateHistory.create({
      data: {
        requestId: request.id,
        fromStateId: initialState.id,
        toStateId: initialState.id,
        actorId: session.user.id,
        comment: 'Solicitud creada'
      }
    })

    return {
      success: true,
      data: {
        requestId: request.id,
        message: 'Solicitud enviada correctamente'
      }
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, message: 'Datos inválidos', data: error.errors })
    }
    console.error('Error requesting free day:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error al solicitar el día'
    })
  }
})
