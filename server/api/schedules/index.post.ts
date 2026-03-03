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
  blocks: z.array(blockSchema).min(1, 'Al menos un bloque requerido'),
  // Nuevo campo: si es true y es admin, crea el horario ya validado
  autoValidate: z.boolean().optional().default(false)
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
    select: { role: true, firstName: true, lastName: true, email: true }
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
  let targetUserName = `${currentUser.firstName} ${currentUser.lastName}`
  
  if (data.userId) {
    if (isAdminOrRoot) {
      // Verificar que el usuario objetivo existe
      const targetUser = await prisma.user.findUnique({ 
        where: { id: data.userId },
        select: { id: true, role: true, firstName: true, lastName: true }
      })
      if (!targetUser) {
        throw createError({ statusCode: 404, message: 'Usuario objetivo no encontrado' })
      }
      // Prohibir crear horarios a ROOT si no eres ROOT
      if (targetUser.role === Role.ROOT && currentUser.role !== Role.ROOT) {
        throw createError({ statusCode: 403, message: 'No puedes crear horarios para usuarios ROOT' })
      }
      targetUserId = data.userId
      targetUserName = `${targetUser.firstName} ${targetUser.lastName}`
    } else {
      // Usuario normal intentando asignar a otro
      if (data.userId !== session.user.id) {
        throw createError({ statusCode: 403, message: 'Solo puedes crear horarios para ti mismo' })
      }
    }
  }

  // Crear horario + bloques en transacción
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Determinar el estado de validación inicial
      let initialValidationStatus = 'BORRADOR'
      let requestId: string | null = null
      
      // Si es template, no necesita validación
      if (data.isTemplate) {
        initialValidationStatus = 'VALIDADO' // Los templates no requieren validación
      }
      // Si es admin/root con autoValidate, crea validado directamente
      else if (isAdminOrRoot && data.autoValidate) {
        initialValidationStatus = 'VALIDADO'
      }
      // Si no es admin/root, debe pasar por validación
      else if (!isAdminOrRoot) {
        initialValidationStatus = 'PENDIENTE'
        
        // Obtener el workflow de validación de horarios
        const workflow = await tx.workflowDefinition.findUnique({
          where: { code: 'request_schedule_validation' },
          include: { states: true }
        })
        
        if (!workflow) {
          throw new Error('Workflow de validación de horarios no configurado')
        }
        
        const initialState = workflow.states.find(s => s.isInitial)
        if (!initialState) {
          throw new Error('Estado inicial del workflow no encontrado')
        }
        
        // Crear la solicitud de validación automáticamente
        const request = await tx.request.create({
          data: {
            workflowId: workflow.id,
            currentStateId: initialState.id,
            title: `Validar horario: ${data.name}`,
            description: `El profesor ${targetUserName} ha creado un nuevo horario "${data.name}" que requiere validación administrativa.
            
Tipo de horario: ${data.type}
Bloques configurados: ${data.blocks.length} días
${data.description ? `Descripción: ${data.description}` : ''}`,
            requesterId: targetUserId,
            context: JSON.stringify({ type: 'SCHEDULE_VALIDATION', scheduleId: null }) // Se actualizará después
          }
        })
        
        requestId = request.id
      }
      // Si es admin/root sin autoValidate, queda en BORRADOR para revisión manual
      
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
          validationStatus: initialValidationStatus,
          requestId: requestId
        }
      })
      
      // Si hay solicitud, actualizar el contexto con el scheduleId
      if (requestId) {
        await tx.request.update({
          where: { id: requestId },
          data: {
            context: JSON.stringify({ type: 'SCHEDULE_VALIDATION', scheduleId: newSchedule.id })
          }
        })
      }

      // 2. Crear bloques con validación de solapamiento
      for (const block of data.blocks) {
        const startMinutes = timeToMinutes(block.startTime)
        const endMinutes = timeToMinutes(block.endTime)

        // Verificar solapamiento contra bloques existentes del usuario del MISMO TIPO
        // Esto permite tener horarios de diferente tipo (NORMAL, EXAMENES, etc.) sin conflictos
        const existingBlocks = await tx.scheduleBlock.findMany({
          where: {
            schedule: {
              userId: targetUserId,
              isActive: true,
              type: data.type // Solo verificar contra horarios del mismo tipo
            },
            dayOfWeek: block.dayOfWeek
          },
          select: {
            startTime: true,
            endTime: true,
            schedule: {
              select: {
                name: true
              }
            }
          }
        })

        const hasOverlap = existingBlocks.some((b: any) => {
          const existingStart = timeToMinutes(b.startTime)
          const existingEnd = timeToMinutes(b.endTime)
          return startMinutes < existingEnd && endMinutes > existingStart
        })

        if (hasOverlap) {
          const conflictingSchedule = existingBlocks[0]?.schedule?.name || 'horario existente'
          throw new Error(`Solapamiento detectado el ${block.dayOfWeek} a las ${block.startTime} con "${conflictingSchedule}". No puedes tener dos horarios del mismo tipo (${data.type}) que se solapen.`)
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

      const schedule = await tx.schedule.findUnique({
        where: { id: newSchedule.id },
        include: { blocks: true, request: true }
      })
      
      return { schedule, requestId }
    })
    
    // Crear notificación para los admins si hay solicitud pendiente
    if (result.requestId) {
      try {
        const admins = await prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'ROOT'] } },
          select: { id: true }
        })
        
        await prisma.workflowNotification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            title: 'Nuevo horario pendiente de validación',
            message: `${targetUserName} ha creado un horario "${data.name}" que requiere tu revisión.`,
            type: 'warning',
            requestId: result.requestId,
            actionUrl: `/admin/solicitudes/${result.requestId}`,
            actionLabel: 'Revisar'
          }))
        })
      } catch (notifError) {
        console.error('Error creando notificaciones:', notifError)
        // No fallar si las notificaciones fallan
      }
    }

    // Construir mensaje de respuesta
    let message = 'Horario creado correctamente'
    if (data.isTemplate) {
      message = 'Template creado correctamente'
    } else if (isAdminOrRoot && data.autoValidate) {
      message = 'Horario creado y validado correctamente'
    } else if (!isAdminOrRoot) {
      message = 'Horario creado y enviado para validación. Un administrador lo revisará pronto.'
    }

    return { 
      success: true, 
      scheduleId: result.schedule?.id,
      requestId: result.requestId,
      validationStatus: result.schedule?.validationStatus,
      message
    }
    
  } catch (error: any) {
    console.error('Error creating schedule:', error)
    throw createError({ 
      statusCode: 400, 
      message: error.message || 'Error creando horario' 
    })
  }
})
