// POST /api/admin/academic-years/:id/rollover - Pasar horarios de un curso a otro
import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import pkg from '@prisma/client'
import { prisma } from '../../../../utils/db'

const { Role } = pkg

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }

  // Verificar que es admin/root
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, id: true }
  })

  if (![Role.ADMIN, Role.ROOT].includes(currentUser?.role as any)) {
    throw createError({ statusCode: 403, message: 'No autorizado' })
  }

  const sourceYearId = getRouterParam(event, 'id')
  if (!sourceYearId) {
    throw createError({ statusCode: 400, message: 'ID de curso origen requerido' })
  }

  const body = await readBody(event)
  const { targetYearId, scheduleIds, copyAll } = body

  if (!targetYearId) {
    throw createError({ statusCode: 400, message: 'ID de curso destino requerido' })
  }

  if (sourceYearId === targetYearId) {
    throw createError({ statusCode: 400, message: 'El curso origen y destino no pueden ser el mismo' })
  }

  // Verificar que ambos cursos existen
  const [sourceYear, targetYear] = await Promise.all([
    prisma.academicYear.findUnique({ where: { id: sourceYearId } }),
    prisma.academicYear.findUnique({ where: { id: targetYearId } })
  ])

  if (!sourceYear) {
    throw createError({ statusCode: 404, message: 'Curso origen no encontrado' })
  }
  if (!targetYear) {
    throw createError({ statusCode: 404, message: 'Curso destino no encontrado' })
  }

  // Construir where para seleccionar horarios
  const where: any = {
    academicYearId: sourceYearId,
    isTemplate: false // Solo horarios de usuarios, no plantillas
  }

  if (!copyAll && scheduleIds?.length > 0) {
    where.id = { in: scheduleIds }
  }

  // Obtener horarios a copiar
  const schedulesToCopy = await prisma.schedule.findMany({
    where,
    include: { blocks: true }
  })

  if (schedulesToCopy.length === 0) {
    throw createError({ statusCode: 400, message: 'No hay horarios para copiar' })
  }

  // Crear copias en transacción
  const results = await prisma.$transaction(async (tx) => {
    const created = []

    for (const schedule of schedulesToCopy) {
      // Desactivar el horario antiguo
      await tx.schedule.update({
        where: { id: schedule.id },
        data: { isActive: false }
      })

      // Crear nuevo horario para el curso destino
      const newSchedule = await tx.schedule.create({
        data: {
          name: schedule.name,
          type: schedule.type,
          description: `${schedule.description || ''} (Copiado desde ${sourceYear.name})`,
          color: schedule.color,
          isTemplate: false,
          isActive: true,
          userId: schedule.userId,
          academicYearId: targetYearId,
          parentScheduleId: schedule.id, // Referencia al original
          validationStatus: 'BORRADOR', // Inicia como borrador en el nuevo curso
          blocks: {
            create: schedule.blocks.map(block => ({
              dayOfWeek: block.dayOfWeek,
              startTime: block.startTime,
              endTime: block.endTime,
              subject: block.subject,
              room: block.room,
              isBreak: block.isBreak
            }))
          }
        }
      })

      created.push({
        oldId: schedule.id,
        newId: newSchedule.id,
        name: newSchedule.name
      })
    }

    return created
  })

  return {
    success: true,
    message: `${results.length} horarios copiados de ${sourceYear.name} a ${targetYear.name}`,
    data: {
      copied: results.length,
      schedules: results,
      sourceYear: { id: sourceYear.id, name: sourceYear.name },
      targetYear: { id: targetYear.id, name: targetYear.name }
    }
  }
})
