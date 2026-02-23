// POST /api/calendars - Crear calendario (solo ADMIN/ROOT)
import { z } from 'zod'

const createCalendarSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  type: z.enum(['SCHOOL_YEAR', 'EVALUATION', 'FREE_DISPOSITION', 'MEETINGS', 'OTHER']),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/), // formato: 2024-2025
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isPublic: z.boolean().default(true),
  allowDragDrop: z.boolean().default(false),
  maxEventsPerUser: z.number().int().min(1).optional(),
})

export default defineEventHandler(async (event) => {
  // Verificar autenticación y rol
  const session = await requireUserSession(event)
  const user = session.user

  // Verificar que sea ADMIN o ROOT
  const prisma = getPrisma()
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })
  
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'ROOT')) {
    throw createError({ statusCode: 403, message: 'Solo administradores pueden crear calendarios' })
  }
  
  // Validar body
  const body = await readBody(event)
  const result = createCalendarSchema.safeParse(body)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Datos inválidos',
      data: result.error.errors
    })
  }
  
  const data = result.data
  
  // Crear calendario
  const calendar = await prisma.calendar.create({
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      academicYear: data.academicYear,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isPublic: data.isPublic,
      isActive: true,
      allowDragDrop: data.allowDragDrop,
      maxEventsPerUser: data.maxEventsPerUser,
      createdById: user.id,
    },
  })
  
  return {
    success: true,
    data: calendar,
  }
})
