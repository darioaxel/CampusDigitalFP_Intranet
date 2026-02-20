// ~/server/api/user/change-password.post.ts
// Cambiar contraseña del usuario autenticado

import { z } from 'zod'
import bcrypt from 'bcrypt'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'Debes confirmar la nueva contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export default defineEventHandler(async (event) => {
  // Verificar autenticación
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }

  // Validar body
  const body = await readValidatedBody(event, changePasswordSchema.parse)

  try {
    // Obtener usuario con su passwordHash actual
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        passwordHash: true,
        provider: true,
      }
    })

    if (!user) {
      throw createError({ statusCode: 404, message: 'Usuario no encontrado' })
    }

    // Verificar que no sea un usuario OAuth
    if (user.provider !== 'local' || !user.passwordHash) {
      throw createError({
        statusCode: 400,
        message: 'No puedes cambiar la contraseña de una cuenta vinculada a Google'
      })
    }

    // Verificar contraseña actual
    const validCurrentPassword = await bcrypt.compare(
      body.currentPassword,
      user.passwordHash
    )

    if (!validCurrentPassword) {
      throw createError({
        statusCode: 400,
        message: 'La contraseña actual es incorrecta'
      })
    }

    // Hashear nueva contraseña
    const newPasswordHash = await bcrypt.hash(body.newPassword, 10)

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    })

    console.log(`✅ Contraseña cambiada para usuario: ${session.user.id}`)

    return {
      success: true,
      message: 'Contraseña actualizada correctamente'
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('❌ Error al cambiar contraseña:', error)
    throw createError({
      statusCode: 500,
      message: 'Error al cambiar la contraseña'
    })
  }
})
