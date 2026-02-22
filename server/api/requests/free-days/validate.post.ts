// server/api/requests/free-days/validate.post.ts
// Validar si una fecha propuesta cumple las restricciones

import { z } from 'zod'

const validateSchema = z.object({
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato debe ser YYYY-MM-DD'),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any
  const userId = user.id as string

  const body = await readBody(event)
  const validation = validateSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: 'Fecha inválida',
      data: validation.error.flatten(),
    })
  }

  const { requestedDate } = validation.data
  const proposedDate = new Date(requestedDate)
  const now = new Date()
  const currentYear = now.getFullYear()

  // Limpiar horas para comparación precisa
  proposedDate.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)

  // 1. Validar rango de solicitud (mínimo 15 días, máximo 3 meses)
  const minDate = new Date(now)
  minDate.setDate(minDate.getDate() + 15)
  
  const maxDate = new Date(now)
  maxDate.setMonth(maxDate.getMonth() + 3)

  if (proposedDate < minDate) {
    return {
      valid: false,
      error: 'La fecha debe ser con al menos 15 días de antelación',
      minDate: minDate.toISOString().split('T')[0],
    }
  }

  if (proposedDate > maxDate) {
    return {
      valid: false,
      error: 'La fecha no puede ser superior a 3 meses de antelación',
      maxDate: maxDate.toISOString().split('T')[0],
    }
  }

  // 2. Verificar días ya consumidos
  const courseStart = new Date(currentYear, 8, 1) // 1 septiembre
  const courseEnd = new Date(currentYear + 1, 6, 31) // 31 julio

  const consumedCount = await prisma.request.count({
    where: {
      requesterId: userId,
      type: 'FREE_DAY',
      status: { in: ['APPROVED', 'CLOSED'] },
      requestedDate: {
        gte: courseStart,
        lte: courseEnd,
      },
    },
  })

  if (consumedCount >= 4) {
    return {
      valid: false,
      error: 'Ya has consumido los 4 días de libre disposición permitidos',
      consumedDays: consumedCount,
    }
  }

  // 3. Validar fechas límite según el número de día
  const dayNumber = consumedCount + 1
  
  let deadline: Date
  switch (dayNumber) {
    case 1:
      deadline = new Date(currentYear, 11, 21) // 21 diciembre
      break
    case 2:
      deadline = new Date(currentYear + 1, 3, 1) // 1 abril
      break
    case 3:
    case 4:
      deadline = new Date(currentYear + 1, 5, 30) // 30 junio
      break
    default:
      return {
        valid: false,
        error: 'Número de día inválido',
      }
  }

  if (proposedDate > deadline) {
    const deadlineLabels: Record<number, string> = {
      1: '21 de diciembre',
      2: '1 de abril',
      3: '30 de junio',
      4: '30 de junio',
    }
    return {
      valid: false,
      error: `El día ${dayNumber} debe disfrutarse antes del ${deadlineLabels[dayNumber]}`,
      deadline: deadline.toISOString().split('T')[0],
      dayNumber,
    }
  }

  // 4. Verificar que no haya otra solicitud pendiente para la misma fecha
  const existingRequest = await prisma.request.findFirst({
    where: {
      requesterId: userId,
      type: 'FREE_DAY',
      requestedDate: proposedDate,
      status: { not: 'REJECTED' },
    },
  })

  if (existingRequest) {
    return {
      valid: false,
      error: 'Ya tienes una solicitud para esta fecha',
      existingRequestId: existingRequest.id,
    }
  }

  // Todo válido
  return {
    valid: true,
    dayNumber,
    deadline: deadline.toISOString().split('T')[0],
    message: `Día ${dayNumber} de 4 - Disponible hasta ${deadline.toLocaleDateString('es-ES')}`,
  }
})
