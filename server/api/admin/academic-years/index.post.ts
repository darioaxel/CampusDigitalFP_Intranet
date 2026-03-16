// POST /api/admin/academic-years - Crear nuevo curso académico
import { defineEventHandler, createError, readBody } from 'h3'
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

  const body = await readBody(event)
  const { name, startDate, endDate, description, setAsActive } = body

  // Validaciones
  if (!name || !startDate || !endDate) {
    throw createError({ statusCode: 400, message: 'Nombre, fecha inicio y fecha fin son obligatorios' })
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (start >= end) {
    throw createError({ statusCode: 400, message: 'La fecha de inicio debe ser anterior a la fecha de fin' })
  }

  try {
    // Si se marca como activo, desactivar el curso actual
    if (setAsActive) {
      await prisma.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      })
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        name,
        startDate: start,
        endDate: end,
        description,
        isActive: setAsActive || false
      }
    })

    return {
      success: true,
      data: academicYear
    }
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw createError({ statusCode: 400, message: 'Ya existe un curso con ese nombre' })
    }
    throw createError({ statusCode: 500, message: 'Error al crear el curso académico' })
  }
})
