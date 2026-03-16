// GET /api/schedules/:id/roles - Obtener roles permitidos de una plantilla
import { defineEventHandler, createError, getRouterParam } from 'h3'
import pkg from '@prisma/client'
import { prisma } from '../../../../utils/db'

const { Role } = pkg

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  const isAdminOrRoot = [Role.ADMIN, Role.ROOT].includes(currentUser?.role as any)

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

  // Solo admins pueden ver todos los roles, los demás solo si tienen acceso
  if (!isAdminOrRoot) {
    const hasAccess = await prisma.scheduleTemplateRole.findFirst({
      where: {
        scheduleId,
        role: currentUser?.role
      }
    })
    
    // Si no tiene acceso y la plantilla tiene roles restringidos, denegar
    const hasRestrictions = await prisma.scheduleTemplateRole.count({
      where: { scheduleId }
    })
    
    if (hasRestrictions > 0 && !hasAccess) {
      throw createError({ statusCode: 403, message: 'No tienes acceso a esta plantilla' })
    }
  }

  const roles = await prisma.scheduleTemplateRole.findMany({
    where: { scheduleId },
    orderBy: { role: 'asc' }
  })

  return {
    success: true,
    data: roles
  }
})
