// PUT /api/calendars/[id] - Actualizar calendario (solo ADMIN/ROOT)
import { z } from 'zod'

const updateCalendarSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  allowDragDrop: z.boolean().optional(),
  maxEventsPerUser: z.number().int().min(1).optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user as any
  
  if (!user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }
  
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }
  
  // Verificar que sea ADMIN o ROOT
  const prisma = getPrisma()
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
  
  // Actualizar calendario
  const calendar = await prisma.calendar.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      ...(data.allowDragDrop !== undefined && { allowDragDrop: data.allowDragDrop }),
      ...(data.maxEventsPerUser !== undefined && { maxEventsPerUser: data.maxEventsPerUser }),
    },
  })
  
  return {
    success: true,
    data: calendar,
  }
})
