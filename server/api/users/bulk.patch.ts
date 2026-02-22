import pkg from '@prisma/client'
const { Role } = pkg

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session.user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }

  // Verificar que el usuario sea ADMIN o ROOT
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  if (!currentUser || ![Role.ADMIN, Role.ROOT].includes(currentUser.role)) {
    throw createError({ statusCode: 403, message: 'No autorizado' })
  }

  const body = await readBody(event)
  const { userIds, role, isActive } = body

  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw createError({ statusCode: 400, message: 'Se requiere array de IDs de usuarios' })
  }

  // Verificar que ninguno de los usuarios a modificar sea ROOT
  const targetUsers = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, role: true }
  })

  const nonRootUserIds = targetUsers
    .filter(user => user.role !== Role.ROOT)
    .map(user => user.id)

  if (nonRootUserIds.length === 0) {
    throw createError({ statusCode: 403, message: 'No se pueden modificar usuarios ROOT' })
  }

  // Validar rol si se proporciona
  if (role && !Object.values(Role).includes(role)) {
    throw createError({ statusCode: 400, message: 'Rol inválido' })
  }

  // Validar isActive si se proporciona
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    throw createError({ statusCode: 400, message: 'isActive debe ser booleano' })
  }

  try {
    const updateData: { role?: string, isActive?: boolean, deactivatedAt?: Date | null } = {}
    
    if (role) updateData.role = role
    if (isActive !== undefined) {
      updateData.isActive = isActive
      updateData.deactivatedAt = isActive ? null : new Date()
    }

    const result = await prisma.user.updateMany({
      where: { id: { in: nonRootUserIds } },
      data: updateData
    })

    const skippedCount = userIds.length - nonRootUserIds.length
    const message = skippedCount > 0
      ? `${result.count} usuario(s) actualizado(s). ${skippedCount} usuario(s) ROOT omitido(s).`
      : `${result.count} usuario(s) actualizado(s) correctamente`

    return { 
      success: true, 
      updatedCount: result.count,
      skippedCount,
      message
    }
  } catch (error) {
    console.error('Error updating users in bulk:', error)
    throw createError({ 
      statusCode: 500, 
      message: 'Error al actualizar los usuarios' 
    })
  }
})
