import { defineEventHandler, createError, getRouterParam } from 'h3'
import pkg from '@prisma/client'
import { prisma } from '../../../utils/db'

const { Role } = pkg

export default defineEventHandler(async (event) => {
  // Sin import - asumiendo auto-import desde server/utils/session.ts
  const session = await getUserSession(event)
  
  if (!session.user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }

  const templateId = getRouterParam(event, 'id')
  if (!templateId) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  // Obtener template
  const template = await prisma.schedule.findUnique({
    where: { 
      id: templateId,
      isTemplate: true,
      isActive: true 
    },
    include: { blocks: true }
  })

  if (!template) {
    throw createError({ statusCode: 404, message: 'Template no encontrado' })
  }

  // Crear copia para el usuario actual
  const newSchedule = await prisma.schedule.create({
    data: {
      name: `${template.name} (copia)`,
      type: template.type,
      description: template.description,
      color: template.color,
      isTemplate: false,
      isActive: true,
      userId: session.user.id,
      blocks: {
        create: template.blocks.map((block: any) => ({
          dayOfWeek: block.dayOfWeek,
          startTime: block.startTime,
          endTime: block.endTime,
          subject: block.subject,
          room: block.room,
          isBreak: block.isBreak
        }))
      }
    },
    include: { blocks: true }
  })

  return { 
    success: true, 
    scheduleId: newSchedule.id,
    message: 'Horario creado desde template'
  }
})