// DELETE /api/schedules/:id/roles/:roleId - Eliminar rol de una plantilla
import { defineEventHandler, createError, getRouterParam } from 'h3'
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
  const roleId = getRouterParam(event, 'roleId')
  
  if (!scheduleId || !roleId) {
    throw createError({ statusCode: 400, message: 'IDs requeridos' })
  }

  try {
    await prisma.scheduleTemplateRole.delete({
      where: { id: roleId }
    })

    return {
      success: true,
      message: 'Rol eliminado correctamente'
    }
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw createError({ statusCode: 404, message: 'Rol no encontrado' })
    }
    throw createError({ statusCode: 500, message: 'Error al eliminar rol' })
  }
})
