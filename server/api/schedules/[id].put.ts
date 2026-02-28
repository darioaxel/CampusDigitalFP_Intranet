// PUT /api/schedules/[id] - Actualizar un horario/template
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
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
  id: z.string().optional(),
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

const updateScheduleSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  type: z.enum(['NORMAL', 'EXAMENES', 'EXTRAORDINARIO', 'GUARDIA', 'REFUERZO']).optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isActive: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
  validFrom: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.string().length(0),
    z.null(),
    z.undefined()
  ]).optional().transform(val => val === '' ? null : val),
  validUntil: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.string().length(0),
    z.null(),
    z.undefined()
  ]).optional().transform(val => val === '' ? null : val),
  blocks: z.array(blockSchema).optional()
})

export default defineEventHandler(async (event) => {
  if (event.method !== 'PUT') {
    throw createError({ statusCode: 405, message: 'Method not allowed' })
  }

  const session = await getUserSession(event)
  
  if (!session.user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  // Verificar rol
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  const isAdminOrRoot = currentUser?.role === Role.ADMIN || currentUser?.role === Role.ROOT

  // Obtener horario existente
  const existingSchedule = await prisma.schedule.findUnique({
    where: { id },
    include: { blocks: true }
  })

  if (!existingSchedule) {
    throw createError({ statusCode: 404, message: 'Horario no encontrado' })
  }

  // Verificar permisos
  const canEdit = existingSchedule.userId === session.user.id || isAdminOrRoot

  if (!canEdit) {
    throw createError({ statusCode: 403, message: 'No autorizado para editar este horario' })
  }

  // Solo ADMIN/ROOT pueden editar templates
  if (existingSchedule.isTemplate && !isAdminOrRoot) {
    throw createError({ statusCode: 403, message: 'Solo ADMIN/ROOT pueden editar templates' })
  }

  // Parsear y validar body
  let data
  try {
    const body = await readBody(event)
    data = updateScheduleSchema.parse(body)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw createError({ 
        statusCode: 400, 
        message: 'Datos inválidos: ' + errorMessages
      })
    }
    throw createError({ statusCode: 400, message: 'Error en los datos' })
  }

  // Actualizar en transacción
  try {
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Actualizar datos del horario
      const scheduleUpdate: any = {}
      
      if (data.name !== undefined) scheduleUpdate.name = data.name
      if (data.type !== undefined) scheduleUpdate.type = data.type
      if (data.description !== undefined) scheduleUpdate.description = data.description
      if (data.color !== undefined) scheduleUpdate.color = data.color
      if (data.isActive !== undefined) scheduleUpdate.isActive = data.isActive
      if (data.isTemplate !== undefined) scheduleUpdate.isTemplate = data.isTemplate
      if (data.validFrom !== undefined) {
        scheduleUpdate.validFrom = data.validFrom ? new Date(data.validFrom + 'T00:00:00') : null
      }
      if (data.validUntil !== undefined) {
        scheduleUpdate.validUntil = data.validUntil ? new Date(data.validUntil + 'T23:59:59') : null
      }

      // 2. Si se envían bloques, actualizarlos
      if (data.blocks && data.blocks.length > 0) {
        // Eliminar bloques existentes
        await tx.scheduleBlock.deleteMany({
          where: { scheduleId: id }
        })

        // Crear nuevos bloques
        for (const block of data.blocks) {
          await tx.scheduleBlock.create({
            data: {
              scheduleId: id,
              dayOfWeek: block.dayOfWeek,
              startTime: block.startTime,
              endTime: block.endTime,
              subject: block.subject,
              room: block.room,
              isBreak: block.isBreak
            }
          })
        }
      }

      // 3. Actualizar horario
      await tx.schedule.update({
        where: { id },
        data: scheduleUpdate
      })

      // 4. Retornar horario actualizado
      return await tx.schedule.findUnique({
        where: { id },
        include: { blocks: true }
      })
    })

    return {
      success: true,
      data: updated,
      message: 'Horario actualizado correctamente'
    }

  } catch (error: any) {
    console.error('Error updating schedule:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Error al actualizar el horario'
    })
  }
})
