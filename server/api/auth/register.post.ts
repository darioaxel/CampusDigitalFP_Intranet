// ~/server/api/auth/register.post.ts
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { Role } from '@prisma/client'

// Esquema de validación
const registerSchema = z.object({
  firstName: z.string().min(2, 'Nombre muy corto'),
  lastName: z.string().min(2, 'Apellidos muy cortos'),
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, registerSchema.parse)
    
    console.log('📝 Registro recibido:', body.email)

    // Verificar si existe
    const exists = await prisma.user.findUnique({ 
      where: { email: body.email } 
    })

    if (exists) {
      throw createError({
        statusCode: 409, // Conflict
        message: 'Este email ya está registrado'
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 12)

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: body.email,
        emailPersonal: body.email,        
        firstName: body.firstName,
        lastName: body.lastName,       
        role: Role.USER, // Siempre USER para registro público
        isActive: true,
        passwordHash: hashedPassword, // ✅ Campo correcto
        failedLoginAttempts: 0,
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(body.firstName + '+' + body.lastName)}&background=random`,
      }
    })

    console.log('✅ Usuario creado:', user.email)

    // Crear sesión con nuxt-auth-utils
    await setUserSession(event, {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      loggedInAt: new Date(),
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }
    }

  } catch (error: any) {
    console.error('❌ Error en registro:', error)
    
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        message: error.errors[0]?.message || 'Datos inválidos'
      })
    }
    
    throw error
  }
})