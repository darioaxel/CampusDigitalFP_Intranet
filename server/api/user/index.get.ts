// ~/server/api/user/index.get.ts
import type { User } from '#auth-utils'


export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user!.id },
    select: {
      id: true,
      email: true,   
      emailPersonal: true,
      firstName: true,
      lastName: true,      
      phone: true,
      dni: true,
      birthDate: true,
      picture: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!dbUser || !dbUser.isActive) {
    await clearUserSession(event)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return {
    id: dbUser.id,
    email: dbUser.email,  
    emailPersonal: dbUser.emailPersonal,
    name: dbUser.firstName,
    lastName: dbUser.lastName,    
    phone: dbUser.phone,
    dni: dbUser.dni,
    birthDate: dbUser.birthDate,
    picture: dbUser.picture,
    role: dbUser.role,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
    loggedInAt: session.loggedInAt,
  }
})