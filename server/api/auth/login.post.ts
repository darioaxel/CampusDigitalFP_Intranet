// ~/server/api/auth/login.post.ts
import { z } from 'zod'
import bcrypt from 'bcrypt'

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse)
  
  console.log('=== 🔐 INICIO LOGIN ===')
  console.log('📧 Email recibido:', body.email)
  console.log('🔑 Password recibida:', body.password)
  
  // Buscar usuario con TODOS los campos necesarios
  const dbUser = await prisma.user.findUnique({
    where: { email: body.email },
    select: {
      id: true,
      email: true,  
      role: true,
      firstName: true,
      lastName: true,
      isActive: true,
      passwordHash: true,
      failedLoginAttempts: true,      
    }
  })
  
  console.log('👤 Usuario encontrado:', dbUser)
  console.log('✅ Usuario activo:', dbUser?.isActive)
  console.log('🔐 Tiene passwordHash:', !!dbUser?.passwordHash)

  // ✅ Verificación PASO A PASO
  if (!dbUser) {
    console.log('❌ ERROR: Usuario no encontrado')
    throw createError({ statusCode: 401, message: 'Credenciales inválidas' })
  }

  if (!dbUser.isActive) {
    console.log('❌ ERROR: Usuario inactivo')
    throw createError({ statusCode: 401, message: 'Credenciales inválidas' })
  }

  if (!dbUser.passwordHash) {
    console.log('❌ ERROR: Sin passwordHash (usuario OAuth?)')
    throw createError({ statusCode: 401, message: 'Credenciales inválidas' })
  }

  console.log('🔐 Comparando passwords...')
  console.log('📥 Password plana:', body.password)
  console.log('🗃️ Password hash:', dbUser.passwordHash.substring(0, 20) + '...')

  const valid = await bcrypt.compare(body.password, dbUser.passwordHash)
  console.log('✅ Resultado bcrypt.compare:', valid)

  if (!valid) {
    console.log('❌ ERROR: Password incorrecta')
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { failedLoginAttempts: { increment: 1 } },
    })
    throw createError({ statusCode: 401, message: 'Credenciales inválidas' })
  }

  console.log('🎉 LOGIN EXITOSO para:', dbUser.email)

  // Actualizar último login
  await prisma.user.update({
    where: { id: dbUser.id },
    data: { failedLoginAttempts: 0, lastLoginAt: new Date() },
  })

  // Crear sesión
  await setUserSession(event, {
    user: { id: dbUser.id, 
            email: dbUser.email, 
            role: dbUser.role, 
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            isActive: dbUser.isActive},
    loggedInAt: new Date().toISOString(),
  })

  console.log('=== ✅ LOGIN COMPLETADO ===')

  return {
    success: true,    
  }
})