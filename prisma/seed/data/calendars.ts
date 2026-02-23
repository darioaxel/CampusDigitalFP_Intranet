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
  academicYear: string // formato: "2024-2025"
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

// ========== CURSO 2024-2025 ==========

export const calendar2024_2025: CalendarData = {
  name: 'Calendario Escolar Aragón 2024-2025',
  description: 'Calendario escolar oficial de la Comunidad de Aragón para el curso 2024-2025',
  type: CalendarType.SCHOOL_YEAR,
  academicYear: '2024-2025',
  startDate: '2024-09-09',
  endDate: '2025-06-20',
  isPublic: true,
  events: [
    // Inicio y fin de curso
    { title: 'Inicio del Curso Escolar', type: CalendarEventType.LECTIVE, startDate: '2024-09-09', color: COLORS.lective },
    { title: 'Fin del Curso Escolar', type: CalendarEventType.LECTIVE, startDate: '2025-06-20', color: COLORS.lective },

    // Fiestas nacionales
    { title: 'Fiesta Nacional de España', type: CalendarEventType.HOLIDAY, startDate: '2024-10-12', color: COLORS.holiday },
    { title: 'Día de la Constitución', type: CalendarEventType.HOLIDAY, startDate: '2024-12-06', color: COLORS.holiday },
    { title: 'Inmaculada Concepción', type: CalendarEventType.HOLIDAY, startDate: '2024-12-09', color: COLORS.holiday }, // Traslado del 8 (domingo)
    { title: 'Año Nuevo', type: CalendarEventType.HOLIDAY, startDate: '2025-01-01', color: COLORS.holiday },
    { title: 'Reyes', type: CalendarEventType.HOLIDAY, startDate: '2025-01-06', color: COLORS.holiday },
    { title: 'Día del Trabajo', type: CalendarEventType.HOLIDAY, startDate: '2025-05-01', color: COLORS.holiday },

    // Fiestas de Aragón
    { title: 'San Jorge (Día de Aragón)', type: CalendarEventType.HOLIDAY, startDate: '2025-04-23', color: COLORS.holiday },

    // Vacaciones de Navidad
    { title: 'Vacaciones de Navidad', type: CalendarEventType.HOLIDAY, startDate: '2024-12-23', endDate: '2025-01-07', color: COLORS.holiday },

    // Vacaciones de Semana Santa
    { title: 'Vacaciones de Semana Santa', type: CalendarEventType.HOLIDAY, startDate: '2025-04-14', endDate: '2025-04-21', color: COLORS.holiday },

    // Evaluaciones (trimestral)
    { title: '1ª Evaluación - Inicio', type: CalendarEventType.EVALUATION, startDate: '2024-09-09', color: COLORS.evaluation },
    { title: '1ª Evaluación - Fin', type: CalendarEventType.EVALUATION, startDate: '2024-12-20', color: COLORS.evaluation },
    { title: '2ª Evaluación - Inicio', type: CalendarEventType.EVALUATION, startDate: '2025-01-08', color: COLORS.evaluation },
    { title: '2ª Evaluación - Fin', type: CalendarEventType.EVALUATION, startDate: '2025-03-28', color: COLORS.evaluation },
    { title: '3ª Evaluación - Inicio', type: CalendarEventType.EVALUATION, startDate: '2025-04-22', color: COLORS.evaluation },
    { title: '3ª Evaluación - Fin', type: CalendarEventType.EVALUATION, startDate: '2025-06-20', color: COLORS.evaluation },

    // Puentes locales comunes
    { title: 'Puente de Todos los Santos', type: CalendarEventType.HOLIDAY, startDate: '2024-11-01', color: COLORS.holiday },
  ]
}

// ========== CURSO 2025-2026 ==========

export const calendar2025_2026: CalendarData = {
  name: 'Calendario Escolar Aragón 2025-2026',
  description: 'Calendario escolar oficial de la Comunidad de Aragón para el curso 2025-2026',
  type: CalendarType.SCHOOL_YEAR,
  academicYear: '2025-2026',
  startDate: '2025-09-10',
  endDate: '2026-06-19',
  isPublic: true,
  events: [
    // Inicio y fin de curso
    { title: 'Inicio del Curso Escolar', type: CalendarEventType.LECTIVE, startDate: '2025-09-10', color: COLORS.lective },
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
  ]
}

