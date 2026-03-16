// PUT /api/admin/academic-years/:id - Actualizar curso académico
import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import pkg from '@prisma/client'
import { prisma } from '../../../utils/db'

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

  const body = await readBody(event)
  const { name, startDate, endDate, description, isActive, isClosed } = body

  try {
    // Si se activa este curso, desactivar los demás
    if (isActive) {
      await prisma.academicYear.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false }
      })
    }

    const academicYear = await prisma.academicYear.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(isClosed !== undefined && { isClosed })
      }
    })

    return {
      success: true,
      data: academicYear
    }
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw createError({ statusCode: 404, message: 'Curso no encontrado' })
    }
    if (error.code === 'P2002') {
      throw createError({ statusCode: 400, message: 'Ya existe un curso con ese nombre' })
    }
    throw createError({ statusCode: 500, message: 'Error al actualizar el curso' })
  }
})
