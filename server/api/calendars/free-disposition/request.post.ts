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

    const requestedDate = new Date(date + 'T00:00:00')

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
    const eventDay = await prisma.calendarEvent.findFirst({
      where: {
        calendarId: calendar.id,
        startDate: requestedDate,
        isActive: true
      }
    })

    if (!eventDay) {
      throw createError({ statusCode: 400, message: 'La fecha seleccionada no está disponible para libre disposición' })
    }

    // Verificar que no ha excedido el límite
    const userApprovedCount = await prisma.request.count({
      where: {
        requesterId: session.user.id,
        type: 'FREE_DAY',
        status: 'APPROVED'
      }
    })

    if (userApprovedCount >= (calendar.maxEventsPerUser || 4)) {
      throw createError({ statusCode: 400, message: 'Has alcanzado el límite de días de libre disposición' })
    }

    // Verificar que no hay solicitud previa para esa fecha
    const existingRequest = await prisma.request.findFirst({
      where: {
        requesterId: session.user.id,
        type: 'FREE_DAY',
        requestedDate: requestedDate
      }
    })

    if (existingRequest) {
      throw createError({ statusCode: 400, message: 'Ya tienes una solicitud para esa fecha' })
    }

    // Verificar que no está lleno (3 solicitudes aprobadas)
    const approvedCount = await prisma.request.count({
      where: {
        type: 'FREE_DAY',
        status: 'APPROVED',
        requestedDate: requestedDate
      }
    })

    if (approvedCount >= 3) {
      throw createError({ statusCode: 400, message: 'Ese día ya tiene el máximo de solicitudes aprobadas' })
    }

    // Crear la solicitud
    const request = await prisma.request.create({
      data: {
        type: 'FREE_DAY',
        title: `Día libre disposición - ${date}`,
        description: reason || undefined,
        requestedDate: requestedDate,
        requesterId: session.user.id,
        status: 'PENDING',
      }
    })

    // Crear tarea para los admins
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'ROOT'] } },
      select: { id: true }
    })

    await prisma.task.create({
      data: {
        type: 'REVIEW',
        title: `Revisar solicitud día libre - ${session.user.firstName} ${session.user.lastName}`,
        description: `Solicitud de día de libre disposición para el ${date}. ${reason || ''}`,
        creatorId: session.user.id,
        requestId: request.id,
        assignments: {
          create: admins.map(admin => ({
            assigneeId: admin.id,
            status: 'TODO'
          }))
        }
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
