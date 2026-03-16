// POST /api/calendars/templates/[id]/clone - Clonar plantilla a nuevo calendario
import { z } from 'zod'
import { prisma } from '../../../../utils/db'

const cloneSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  academicYearId: z.string().uuid(), // ID del año académico
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['SCHOOL_YEAR', 'EVALUATION', 'FREE_DISPOSITION', 'MEETINGS', 'OTHER']),
  isPublic: z.boolean().default(true),
  allowDragDrop: z.boolean().default(false),
  maxEventsPerUser: z.number().int().min(1).optional(),
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  // Verificar que sea ADMIN o ROOT
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  if (!user || (user.role !== 'ADMIN' && user.role !== 'ROOT')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Solo administradores pueden clonar plantillas'
    })
  }

  const templateId = getRouterParam(event, 'id')
  if (!templateId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de plantilla requerido'
    })
  }

  // Validar body
  const body = await readBody(event)
  const result = cloneSchema.safeParse(body)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Datos inválidos',
      data: result.error.errors
    })
  }

  const data = result.data

  try {
    // Obtener plantilla con su año académico y eventos
    const template = await prisma.calendar.findUnique({
      where: {
        id: templateId,
        type: 'TEMPLATE',
        isActive: true
      },
      include: {
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
        events: {
          where: { isActive: true }
        }
      }
    })

    if (!template) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Plantilla no encontrada'
      })
    }

    // Obtener información del año académico destino
    const targetAcademicYear = await prisma.academicYear.findUnique({
      where: { id: data.academicYearId },
      select: { name: true }
    })

    if (!targetAcademicYear) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Año académico destino no encontrado'
      })
    }

    // Calcular el offset de años entre la plantilla y el nuevo calendario
    const templateAcademicYearName = template.academicYear?.name || targetAcademicYear.name
    const templateStartYear = parseInt(templateAcademicYearName.split('-')[0])
    const newStartYear = parseInt(targetAcademicYear.name.split('-')[0])
    const yearOffset = newStartYear - templateStartYear

    // Crear nuevo calendario con eventos ajustados
    const startDate = new Date(data.startDate + 'T00:00:00')
    const endDate = new Date(data.endDate + 'T23:59:59')

    const newCalendar = await prisma.calendar.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        academicYearId: data.academicYearId,
        startDate,
        endDate,
        isPublic: data.isPublic,
        isActive: true,
        allowDragDrop: data.allowDragDrop,
        maxEventsPerUser: data.maxEventsPerUser,
        createdById: session.user.id,
        events: {
          create: template.events.map(event => {
            // Ajustar fechas según el offset de años
            const originalStartDate = new Date(event.startDate)
            const originalEndDate = event.endDate ? new Date(event.endDate) : null
            
            const newEventStartDate = new Date(originalStartDate)
            newEventStartDate.setFullYear(originalStartDate.getFullYear() + yearOffset)
            
            let newEventEndDate = null
            if (originalEndDate) {
              newEventEndDate = new Date(originalEndDate)
              newEventEndDate.setFullYear(originalEndDate.getFullYear() + yearOffset)
            }

            return {
              title: event.title,
              description: event.description,
              type: event.type,
              startDate: newEventStartDate,
              endDate: newEventEndDate,
              isAllDay: event.isAllDay,
              startTime: event.startTime,
              endTime: event.endTime,
              color: event.color,
              maxAssignments: event.maxAssignments,
              isActive: true,
              createdById: session.user.id
            }
          })
        }
      },
      include: {
        events: true,
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
      }
    })

    return {
      success: true,
      data: newCalendar,
      message: `Calendario creado desde plantilla con ${newCalendar.events.length} eventos`
    }

  } catch (error: any) {
    console.error('Error cloning calendar template:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al clonar la plantilla'
    })
  }
})
