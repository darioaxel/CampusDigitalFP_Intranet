import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import pkg from '@prisma/client'
import { prisma } from '../../utils/db'

const { Role } = pkg

// Helper para convertir HH:MM a minutos
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Schemas Zod
const blockSchema = z.object({
  dayOfWeek: z.enum(['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:MM requerido'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:MM requerido'),
  subject: z.string().optional().default(''),
  room: z.union([z.string(), z.null(), z.undefined()]).optional().transform(val => val || ''),
  isBreak: z.union([z.boolean(), z.undefined()]).optional().transform(val => val || false)
}).refine((data) => {
  return timeToMinutes(data.startTime) < timeToMinutes(data.endTime)
}, {
  message: 'La hora de inicio debe ser menor que la de fin',
  path: ['endTime']
})

const scheduleSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['NORMAL', 'EXAMENES', 'EXTRAORDINARIO', 'GUARDIA', 'REFUERZO']),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isTemplate: z.boolean().default(false),
  userId: z.string().uuid().optional(),
  validFrom: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    z.string().length(0), // String vacío
    z.undefined()
  ]).optional().transform(val => val || undefined),
  validUntil: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    z.string().length(0), // String vacío
    z.undefined()
  ]).optional().transform(val => val || undefined),
  blocks: z.array(blockSchema).min(1, 'Al menos un bloque requerido')
})

export default defineEventHandler(async (event) => {
  // Verificar método POST
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method not allowed' })
  }

  // Obtener sesión
  const session = await getUserSession(event)
  
  if (!session.user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }

  // Parsear y validar body con Zod
  let data
  try {
    const body = await readBody(event)
    console.log('📥 POST /api/schedules - Body recibido:', JSON.stringify(body, null, 2))
    data = scheduleSchema.parse(body)
    console.log('✅ Validación Zod exitosa')
  } catch (error: any) {
    console.error('❌ Error validando datos:', error)
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw createError({ 
        statusCode: 400, 
        message: 'Datos inválidos: ' + errorMessages
      })
    }
    throw createError({ statusCode: 400, message: 'Error en los datos: ' + (error.message || 'Desconocido') })
  }

  // Verificar rol del usuario actual
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  if (!currentUser) {
    throw createError({ statusCode: 404, message: 'Usuario no encontrado' })
  }

  const isAdminOrRoot = currentUser.role === Role.ADMIN || currentUser.role === Role.ROOT

  // Solo ADMIN/ROOT pueden crear templates
  if (data.isTemplate && !isAdminOrRoot) {
    throw createError({ statusCode: 403, message: 'No autorizado para crear templates' })
  }

  // Determinar userId objetivo
  let targetUserId = session.user.id
  
  if (data.userId) {
    if (isAdminOrRoot) {
      // Verificar que el usuario objetivo existe
      const targetUser = await prisma.user.findUnique({ 
        where: { id: data.userId },
        select: { id: true, role: true }
      })
      if (!targetUser) {
        throw createError({ statusCode: 404, message: 'Usuario objetivo no encontrado' })
      }
      // Prohibir crear horarios a ROOT si no eres ROOT
      if (targetUser.role === Role.ROOT && currentUser.role !== Role.ROOT) {
        throw createError({ statusCode: 403, message: 'No puedes crear horarios para usuarios ROOT' })
      }
      targetUserId = data.userId
    } else {
      // Usuario normal intentando asignar a otro
      if (data.userId !== session.user.id) {
        throw createError({ statusCode: 403, message: 'Solo puedes crear horarios para ti mismo' })
      }
    }
  }

  // Crear horario + bloques en transacción
  try {
    const schedule = await prisma.$transaction(async (tx) => {
      // 1. Crear el horario
      const newSchedule = await tx.schedule.create({
        data: {
          name: data.name,
          type: data.type,
          description: data.description,
          color: data.color || '#3b82f6',
          isTemplate: data.isTemplate,
          isActive: true,
          userId: targetUserId,
          validFrom: data.validFrom ? new Date(data.validFrom + 'T00:00:00') : null,
          validUntil: data.validUntil ? new Date(data.validUntil + 'T23:59:59') : null,
        }
      })

      // 2. Crear bloques con validación de solapamiento
      for (const block of data.blocks) {
        const startMinutes = timeToMinutes(block.startTime)
        const endMinutes = timeToMinutes(block.endTime)

        // Verificar solapamiento contra bloques existentes del usuario
        const existingBlocks = await tx.scheduleBlock.findMany({
          where: {
            schedule: {
              userId: targetUserId,
              isActive: true
            },
            dayOfWeek: block.dayOfWeek
          },
          select: {
            startTime: true,
            endTime: true
          }
        })

        const hasOverlap = existingBlocks.some((b: any) => {
          const existingStart = timeToMinutes(b.startTime)
          const existingEnd = timeToMinutes(b.endTime)
          return startMinutes < existingEnd && endMinutes > existingStart
        })

        if (hasOverlap) {
          throw new Error(`Solapamiento detectado el ${block.dayOfWeek} a las ${block.startTime}`)
        }

        await tx.scheduleBlock.create({
          data: {
            scheduleId: newSchedule.id,
            dayOfWeek: block.dayOfWeek,
            startTime: block.startTime,
            endTime: block.endTime,
            subject: block.subject,
            room: block.room || '',
            isBreak: block.isBreak
          }
        })
      }

      return await tx.schedule.findUnique({
        where: { id: newSchedule.id },
        include: { blocks: true }
      })
    })

    return { 
      success: true, 
      scheduleId: schedule?.id,
      message: data.isTemplate ? 'Template creado correctamente' : 'Horario creado correctamente'
    }
    
  } catch (error: any) {
    console.error('Error creating schedule:', error)
    throw createError({ 
      statusCode: 400, 
      message: error.message || 'Error creando horario' 
    })
  }
})