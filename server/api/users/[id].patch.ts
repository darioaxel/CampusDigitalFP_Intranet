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

  const userId = getRouterParam(event, 'id')
  if (!userId) {
    throw createError({ statusCode: 400, message: 'ID de usuario requerido' })
  }

  // Verificar que el usuario a modificar no sea ROOT
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })

  if (!targetUser) {
    throw createError({ statusCode: 404, message: 'Usuario no encontrado' })
  }

  if (targetUser.role === Role.ROOT) {
    throw createError({ statusCode: 403, message: 'No se puede modificar un usuario ROOT' })
  }

  const body = await readBody(event)
  const { role, isActive } = body

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

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    })

    return updatedUser
  } catch (error) {
    console.error('Error updating user:', error)
    throw createError({ 
      statusCode: 500, 
      message: 'Error al actualizar el usuario' 
    })
  }
})
