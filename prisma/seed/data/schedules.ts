import { ScheduleType, DayOfWeek } from '@prisma/client'

export interface ScheduleTemplate {
  name: string
  type: ScheduleType
  color: string
  blocks: {
    dayOfWeek: DayOfWeek  // ← Cambiado de number a DayOfWeek
    startTime: string
    endTime: string
    subject: string
    room: string
    isBreak?: boolean
  }[]
}

export const scheduleTemplates: ScheduleTemplate[] = [
  {
    name: 'Horario Mañana DAM',
    type: ScheduleType.NORMAL,
    color: '#3b82f6',
    blocks: [
      { dayOfWeek: DayOfWeek.LUNES, startTime: '08:00', endTime: '09:00', subject: 'Programación', room: 'A101' },
      { dayOfWeek: DayOfWeek.LUNES, startTime: '09:00', endTime: '10:00', subject: 'Base de Datos', room: 'A102' },
      { dayOfWeek: DayOfWeek.LUNES, startTime: '10:00', endTime: '11:00', subject: 'Descanso', room: '-', isBreak: true },
      { dayOfWeek: DayOfWeek.LUNES, startTime: '11:00', endTime: '12:00', subject: 'Sistemas', room: 'A103' },
      { dayOfWeek: DayOfWeek.LUNES, startTime: '12:00', endTime: '13:00', subject: 'Lenguajes de Marcas', room: 'A104' },
      { dayOfWeek: DayOfWeek.LUNES, startTime: '13:00', endTime: '14:00', subject: 'Entornos', room: 'A101' },
      { dayOfWeek: DayOfWeek.MARTES, startTime: '08:00', endTime: '09:00', subject: 'FOL', room: 'B201' },
      { dayOfWeek: DayOfWeek.MARTES, startTime: '09:00', endTime: '10:00', subject: 'Programación', room: 'A101' },
      { dayOfWeek: DayOfWeek.MARTES, startTime: '10:00', endTime: '11:00', subject: 'Descanso', room: '-', isBreak: true },
      { dayOfWeek: DayOfWeek.MARTES, startTime: '11:00', endTime: '13:00', subject: 'Proyecto', room: 'Lab1' },
      { dayOfWeek: DayOfWeek.MIERCOLES, startTime: '08:00', endTime: '10:00', subject: 'Base de Datos', room: 'A102' },
      { dayOfWeek: DayOfWeek.MIERCOLES, startTime: '10:00', endTime: '11:00', subject: 'Descanso', room: '-', isBreak: true },
      { dayOfWeek: DayOfWeek.MIERCOLES, startTime: '11:00', endTime: '13:00', subject: 'Programación', room: 'A101' },
      { dayOfWeek: DayOfWeek.MIERCOLES, startTime: '13:00', endTime: '14:00', subject: 'Sistemas', room: 'A103' },
      { dayOfWeek: DayOfWeek.JUEVES, startTime: '08:00', endTime: '09:00', subject: 'Lenguajes', room: 'A104' },
      { dayOfWeek: DayOfWeek.JUEVES, startTime: '09:00', endTime: '10:00', subject: 'Entornos', room: 'A101' },
      { dayOfWeek: DayOfWeek.JUEVES, startTime: '10:00', endTime: '11:00', subject: 'Descanso', room: '-', isBreak: true },
      { dayOfWeek: DayOfWeek.JUEVES, startTime: '11:00', endTime: '13:00', subject: 'FOL', room: 'B201' },
      { dayOfWeek: DayOfWeek.VIERNES, startTime: '08:00', endTime: '10:00', subject: 'Proyecto', room: 'Lab1' },
      { dayOfWeek: DayOfWeek.VIERNES, startTime: '10:00', endTime: '11:00', subject: 'Descanso', room: '-', isBreak: true },
      { dayOfWeek: DayOfWeek.VIERNES, startTime: '11:00', endTime: '13:00', subject: 'Tutoría', room: 'Despacho' },
    ]
  },
  {
    name: 'Horario Tarde DAW',
    type: ScheduleType.NORMAL,
    color: '#10b981',
    blocks: [
      { dayOfWeek: DayOfWeek.LUNES, startTime: '15:00', endTime: '17:00', subject: 'Desarrollo Web', room: 'B101' },
      { dayOfWeek: DayOfWeek.LUNES, startTime: '17:00', endTime: '17:30', subject: 'Descanso', room: '-', isBreak: true },
      { dayOfWeek: DayOfWeek.LUNES, startTime: '17:30', endTime: '19:00', subject: 'Programación', room: 'B102' },
      { dayOfWeek: DayOfWeek.LUNES, startTime: '19:00', endTime: '21:00', subject: 'Bases de Datos', room: 'B103' },
      { dayOfWeek: DayOfWeek.MARTES, startTime: '15:00', endTime: '17:00', subject: 'Sistemas', room: 'B101' },
      { dayOfWeek: DayOfWeek.MARTES, startTime: '17:00', endTime: '17:30', subject: 'Descanso', room: '-', isBreak: true },
      { dayOfWeek: DayOfWeek.MARTES, startTime: '17:30', endTime: '19:30', subject: 'Web', room: 'Lab2' },
      { dayOfWeek: DayOfWeek.MARTES, startTime: '19:30', endTime: '21:00', subject: 'FOL', room: 'B201' },
      { dayOfWeek: DayOfWeek.MIERCOLES, startTime: '15:00', endTime: '17:00', subject: 'Proyecto', room: 'Lab2' },
      { dayOfWeek: DayOfWeek.MIERCOLES, startTime: '17:00', endTime: '17:30', subject: 'Descanso', room: '-', isBreak: true },
      { dayOfWeek: DayOfWeek.MIERCOLES, startTime: '17:30', endTime: '20:00', subject: 'Programación', room: 'B102' },
      { dayOfWeek: DayOfWeek.JUEVES, startTime: '15:00', endTime: '17:00', subject: 'Bases Datos', room: 'B103' },
      { dayOfWeek: DayOfWeek.JUEVES, startTime: '17:00', endTime: '17:30', subject: 'Descanso', room: '-', isBreak: true },
      { dayOfWeek: DayOfWeek.JUEVES, startTime: '17:30', endTime: '19:30', subject: 'Sistemas', room: 'B101' },
      { dayOfWeek: DayOfWeek.VIERNES, startTime: '15:00', endTime: '17:00', subject: 'Web', room: 'Lab2' },
      { dayOfWeek: DayOfWeek.VIERNES, startTime: '17:00', endTime: '17:30', subject: 'Descanso', room: '-', isBreak: true },
      { dayOfWeek: DayOfWeek.VIERNES, startTime: '17:30', endTime: '19:30', subject: 'Proyecto', room: 'Lab2' },
    ]
  },
  {
    name: 'Exámenes Enero',
    type: ScheduleType.EXAMENES,
    color: '#f59e0b',
    blocks: [
      { dayOfWeek: DayOfWeek.LUNES, startTime: '09:00', endTime: '11:00', subject: 'Examen Programación', room: 'Aula 1' },
      { dayOfWeek: DayOfWeek.MARTES, startTime: '09:00', endTime: '11:00', subject: 'Examen Bases Datos', room: 'Aula 2' },
      { dayOfWeek: DayOfWeek.MIERCOLES, startTime: '09:00', endTime: '11:00', subject: 'Examen Sistemas', room: 'Aula 1' },
      { dayOfWeek: DayOfWeek.JUEVES, startTime: '09:00', endTime: '11:00', subject: 'Examen Web', room: 'Aula 3' },
      { dayOfWeek: DayOfWeek.VIERNES, startTime: '09:00', endTime: '11:00', subject: 'Examen FOL', room: 'Aula 1' },
    ]
  },
  {
    name: 'Guardia Coordinación',
    type: ScheduleType.GUARDIA,
    color: '#8b5cf6',
    blocks: [
      { dayOfWeek: DayOfWeek.LUNES, startTime: '08:00', endTime: '09:00', subject: 'Guardia Pasillo A', room: 'Pasillo A' },
      { dayOfWeek: DayOfWeek.LUNES, startTime: '11:00', endTime: '12:00', subject: 'Guardia Patio', room: 'Patio' },
      { dayOfWeek: DayOfWeek.MARTES, startTime: '08:00', endTime: '09:00', subject: 'Guardia Entrada', room: 'Hall' },
      { dayOfWeek: DayOfWeek.MIERCOLES, startTime: '13:00', endTime: '14:00', subject: 'Guardia Comedor', room: 'Comedor' },
      { dayOfWeek: DayOfWeek.JUEVES, startTime: '11:00', endTime: '12:00', subject: 'Guardia Pasillo B', room: 'Pasillo B' },
      { dayOfWeek: DayOfWeek.VIERNES, startTime: '08:00', endTime: '09:00', subject: 'Guardia Patio', room: 'Patio' },
    ]
  },
  {
    name: 'Refuerzo Académico',
    type: ScheduleType.REFUERZO,
    color: '#ec4899',
    blocks: [
      { dayOfWeek: DayOfWeek.LUNES, startTime: '14:00', endTime: '15:00', subject: 'Refuerzo Prog', room: 'Aula R' },
      { dayOfWeek: DayOfWeek.MARTES, startTime: '14:00', endTime: '15:00', subject: 'Refuerzo BD', room: 'Aula R' },
      { dayOfWeek: DayOfWeek.MIERCOLES, startTime: '14:00', endTime: '15:00', subject: 'Refuerzo Sist', room: 'Aula R' },
      { dayOfWeek: DayOfWeek.JUEVES, startTime: '14:00', endTime: '15:00', subject: 'Refuerzo Web', room: 'Aula R' },
    ]
  }
]

// Templates extra solo para profesores
export const teacherExtraTemplates: ScheduleTemplate[] = [
  {
    name: 'Tutorías y Reuniones',
    type: ScheduleType.NORMAL,
    color: '#06b6d4',
    blocks: [
      { dayOfWeek: DayOfWeek.LUNES, startTime: '14:00', endTime: '15:00', subject: 'Tutoría Alumnos', room: 'Despacho' },
      { dayOfWeek: DayOfWeek.MIERCOLES, startTime: '14:00', endTime: '15:30', subject: 'Reunión Depto', room: 'Sala Reuniones' },
      { dayOfWeek: DayOfWeek.VIERNES, startTime: '13:00', endTime: '14:00', subject: 'Atención Familias', room: 'Despacho' },
    ]
  },
  {
    name: 'Coordinación FP',
    type: ScheduleType.GUARDIA,
    color: '#84cc16',
    blocks: [
      { dayOfWeek: DayOfWeek.MARTES, startTime: '14:00', endTime: '16:00', subject: 'Coordinación', room: 'Sala Prof' },
      { dayOfWeek: DayOfWeek.JUEVES, startTime: '14:00', endTime: '16:00', subject: 'Revisión Proy', room: 'Lab' },
    ]
  }
]