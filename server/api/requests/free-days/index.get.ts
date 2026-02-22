// server/api/requests/free-days/index.get.ts
// Obtener días de libre disposición consumidos y disponibles

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any
  const userId = user.id as string

  // Obtener año académico actual (ej: 2024-2025)
  const now = new Date()
  const currentYear = now.getFullYear()
  const academicYearStart = now.getMonth() >= 8 // Septiembre = inicio curso
    ? currentYear
    : currentYear - 1
  const academicYearEnd = academicYearStart + 1

  // Fechas límites del curso académico
  const courseStart = new Date(academicYearStart, 8, 1) // 1 de septiembre
  const courseEnd = new Date(academicYearEnd, 6, 31) // 31 de julio

  // Obtener solicitudes de días de libre disposición aprobadas/cerradas del curso actual
  const freeDayRequests = await prisma.request.findMany({
    where: {
      requesterId: userId,
      type: 'FREE_DAY',
      status: { in: ['APPROVED', 'CLOSED'] },
      requestedDate: {
        gte: courseStart,
        lte: courseEnd,
      },
    },
    orderBy: { requestedDate: 'asc' },
    select: {
      id: true,
      requestedDate: true,
      status: true,
      approvedAt: true,
      createdAt: true,
    },
  })

  // Calcular disponibilidad según fecha actual
  const consumedDays = freeDayRequests.length
  const availableDays = 4 - consumedDays

  // Determinar qué días puede solicitar según fechas límite
  const currentDate = new Date()
  const currentYearValue = currentDate.getFullYear()

  // Fechas límite para cada día
  const deadlines = [
    { day: 1, limit: new Date(currentYearValue, 11, 21) }, // 21 diciembre
    { day: 2, limit: new Date(currentYearValue + 1, 3, 1) }, // 1 abril
    { day: 3, limit: new Date(currentYearValue + 1, 5, 30) }, // 30 junio
    { day: 4, limit: new Date(currentYearValue + 1, 5, 30) }, // 30 junio
  ]

  // Calcular qué días puede aún solicitar
  const availableSlots = deadlines
    .slice(consumedDays)
    .filter(slot => currentDate <= slot.limit)
    .map(slot => ({
      dayNumber: slot.day,
      deadline: slot.limit.toISOString().split('T')[0],
      daysRemaining: Math.ceil((slot.limit.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)),
    }))

  // Validación de rangos de solicitud
  // Mínimo 15 días, máximo 3 meses
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 15)
  
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 3)

  return {
    success: true,
    data: {
      academicYear: `${academicYearStart}-${academicYearEnd}`,
      totalAllowed: 4,
      consumed: consumedDays,
      available: Math.max(0, availableDays),
      consumedDays: freeDayRequests.map((req, index) => ({
        number: index + 1,
        id: req.id,
        date: req.requestedDate?.toISOString().split('T')[0],
        status: req.status,
        requestedAt: req.createdAt.toISOString().split('T')[0],
      })),
      nextAvailableSlot: availableSlots[0] || null,
      availableSlots,
      // Para validación de nuevas solicitudes
      validation: {
        minRequestDate: minDate.toISOString().split('T')[0],
        maxRequestDate: maxDate.toISOString().split('T')[0],
        canRequest: availableDays > 0 && availableSlots.length > 0,
      },
    },
  }
})
