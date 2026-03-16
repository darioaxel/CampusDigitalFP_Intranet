// POST /api/schedules/:id/roles - Añadir rol permitido a una plantilla
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
    select: { role: true }
  })

  if (![Role.ADMIN, Role.ROOT].includes(currentUser?.role as any)) {
    throw createError({ statusCode: 403, message: 'No autorizado' })
  }

  const scheduleId = getRouterParam(event, 'id')
  if (!scheduleId) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  // Verificar que el schedule existe y es template
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId, isTemplate: true }
  })

  if (!schedule) {
    throw createError({ statusCode: 404, message: 'Plantilla no encontrada' })
  }

  const body = await readBody(event)
  const { role } = body

  // Validar que el rol es válido
  if (!role || !Object.values(Role).includes(role)) {
    throw createError({ statusCode: 400, message: 'Rol inválido' })
  }

  try {
    // Crear el rol (si ya existe, Prisma lanzará error por @@unique)
    const templateRole = await prisma.scheduleTemplateRole.create({
      data: {
        scheduleId,
        role
      }
    })

    return {
      success: true,
      data: templateRole
    }
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw createError({ statusCode: 400, message: 'Este rol ya está asignado a la plantilla' })
    }
    throw createError({ statusCode: 500, message: 'Error al añadir rol' })
  }
})
