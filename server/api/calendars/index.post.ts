// POST /api/calendars - Crear calendario (solo ADMIN/ROOT)
import { z } from 'zod'

const createCalendarSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  type: z.enum(['SCHOOL_YEAR', 'EVALUATION', 'FREE_DISPOSITION', 'MEETINGS', 'TEMPLATE', 'OTHER']),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/), // formato: 2024-2025
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // formato: YYYY-MM-DD
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // formato: YYYY-MM-DD
  isPublic: z.boolean().default(true),
  allowDragDrop: z.boolean().default(false),
  maxEventsPerUser: z.number().int().min(1).optional(),
})

export default defineEventHandler(async (event) => {
  // Verificar autenticación y rol
  const session = await requireUserSession(event)
  const user = session.user

  // Verificar que sea ADMIN o ROOT
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
  
  // Validar período del curso académico: 1 septiembre - 31 julio
  const startDate = new Date(data.startDate + 'T00:00:00')
  const endDate = new Date(data.endDate + 'T23:59:59')
  
  const academicYearStart = parseInt(data.academicYear.split('-')[0])
  const expectedStart = new Date(academicYearStart, 8, 1) // 1 de septiembre (mes 8)
  const expectedEnd = new Date(academicYearStart + 1, 6, 31, 23, 59, 59) // 31 de julio
  
  // Verificar que el calendario abarque el curso completo
  if (startDate.getTime() !== expectedStart.getTime() || endDate.getTime() !== expectedEnd.getTime()) {
    throw createError({
      statusCode: 400,
      message: `El calendario debe abarcar el curso académico completo: del 1 de septiembre de ${academicYearStart} al 31 de julio de ${academicYearStart + 1}`
    })
  }
  
  // Validar: Solo puede haber un calendario de libre disposición activo a la vez
  if (data.type === 'FREE_DISPOSITION' && data.isActive !== false) {
    const existingFreeDisposition = await prisma.calendar.findFirst({
      where: {
        type: 'FREE_DISPOSITION',
        isActive: true
      }
    })
    
    if (existingFreeDisposition) {
      throw createError({
        statusCode: 409,
        message: `Ya existe un calendario de libre disposición activo: "${existingFreeDisposition.name}". Desactívalo primero.`
      })
    }
  }
  
  // Crear calendario (normalizar fechas a inicio del día local)
  const startDate = new Date(data.startDate + 'T00:00:00')
  const endDate = new Date(data.endDate + 'T23:59:59')
  
  const calendar = await prisma.calendar.create({
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      academicYear: data.academicYear,
      startDate,
      endDate,
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
