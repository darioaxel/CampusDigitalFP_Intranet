// POST /api/calendars - Crear calendario (solo ADMIN/ROOT)
import { z } from 'zod'

// Festivos Aragón 2025-2026 (pueden ampliarse para otros años)
const HOLIDAYS_2025_2026 = [
  // Fiestas nacionales
  '2025-10-12', // Fiesta Nacional de España
  '2025-11-01', // Todos los Santos
  '2025-12-06', // Día de la Constitución
  '2025-12-08', // Inmaculada Concepción
  '2025-12-25', // Navidad
  '2026-01-01', // Año Nuevo
  '2026-01-06', // Reyes
  '2026-05-01', // Día del Trabajo
  // Fiestas de Aragón
  '2026-04-23', // San Jorge
  // Vacaciones de Navidad
  '2025-12-22', '2025-12-23', '2025-12-24', '2025-12-26', '2025-12-29',
  '2025-12-30', '2025-12-31', '2026-01-02', '2026-01-05', '2026-01-07',
  // Vacaciones de Semana Santa
  '2026-03-30', '2026-03-31', '2026-04-01', '2026-04-02', '2026-04-03', '2026-04-06',
]

// Generar eventos de libre disposición para todos los días lectivos
function generateFreeDispositionDays(startDate: Date, endDate: Date, userId: string) {
  const events = []
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    const dayOfWeek = current.getDay() // 0 = domingo, 1 = lunes, ..., 6 = sábado
    const dateStr = current.toISOString().split('T')[0]
    
    // Solo lunes a viernes (1-5) y no festivos
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !HOLIDAYS_2025_2026.includes(dateStr)) {
      events.push({
        title: 'Día de libre disposición',
        description: 'Día disponible para solicitar libre disposición (máximo 3 profesores)',
        type: 'FREE_DISPOSITION',
        startDate: new Date(dateStr + 'T00:00:00'),
        endDate: new Date(dateStr + 'T23:59:59'),
        isAllDay: true,
        color: '#3B82F6', // Azul
        maxAssignments: 3, // Máximo 3 profesores
        isActive: true,
        createdById: userId,
      })
    }
    
    current.setDate(current.getDate() + 1)
  }
  
  return events
}

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
  
  // Preparar datos base del calendario
  const calendarData: any = {
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
  }
  
  // Si es calendario de libre disposición, generar eventos automáticamente
  if (data.type === 'FREE_DISPOSITION') {
    const freeDispositionEvents = generateFreeDispositionDays(startDate, endDate, user.id)
    calendarData.events = {
      create: freeDispositionEvents
    }
  }
  
  const calendar = await prisma.calendar.create({
    data: calendarData,
    include: {
      events: true
    }
  })
  
  return {
    success: true,
    data: calendar,
    message: data.type === 'FREE_DISPOSITION' 
      ? `Calendario creado con ${calendar.events.length} días de libre disposición` 
      : 'Calendario creado correctamente'
  }
})
