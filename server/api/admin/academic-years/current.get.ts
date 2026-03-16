// GET /api/admin/academic-years/current - Obtener curso activo actual
import { defineEventHandler } from 'h3'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    return { success: false, data: null }
  }

  const currentYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
    include: {
      _count: {
        select: { schedules: true }
      }
    }
  })

  return {
    success: true,
    data: currentYear
  }
})
