// POST /api/users - Crear un nuevo usuario (solo ADMIN/ROOT)
import { z } from 'zod'
import bcrypt from 'bcrypt'

const createUserSchema = z.object({
  firstName: z.string().min(2, 'Nombre muy corto'),
  lastName: z.string().min(2, 'Apellidos muy cortos'),
  email: z.string().email('Email inválido').toLowerCase(),
  emailPersonal: z.string().email('Email personal inválido').toLowerCase().optional(),
  role: z.enum(['USER', 'PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN'], {
    errorMap: () => ({ message: 'Rol inválido' })
  }),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  phone: z.string().optional(),
  dni: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
  // Campos opcionales de dirección
  address: z.object({
    addressLine: z.string(),
    floorDoor: z.string().optional(),
    postalCode: z.string(),
    locality: z.string(),
    province: z.string(),
  }).optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    
    if (!session?.user?.id) {
      throw createError({
        statusCode: 401,
        message: 'No autenticado'
      })
    }

    // Verificar que sea ADMIN o ROOT
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!currentUser || !['ADMIN', 'ROOT'].includes(currentUser.role)) {
      throw createError({
        statusCode: 403,
        message: 'No autorizado'
      })
    }

    const body = await readValidatedBody(event, createUserSchema.parse)

    // Verificar si el email ya existe
    const exists = await prisma.user.findUnique({ 
      where: { email: body.email } 
    })

    if (exists) {
      throw createError({
        statusCode: 409,
        message: 'Este email ya está registrado'
      })
    }

    // Verificar DNI único si se proporciona
    if (body.dni) {
      const dniExists = await prisma.user.findFirst({
        where: { dni: body.dni }
      })
      if (dniExists) {
        throw createError({
          statusCode: 409,
          message: 'Este DNI ya está registrado'
        })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 12)

    // Crear dirección si se proporciona
    let addressData = undefined
    if (body.address) {
      addressData = {
        create: {
          addressLine: body.address.addressLine,
          floorDoor: body.address.floorDoor || null,
          postalCode: body.address.postalCode,
          locality: body.address.locality,
          province: body.address.province,
        }
      }
    }

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: body.email,
        emailPersonal: body.emailPersonal || body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role,
        isActive: body.isActive,
        passwordHash: hashedPassword,
        failedLoginAttempts: 0,
        phone: body.phone,
        dni: body.dni,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(body.firstName + '+' + body.lastName)}&background=random`,
        deactivatedAt: body.isActive ? null : new Date(),
        address: addressData,
      },
      include: {
        address: true,
      }
    })

    // Crear log de actividad
    await prisma.activityLog.create({
      data: {
        actorId: session.user.id,
        action: 'USER_CREATED',
        description: `Usuario "${user.firstName} ${user.lastName}" (${user.email}) creado por administración`,
        entityType: 'USER',
        entityId: user.id,
        metadata: JSON.stringify({
          role: user.role,
          createdBy: session.user.id,
        }),
      },
    })

    return {
      success: true,
      message: 'Usuario creado correctamente',
      data: {
        id: user.id,
        email: user.email,
        emailPersonal: user.emailPersonal,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        phone: user.phone,
        dni: user.dni,
        birthDate: user.birthDate,
        createdAt: user.createdAt,
        address: user.address,
      }
    }

  } catch (error: any) {
    console.error('❌ Error creando usuario:', error)
    
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        message: error.errors[0]?.message || 'Datos inválidos'
      })
    }
    
    if (error.statusCode) throw error
    
    throw createError({
      statusCode: 500,
      message: 'Error al crear el usuario'
    })
  }
})