// Calendario de libre disposición 2024-2025 (días que los profesores pueden elegir)
export const freeDisposition2024_2025: CalendarData = {
  name: 'Días de Libre Disposición 2024-2025',
  description: 'Calendario para la selección de días de libre disposición por parte del profesorado',
  type: CalendarType.FREE_DISPOSITION,
  academicYear: '2024-2025',
  startDate: '2024-09-09',
  endDate: '2025-06-20',
  isPublic: true,
  allowDragDrop: true,
  maxEventsPerUser: 4, // Máximo 4 días por profesor
  events: [
    // Días de libre disposición disponibles (ejemplo: jueves y viernes de ciertas semanas)
    { title: 'Libre Disposición - Opción 1', type: CalendarEventType.FREE_DISPOSITION, startDate: '2024-10-03', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 2', type: CalendarEventType.FREE_DISPOSITION, startDate: '2024-10-04', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 3', type: CalendarEventType.FREE_DISPOSITION, startDate: '2024-11-07', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 4', type: CalendarEventType.FREE_DISPOSITION, startDate: '2024-11-08', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 5', type: CalendarEventType.FREE_DISPOSITION, startDate: '2025-01-16', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 6', type: CalendarEventType.FREE_DISPOSITION, startDate: '2025-01-17', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 7', type: CalendarEventType.FREE_DISPOSITION, startDate: '2025-02-06', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 8', type: CalendarEventType.FREE_DISPOSITION, startDate: '2025-02-07', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 9', type: CalendarEventType.FREE_DISPOSITION, startDate: '2025-03-06', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 10', type: CalendarEventType.FREE_DISPOSITION, startDate: '2025-03-07', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 11', type: CalendarEventType.FREE_DISPOSITION, startDate: '2025-05-08', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 12', type: CalendarEventType.FREE_DISPOSITION, startDate: '2025-05-09', color: COLORS.freeDisposition, maxAssignments: 5 },
  ]
}

// Calendario de libre disposición 2025-2026
export const freeDisposition2025_2026: CalendarData = {
  name: 'Días de Libre Disposición 2025-2026',
  description: 'Calendario para la selección de días de libre disposición por parte del profesorado',
  type: CalendarType.FREE_DISPOSITION,
  academicYear: '2025-2026',
  startDate: '2025-09-10',
  endDate: '2026-06-19',
  isPublic: true,
  allowDragDrop: true,
  maxEventsPerUser: 4,
  events: [
    { title: 'Libre Disposición - Opción 1', type: CalendarEventType.FREE_DISPOSITION, startDate: '2025-10-09', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 2', type: CalendarEventType.FREE_DISPOSITION, startDate: '2025-10-10', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 3', type: CalendarEventType.FREE_DISPOSITION, startDate: '2025-11-13', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 4', type: CalendarEventType.FREE_DISPOSITION, startDate: '2025-11-14', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 5', type: CalendarEventType.FREE_DISPOSITION, startDate: '2026-01-15', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 6', type: CalendarEventType.FREE_DISPOSITION, startDate: '2026-01-16', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 7', type: CalendarEventType.FREE_DISPOSITION, startDate: '2026-02-12', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 8', type: CalendarEventType.FREE_DISPOSITION, startDate: '2026-02-13', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 9', type: CalendarEventType.FREE_DISPOSITION, startDate: '2026-03-12', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 10', type: CalendarEventType.FREE_DISPOSITION, startDate: '2026-03-13', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 11', type: CalendarEventType.FREE_DISPOSITION, startDate: '2026-05-14', color: COLORS.freeDisposition, maxAssignments: 5 },
    { title: 'Libre Disposición - Opción 12', type: CalendarEventType.FREE_DISPOSITION, startDate: '2026-05-15', color: COLORS.freeDisposition, maxAssignments: 5 },
  ]
}

// Exportar todos los calendarios
export const allCalendars: CalendarData[] = [
  calendar2024_2025,
  calendar2025_2026,
  freeDisposition2024_2025,
  freeDisposition2025_2026,
]
