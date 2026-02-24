import { defineEventHandler, createError } from 'h3'
import pkg from '@prisma/client'
import { prisma } from '../../utils/db'

const { Role } = pkg

export default defineEventHandler(async (event) => {
  // Sin import - asumiendo auto-import desde server/utils/session.ts
  const session = await getUserSession(event)
  
  if (!session.user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  const isAdminOrRoot = [Role.ADMIN, Role.ROOT].includes(currentUser?.role as any)

  // Templates son públicos para usuarios autenticados
  // Solo ADMIN/ROOT pueden ver templates inactivos
  const whereClause: any = { isTemplate: true }

  if (!isAdminOrRoot) {
    whereClause.isActive = true
  }

  const templates = await prisma.schedule.findMany({
    where: whereClause,
    include: {
      blocks: true,
      user: {
        select: { firstName: true, lastName: true, role: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return {
    success: true,
    data: templates
  }
})