// GET /api/admin/academic-years - Listar todos los cursos académicos
import { defineEventHandler, createError } from 'h3'
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

  const academicYears = await prisma.academicYear.findMany({
    include: {
      _count: {
        select: { schedules: true }
      }
    },
    orderBy: { startDate: 'desc' }
  })

  return {
    success: true,
    data: academicYears
  }
})
