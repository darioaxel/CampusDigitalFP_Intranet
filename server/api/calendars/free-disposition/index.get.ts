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

    // Verificar si el usuario tiene solicitudes pendientes (para calcular canRequest)
    const myPendingCount = await prisma.request.count({
      where: {
        requesterId: session.user.id,
        workflowId: freeDayWorkflow.id,
        currentStateId: {
          not: approvedState?.id
        }
      }
    })

    // Total de días usados (aprobados + pendientes)
    const totalUsedDays = myApprovedCount + myPendingCount
    const maxPerUser = calendar.maxEventsPerUser || 4
    const hasReachedLimit = totalUsedDays >= maxPerUser

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
        eventId: event.id,
        isFull: false,
        canRequest: false
      })
    })

    // Agregar contadores de aprobados
    approvedRequests.forEach(req => {
      const dateStr = req.requestedDate?.toISOString().split('T')[0]
      if (dateStr && daysMap.has(dateStr)) {
        const day = daysMap.get(dateStr)
        day.approvedCount = req._count.id
        day.isFull = req._count.id >= 3
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

    // Calcular canRequest para cada día
    daysMap.forEach(day => {
      // Puede solicitar si:
      // 1. El día está disponible
      // 2. El día no está lleno (menos de 3 aprobados)
      // 3. El usuario no tiene solicitud previa para este día
      // 4. El usuario no ha alcanzado el límite de 4 días
      day.canRequest = day.isAvailable && 
                       !day.isFull && 
                       !day.myStatus && 
                       !hasReachedLimit
    })

    return {
      success: true,
      data: {
        calendar: {
          id: calendar.id,
          name: calendar.name,
          academicYear: calendar.academicYear,
          maxPerUser: maxPerUser,
          startDate: calendar.startDate.toISOString().split('T')[0],
          endDate: calendar.endDate.toISOString().split('T')[0],
        },
        days: Array.from(daysMap.values()),
        myStats: {
          approved: myApprovedCount,
          pending: myPendingCount,
          used: totalUsedDays,
          remaining: Math.max(0, maxPerUser - totalUsedDays),
          hasReachedLimit
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
