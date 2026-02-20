import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'No autenticado'
    })
  }  
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      dni: true,
      birthDate: true,
      address: {
        select: {
          addressLine: true,
          floorDoor: true,
          postalCode: true,
          locality: true,
          province: true,
        }
      }
    }
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'Usuario no encontrado'
    })
  }

  // Formatear datos para el frontend
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    dni: user.dni,
    birthDate: user.birthDate?.toISOString().split('T')[0] || '',
    addressLine: user.address?.addressLine || '',
    floorDoor: user.address?.floorDoor || '',
    postalCode: user.address?.postalCode || '',
    locality: user.address?.locality || '',
    province: user.address?.province || '',    
  }
})