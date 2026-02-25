// Seed de calendario de libre disposición para 2025-2026
// Basado en el calendario escolar de Aragón

export const freeDispositionCalendar2025_2026 = {
  name: 'Días Libre Disposición 2025-2026',
  type: 'FREE_DISPOSITION' as const,
  academicYear: '2025-2026',
  description: 'Calendario para solicitar días de libre disposición durante el curso 2025-2026 (basado en calendario escolar de Aragón)',
  allowDragDrop: false,
  maxEventsPerUser: 4,
  validFrom: '2025-09-01',
  validUntil: '2026-06-30',
  // Días disponibles (todos los días lectivos de lunes a viernes entre el 1 de septiembre y 30 de junio)
  events: generateWeekdays('2025-09-01', '2026-06-30')
}

// Generar días de semana (lunes a viernes) excluyendo festivos de Aragón
function generateWeekdays(startDate: string, endDate: string) {
  const events = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Festivos 2025-2026 basados en el calendario escolar de Aragón
  const holidays = [
    // Fiestas nacionales
    '2025-10-12', // Fiesta Nacional de España (Hispanidad)
    '2025-11-01', // Todos los Santos
    '2025-12-06', // Día de la Constitución
    '2025-12-08', // Inmaculada Concepción
    '2025-12-25', // Navidad
    '2026-01-01', // Año Nuevo
    '2026-01-06', // Reyes
    '2026-05-01', // Día del Trabajo
    
    // Fiestas de Aragón
    '2026-04-23', // San Jorge (Día de Aragón)
    
    // Vacaciones de Navidad (del 22 dic al 7 ene)
    '2025-12-22', '2025-12-23', '2025-12-24', '2025-12-26', '2025-12-29', 
    '2025-12-30', '2025-12-31', '2026-01-02', '2026-01-05', '2026-01-07',
    
    // Vacaciones de Semana Santa 2026 (del 30 marzo al 6 abril)
    '2026-03-30', '2026-03-31', '2026-04-01', '2026-04-02', '2026-04-03',
    '2026-04-06',
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
