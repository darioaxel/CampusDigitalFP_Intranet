// GET /api/calendars/free-disposition - Obtener calendario de libre disposición activo con contadores
import { defineEventHandler, createError } from 'h3'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session?.user?.id) {
      throw createError({ statusCode: 401, message: 'No autenticado' })
    }

    // Obtener el workflow de días libres
    const freeDayWorkflow = await prisma.workflowDefinition.findUnique({
      where: { code: 'request_free_day' },
      include: { states: true }
    })

    if (!freeDayWorkflow) {
      throw createError({ statusCode: 500, message: 'Workflow no configurado' })
    }

    const approvedState = freeDayWorkflow.states.find(s => s.code === 'approved')

    // Buscar calendario de libre disposición activo
    const calendar = await prisma.calendar.findFirst({
      where: {
        type: 'FREE_DISPOSITION',
        isActive: true,
      },
      include: {
        events: {
          where: { isActive: true },
          orderBy: { startDate: 'asc' }
        }
      }
    })

    if (!calendar) {
      return {
        success: true,
        data: null,
        message: 'No hay calendario de libre disposición activo'
      }
    }

    // Obtener solicitudes aprobadas para cada día
    const approvedRequests = await prisma.request.groupBy({
      by: ['requestedDate'],
      where: {
        workflowId: freeDayWorkflow.id,
        currentStateId: approvedState?.id,
        requestedDate: {
          gte: calendar.startDate,
          lte: calendar.endDate
        }
      },
      _count: {
        id: true
      }
    })

    // Obtener solicitud del usuario actual para cada día (incluyendo todas las solicitudes, no solo aprobadas)
    const myRequests = await prisma.request.findMany({
      where: {
        requesterId: session.user.id,
        workflowId: freeDayWorkflow.id,
        requestedDate: {
          gte: calendar.startDate,
          lte: calendar.endDate
        }
      },
      include: {
        currentState: true
      },
      select: {
        id: true,
        requestedDate: true,
        currentState: true
      }
    })

    // Contar días aprobados del usuario
    const myApprovedCount = await prisma.request.count({
      where: {
        requesterId: session.user.id,
        workflowId: freeDayWorkflow.id,
        currentStateId: approvedState?.id
      }
    })

    // Formatear días con contadores
    const daysMap = new Map()
    
    // Marcar días del calendario como disponibles
    calendar.events.forEach(event => {
      const dateStr = event.startDate.toISOString().split('T')[0]
      daysMap.set(dateStr, {
        date: dateStr,
        isAvailable: true,
        approvedCount: 0,
        myStatus: null,
        myRequestId: null,
        maxAllowed: event.maxAssignments || 3,
        eventId: event.id
      })
    })

    // Agregar contadores de aprobados
    approvedRequests.forEach(req => {
      const dateStr = req.requestedDate?.toISOString().split('T')[0]
      if (dateStr && daysMap.has(dateStr)) {
        daysMap.get(dateStr).approvedCount = req._count.id
      }
    })

    // Agregar estado del usuario actual
    myRequests.forEach(req => {
      const dateStr = req.requestedDate?.toISOString().split('T')[0]
      if (dateStr && daysMap.has(dateStr)) {
        const day = daysMap.get(dateStr)
        day.myStatus = req.currentState?.name || 'Pendiente'
        day.myRequestId = req.id
      }
    })

    return {
      success: true,
      data: {
        calendar: {
          id: calendar.id,
          name: calendar.name,
          academicYear: calendar.academicYear,
          maxPerUser: calendar.maxEventsPerUser || 4,
          startDate: calendar.startDate.toISOString().split('T')[0],
          endDate: calendar.endDate.toISOString().split('T')[0],
        },
        days: Array.from(daysMap.values()),
        myStats: {
          approved: myApprovedCount,
          remaining: Math.max(0, (calendar.maxEventsPerUser || 4) - myApprovedCount)
        }
      }
    }
  } catch (error: any) {
    console.error('Error fetching free disposition calendar:', error)
    throw createError({
      statusCode: 500,
      message: 'Error al cargar el calendario de libre disposición'
    })
  }
})
