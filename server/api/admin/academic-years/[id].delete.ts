// DELETE /api/admin/academic-years/:id - Eliminar curso académico
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

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  try {
    // Verificar si tiene horarios asociados
    const count = await prisma.schedule.count({
      where: { academicYearId: id }
    })

    if (count > 0) {
      throw createError({ 
        statusCode: 400, 
        message: `No se puede eliminar: tiene ${count} horarios asociados` 
      })
    }

    await prisma.academicYear.delete({
      where: { id }
    })

    return {
      success: true,
      message: 'Curso eliminado correctamente'
    }
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw createError({ statusCode: 404, message: 'Curso no encontrado' })
    }
    throw createError({ statusCode: 500, message: error.message || 'Error al eliminar el curso' })
  }
})
