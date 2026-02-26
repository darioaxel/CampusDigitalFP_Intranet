// PUT /api/calendars/[id] - Actualizar calendario (solo ADMIN/ROOT)
import { z } from 'zod'

const updateCalendarSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // formato: YYYY-MM-DD
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // formato: YYYY-MM-DD
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  allowDragDrop: z.boolean().optional(),
  maxEventsPerUser: z.number().int().min(1).optional().nullable(),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/).optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }
  
  // Verificar que sea ADMIN o ROOT
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })
  
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'ROOT')) {
    throw createError({ statusCode: 403, message: 'Solo administradores pueden actualizar calendarios' })
  }
  
  // Validar body
  const body = await readBody(event)
  const result = updateCalendarSchema.safeParse(body)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Datos inválidos',
      data: result.error.errors
    })
  }
  
  const data = result.data
  
  // Obtener calendario actual
  const currentCalendar = await prisma.calendar.findUnique({
    where: { id }
  })
  
  if (!currentCalendar) {
    throw createError({ statusCode: 404, message: 'Calendario no encontrado' })
  }
  
  // Validar período del curso académico si se actualizan fechas
  if (data.startDate || data.endDate || data.academicYear) {
    const academicYear = data.academicYear || currentCalendar.academicYear
    const academicYearStart = parseInt(academicYear.split('-')[0])
    
    const startDate = data.startDate ? new Date(data.startDate + 'T00:00:00') : currentCalendar.startDate
    const endDate = data.endDate ? new Date(data.endDate + 'T23:59:59') : currentCalendar.endDate
    
    const expectedStart = new Date(academicYearStart, 8, 1) // 1 de septiembre
    const expectedEnd = new Date(academicYearStart + 1, 6, 31, 23, 59, 59) // 31 de julio
    
    if (startDate.getTime() !== expectedStart.getTime() || endDate.getTime() !== expectedEnd.getTime()) {
      throw createError({
        statusCode: 400,
        message: `El calendario debe abarcar el curso académico completo: del 1 de septiembre de ${academicYearStart} al 31 de julio de ${academicYearStart + 1}`
      })
    }
  }
  
  // Validar: Solo puede haber un calendario de libre disposición activo a la vez
  if (data.isActive === true && currentCalendar.type === 'FREE_DISPOSITION') {
    const existingFreeDisposition = await prisma.calendar.findFirst({
      where: {
        type: 'FREE_DISPOSITION',
        isActive: true,
        id: { not: id } // Excluir el calendario actual
      }
    })
    
    if (existingFreeDisposition) {
      throw createError({
        statusCode: 409,
        message: `Ya existe un calendario de libre disposición activo: "${existingFreeDisposition.name}". Desactívalo primero.`
      })
    }
  }
  
  // Actualizar calendario (normalizar fechas si se proporcionan)
  const updateData: any = {
    ...(data.name && { name: data.name }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
    ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
    ...(data.allowDragDrop !== undefined && { allowDragDrop: data.allowDragDrop }),
    ...(data.maxEventsPerUser !== undefined && { maxEventsPerUser: data.maxEventsPerUser }),
  }
  
  if (data.startDate) {
    updateData.startDate = new Date(data.startDate + 'T00:00:00')
  }
  if (data.endDate) {
    updateData.endDate = new Date(data.endDate + 'T23:59:59')
  }
  
  const calendar = await prisma.calendar.update({
    where: { id },
    data: updateData,
  })
  
  return {
    success: true,
    data: calendar,
  }
})
