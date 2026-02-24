// Seed de calendario de libre disposición para 2025-2026

export const freeDispositionCalendar2025_2026 = {
  name: 'Días Libre Disposición 2025-2026',
  type: 'FREE_DISPOSITION' as const,
  academicYear: '2025-2026',
  description: 'Calendario para solicitar días de libre disposición durante el curso 2025-2026',
  allowDragDrop: false,
  maxEventsPerUser: 4,
  validFrom: '2025-09-01',
  validUntil: '2026-06-30',
  // Días disponibles (todos los días lectivos de lunes a viernes)
  events: generateWeekdays('2025-09-01', '2026-06-30')
}

// Generar días de semana (lunes a viernes) excluyendo festivos
function generateWeekdays(startDate: string, endDate: string) {
  const events = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Festivos 2025-2026 (simplificado)
  const holidays = [
    '2025-10-12', // Hispanidad
    '2025-11-01', // Todos los Santos
    '2025-12-06', // Constitución
    '2025-12-08', // Inmaculada
    '2025-12-25', // Navidad
    '2026-01-01', // Año Nuevo
    '2026-01-06', // Reyes
    '2026-02-28', // Día de Andalucía
    '2026-03-19', // San José
    '2026-04-02', // Jueves Santo
    '2026-04-03', // Viernes Santo
    '2026-05-01', // Día del Trabajo
  ]
  
  const current = new Date(start)
  
  while (current <= end) {
    const dayOfWeek = current.getDay()
    const dateStr = current.toISOString().split('T')[0]
    
    // Solo lunes a viernes (1-5) y no festivos
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !holidays.includes(dateStr)) {
      events.push({
        title: 'Día disponible',
        description: 'Día de libre disposición disponible para solicitar',
        type: 'FREE_DISPOSITION' as const,
        startDate: dateStr,
        endDate: dateStr,
        isAllDay: true,
        isActive: true,
        maxAssignments: 3
      })
    }
    
    current.setDate(current.getDate() + 1)
  }
  
  return events
}
