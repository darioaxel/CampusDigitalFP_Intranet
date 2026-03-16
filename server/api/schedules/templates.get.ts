import { defineEventHandler, createError } from 'h3'
import pkg from '@prisma/client'
import { prisma } from '../../utils/db'

const { Role } = pkg

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session.user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  const isAdminOrRoot = [Role.ADMIN, Role.ROOT].includes(currentUser?.role as any)

  // Construir where clause base
  const whereClause: any = { isTemplate: true }

  // Solo ADMIN/ROOT pueden ver templates inactivos
  if (!isAdminOrRoot) {
    whereClause.isActive = true
  }

  // Si no es admin/root, filtrar por roles permitidos
  // Una plantilla es visible si:
  // 1. No tiene roles específicos definidos (pública para todos)
  // 2. O el rol del usuario está en la lista de roles permitidos
  if (!isAdminOrRoot && currentUser?.role) {
    whereClause.OR = [
      { allowedRoles: { none: {} } }, // Plantillas sin restricción de rol
      { allowedRoles: { some: { role: currentUser.role } } } // Plantillas que incluyen su rol
    ]
  }

  const templates = await prisma.schedule.findMany({
    where: whereClause,
    include: {
      blocks: true,
      user: {
        select: { firstName: true, lastName: true, role: true }
      },
      // Incluir roles permitidos solo para admins
      allowedRoles: isAdminOrRoot
    },
    orderBy: { createdAt: 'desc' }
  })

  return {
    success: true,
    data: templates
  }
})