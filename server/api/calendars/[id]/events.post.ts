// POST /api/calendars/[id]/events - Crear evento en calendario (solo ADMIN/ROOT)
import { z } from 'zod'

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['HOLIDAY', 'LECTIVE', 'EVALUATION', 'FREE_DISPOSITION', 'MEETING', 'DEADLINE', 'OTHER']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // formato: YYYY-MM-DD
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isAllDay: z.boolean().default(true),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  maxAssignments: z.number().int().min(1).optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user

  const calendarId = getRouterParam(event, 'id')
  if (!calendarId) {
    throw createError({ statusCode: 400, message: 'ID de calendario requerido' })
  }
  
  // Verificar que sea ADMIN o ROOT
  const prisma = getPrisma()
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })
  
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'ROOT')) {
    throw createError({ statusCode: 403, message: 'Solo administradores pueden crear eventos' })
  }
  
  // Verificar que el calendario existe
  const calendar = await prisma.calendar.findUnique({
    where: { id: calendarId },
  })
  
  if (!calendar) {
    throw createError({ statusCode: 404, message: 'Calendario no encontrado' })
  }
  
  // Validar body
  const body = await readBody(event)
  const result = createEventSchema.safeParse(body)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Datos inválidos',
      data: result.error.errors
    })
  }
  
  const data = result.data
  
  // Crear evento
  const eventItem = await prisma.calendarEvent.create({
    data: {
      calendarId,
      title: data.title,
      description: data.description,
      type: data.type,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      isAllDay: data.isAllDay,
      startTime: data.startTime,
      endTime: data.endTime,
      color: data.color,
      maxAssignments: data.maxAssignments,
      isActive: true,
      createdById: user.id,
    },
  })
  
  return {
    success: true,
    data: eventItem,
  }
})
