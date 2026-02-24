// GET /api/calendars/free-disposition - Obtener calendario de libre disposición activo con contadores
import { defineEventHandler, createError } from 'h3'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session?.user?.id) {
      throw createError({ statusCode: 401, message: 'No autenticado' })
    }

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
        type: 'FREE_DAY',
        status: 'APPROVED',
        requestedDate: {
          gte: calendar.startDate,
          lte: calendar.endDate
        }
      },
      _count: {
        id: true
      }
    })

    // Obtener solicitud del usuario actual para cada día
    const myRequests = await prisma.request.findMany({
      where: {
        requesterId: session.user.id,
        type: 'FREE_DAY',
        requestedDate: {
          gte: calendar.startDate,
          lte: calendar.endDate
        }
      },
      select: {
        id: true,
        requestedDate: true,
        status: true
      }
    })

    // Contar días aprobados del usuario
    const myApprovedCount = await prisma.request.count({
      where: {
        requesterId: session.user.id,
        type: 'FREE_DAY',
        status: 'APPROVED'
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
        day.myStatus = req.status
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
