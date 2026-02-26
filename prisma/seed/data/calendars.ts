import { CalendarType, CalendarEventType } from '@prisma/client'

// ========== TIPOS ==========

export interface CalendarEventData {
  title: string
  description?: string
  type: CalendarEventType
  startDate: string // YYYY-MM-DD
  endDate?: string  // YYYY-MM-DD (opcional, para eventos de varios días)
  isAllDay?: boolean
  color?: string
  maxAssignments?: number
}

export interface CalendarData {
  name: string
  description?: string
  type: CalendarType
  academicYear: string // formato: "2025-2026"
  startDate: string    // YYYY-MM-DD
  endDate: string      // YYYY-MM-DD
  isPublic?: boolean
  allowDragDrop?: boolean
  maxEventsPerUser?: number
  events: CalendarEventData[]
}

// ========== COLORES ==========
const COLORS = {
  holiday: '#EF4444',      // Rojo - Festivos
  lective: '#22C55E',      // Verde - Días lectivos
  evaluation: '#F59E0B',   // Amarillo - Evaluaciones
  freeDisposition: '#3B82F6', // Azul - Libre disposición
  meeting: '#8B5CF6',      // Morado - Reuniones
  deadline: '#EC4899',     // Rosa - Fechas límite
}

// Festivos Aragón 2025-2026
const holidays2025_2026 = [
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

// Generar eventos de días lectivos (lunes a viernes no festivos)
function generateLectiveDays(startDate: string, endDate: string): CalendarEventData[] {
  const events: CalendarEventData[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  const current = new Date(start)

  while (current <= end) {
    const dayOfWeek = current.getDay() // 0 = domingo, 1 = lunes, ..., 6 = sábado
    const dateStr = current.toISOString().split('T')[0]
    
    // Solo lunes a viernes (1-5) y no festivos
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !holidays2025_2026.includes(dateStr)) {
      events.push({
        title: 'Día lectivo',
        type: CalendarEventType.LECTIVE,
        startDate: dateStr,
        color: COLORS.lective,
        isAllDay: true
      })
    }
    
    current.setDate(current.getDate() + 1)
  }
  
  return events
}

// Generar eventos de libre disposición (lunes a viernes no festivos)
function generateFreeDispositionDays(startDate: string, endDate: string): CalendarEventData[] {
  const events: CalendarEventData[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  const current = new Date(start)

  while (current <= end) {
    const dayOfWeek = current.getDay()
    const dateStr = current.toISOString().split('T')[0]
    
    // Solo lunes a viernes (1-5) y no festivos
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !holidays2025_2026.includes(dateStr)) {
      events.push({
        title: 'Día de libre disposición',
        description: 'Día disponible para solicitar libre disposición',
        type: CalendarEventType.FREE_DISPOSITION,
        startDate: dateStr,
        color: COLORS.freeDisposition,
        isAllDay: true,
        maxAssignments: 3
      })
    }
    
    current.setDate(current.getDate() + 1)
  }
  
  return events
}

// ========================================
// 1. CALENDARIO TEMPLATE 2025-2026
// ========================================
export const calendarTemplate2025_2026: CalendarData = {
  name: 'Calendario curso 2025-2026',
  description: 'Template de calendario escolar para el curso 2025-2026. Del 1 de septiembre de 2025 al 31 de julio de 2026.',
  type: CalendarType.TEMPLATE,
  academicYear: '2025-2026',
  startDate: '2025-09-01',
  endDate: '2026-07-31',
  isPublic: true,
  allowDragDrop: false,
  events: [
    // Inicio y fin de curso
    { title: 'Inicio del Curso Escolar', type: CalendarEventType.LECTIVE, startDate: '2025-09-01', color: COLORS.lective },
    { title: 'Fin del Curso Escolar', type: CalendarEventType.LECTIVE, startDate: '2026-06-19', color: COLORS.lective },

    // Fiestas nacionales
    { title: 'Fiesta Nacional de España', type: CalendarEventType.HOLIDAY, startDate: '2025-10-12', color: COLORS.holiday },
    { title: 'Día de la Constitución', type: CalendarEventType.HOLIDAY, startDate: '2025-12-06', color: COLORS.holiday },
    { title: 'Inmaculada Concepción', type: CalendarEventType.HOLIDAY, startDate: '2025-12-08', color: COLORS.holiday },
    { title: 'Año Nuevo', type: CalendarEventType.HOLIDAY, startDate: '2026-01-01', color: COLORS.holiday },
    { title: 'Reyes', type: CalendarEventType.HOLIDAY, startDate: '2026-01-06', color: COLORS.holiday },
    { title: 'Día del Trabajo', type: CalendarEventType.HOLIDAY, startDate: '2026-05-01', color: COLORS.holiday },

    // Fiestas de Aragón
    { title: 'San Jorge (Día de Aragón)', type: CalendarEventType.HOLIDAY, startDate: '2026-04-23', color: COLORS.holiday },

    // Vacaciones de Navidad
    { title: 'Vacaciones de Navidad', type: CalendarEventType.HOLIDAY, startDate: '2025-12-22', endDate: '2026-01-07', color: COLORS.holiday },

    // Vacaciones de Semana Santa (2026: 30 marzo - 6 abril)
    { title: 'Vacaciones de Semana Santa', type: CalendarEventType.HOLIDAY, startDate: '2026-03-30', endDate: '2026-04-06', color: COLORS.holiday },

    // Evaluaciones (trimestral)
    { title: '1ª Evaluación - Inicio', type: CalendarEventType.EVALUATION, startDate: '2025-09-10', color: COLORS.evaluation },
    { title: '1ª Evaluación - Fin', type: CalendarEventType.EVALUATION, startDate: '2025-12-19', color: COLORS.evaluation },
    { title: '2ª Evaluación - Inicio', type: CalendarEventType.EVALUATION, startDate: '2026-01-08', color: COLORS.evaluation },
    { title: '2ª Evaluación - Fin', type: CalendarEventType.EVALUATION, startDate: '2026-03-27', color: COLORS.evaluation },
    { title: '3ª Evaluación - Inicio', type: CalendarEventType.EVALUATION, startDate: '2026-04-07', color: COLORS.evaluation },
    { title: '3ª Evaluación - Fin', type: CalendarEventType.EVALUATION, startDate: '2026-06-19', color: COLORS.evaluation },

    // Puentes locales comunes
    { title: 'Puente de Todos los Santos', type: CalendarEventType.HOLIDAY, startDate: '2025-11-01', color: COLORS.holiday },
    
    // Días lectivos (generados automáticamente)
    ...generateLectiveDays('2025-09-01', '2026-07-31')
  ]
}

// ========================================
// 2. CALENDARIO DE LIBRE DISPOSICIÓN 2025-2026
// ========================================
export const freeDispositionCalendar2025_2026: CalendarData = {
  name: 'Dias de libre disposición 2025-2026',
  description: 'Calendario para solicitar días de libre disposición durante el curso 2025-2026',
  type: CalendarType.FREE_DISPOSITION,
  academicYear: '2025-2026',
  startDate: '2025-09-01',
  endDate: '2026-07-31',
  isPublic: true,
  allowDragDrop: true,
  maxEventsPerUser: 4, // Máximo 4 días por profesor
  events: generateFreeDispositionDays('2025-09-01', '2026-07-31')
}

// Exportar todos los calendarios
export const allCalendars: CalendarData[] = [
  calendarTemplate2025_2026,
  freeDispositionCalendar2025_2026
]
