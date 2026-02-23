import pkg from '@prisma/client'
import { prisma } from '../../utils/db'  // Esto sí necesita import si no está auto-importado

const { Role } = pkg

export default defineEventHandler(async (event) => {
  if (event.node.req.method !== 'DELETE') {
    throw createError({ statusCode: 405, message: 'Method not allowed' })
  }

  // getUserSession debería estar disponible auto-importado desde server/utils
  const session = await getUserSession(event)
  
  if (!session.user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  const isAdminOrRoot = currentUser?.role === Role.ADMIN || currentUser?.role === Role.ROOT

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  const schedule = await prisma.schedule.findUnique({
    where: { id },
    select: { userId: true, isTemplate: true, name: true }
  })

  if (!schedule) {
    throw createError({ statusCode: 404, message: 'Horario no encontrado' })
  }

  const canDelete = schedule.userId === session.user.id || isAdminOrRoot

  if (!canDelete) {
    throw createError({ statusCode: 403, message: 'No autorizado' })
  }

  if (schedule.isTemplate && !isAdminOrRoot) {
    throw createError({ statusCode: 403, message: 'Solo ADMIN/ROOT pueden eliminar templates' })
  }

  await prisma.schedule.delete({ where: { id } })

  return { 
    success: true, 
    message: `Horario "${schedule.name}" eliminado` 
  }
})