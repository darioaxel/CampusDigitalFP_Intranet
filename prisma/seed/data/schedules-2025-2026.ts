// Seed de horarios para el curso 2025-2026
// Incluye templates y horarios de profesores de ejemplo

export const scheduleTemplates2025_2026 = [
  {
    name: 'Horario Base Mañanas',
    type: 'NORMAL',
    color: '#3b82f6',
    description: 'Horario estándar de mañana para ciclos formativos. De lunes a viernes de 8:00 a 14:30 con recreo de 10:00 a 10:30.',
    isTemplate: true,
    blocks: [
      // Lunes
      { dayOfWeek: 'LUNES', startTime: '08:00', endTime: '09:00', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'LUNES', startTime: '09:00', endTime: '10:00', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'LUNES', startTime: '10:00', endTime: '10:30', subject: 'Recreo', room: '', isBreak: true },
      { dayOfWeek: 'LUNES', startTime: '10:30', endTime: '11:30', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'LUNES', startTime: '11:30', endTime: '12:30', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'LUNES', startTime: '12:30', endTime: '13:30', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'LUNES', startTime: '13:30', endTime: '14:30', subject: '', room: '', isBreak: false },
      // Martes
      { dayOfWeek: 'MARTES', startTime: '08:00', endTime: '09:00', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'MARTES', startTime: '09:00', endTime: '10:00', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'MARTES', startTime: '10:00', endTime: '10:30', subject: 'Recreo', room: '', isBreak: true },
      { dayOfWeek: 'MARTES', startTime: '10:30', endTime: '11:30', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'MARTES', startTime: '11:30', endTime: '12:30', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'MARTES', startTime: '12:30', endTime: '13:30', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'MARTES', startTime: '13:30', endTime: '14:30', subject: '', room: '', isBreak: false },
      // Miércoles
      { dayOfWeek: 'MIERCOLES', startTime: '08:00', endTime: '09:00', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'MIERCOLES', startTime: '09:00', endTime: '10:00', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'MIERCOLES', startTime: '10:00', endTime: '10:30', subject: 'Recreo', room: '', isBreak: true },
      { dayOfWeek: 'MIERCOLES', startTime: '10:30', endTime: '11:30', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'MIERCOLES', startTime: '11:30', endTime: '12:30', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'MIERCOLES', startTime: '12:30', endTime: '13:30', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'MIERCOLES', startTime: '13:30', endTime: '14:30', subject: '', room: '', isBreak: false },
      // Jueves
      { dayOfWeek: 'JUEVES', startTime: '08:00', endTime: '09:00', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'JUEVES', startTime: '09:00', endTime: '10:00', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'JUEVES', startTime: '10:00', endTime: '10:30', subject: 'Recreo', room: '', isBreak: true },
      { dayOfWeek: 'JUEVES', startTime: '10:30', endTime: '11:30', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'JUEVES', startTime: '11:30', endTime: '12:30', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'JUEVES', startTime: '12:30', endTime: '13:30', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'JUEVES', startTime: '13:30', endTime: '14:30', subject: '', room: '', isBreak: false },
      // Viernes
      { dayOfWeek: 'VIERNES', startTime: '08:00', endTime: '09:00', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'VIERNES', startTime: '09:00', endTime: '10:00', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'VIERNES', startTime: '10:00', endTime: '10:30', subject: 'Recreo', room: '', isBreak: true },
      { dayOfWeek: 'VIERNES', startTime: '10:30', endTime: '11:30', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'VIERNES', startTime: '11:30', endTime: '12:30', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'VIERNES', startTime: '12:30', endTime: '13:30', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'VIERNES', startTime: '13:30', endTime: '14:30', subject: '', room: '', isBreak: false },
    ]
  },
  {
    name: 'Horario Base Tardes',
    type: 'NORMAL',
    color: '#8b5cf6',
    description: 'Horario estándar de tarde para ciclos formativos. De lunes a viernes de 15:30 a 21:00 con recreo de 17:00 a 17:30.',
    isTemplate: true,
    blocks: [
      // Lunes a Viernes: 15:30-21:00 con recreo 17:00-17:30
      ...['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'].flatMap(day => [
        { dayOfWeek: day, startTime: '15:30', endTime: '16:30', subject: '', room: '', isBreak: false },
        { dayOfWeek: day, startTime: '16:30', endTime: '17:00', subject: '', room: '', isBreak: false },
        { dayOfWeek: day, startTime: '17:00', endTime: '17:30', subject: 'Recreo', room: '', isBreak: true },
        { dayOfWeek: day, startTime: '17:30', endTime: '18:30', subject: '', room: '', isBreak: false },
        { dayOfWeek: day, startTime: '18:30', endTime: '19:30', subject: '', room: '', isBreak: false },
        { dayOfWeek: day, startTime: '19:30', endTime: '20:30', subject: '', room: '', isBreak: false },
        { dayOfWeek: day, startTime: '20:30', endTime: '21:00', subject: '', room: '', isBreak: false },
      ])
    ]
  },
  {
    name: 'Horario Guardia',
    type: 'GUARDIA',
    color: '#ef4444',
    description: 'Horario para guardias de profesores. Franjas de 1 hora distribuidas durante la semana.',
    isTemplate: true,
    blocks: [
      { dayOfWeek: 'LUNES', startTime: '08:00', endTime: '09:00', subject: 'Guardia', room: 'Hall', isBreak: false },
      { dayOfWeek: 'MARTES', startTime: '10:30', endTime: '11:30', subject: 'Guardia', room: 'Hall', isBreak: false },
      { dayOfWeek: 'MIERCOLES', startTime: '12:30', endTime: '13:30', subject: 'Guardia', room: 'Hall', isBreak: false },
      { dayOfWeek: 'JUEVES', startTime: '08:00', endTime: '09:00', subject: 'Guardia', room: 'Hall', isBreak: false },
      { dayOfWeek: 'VIERNES', startTime: '11:30', endTime: '12:30', subject: 'Guardia', room: 'Hall', isBreak: false },
    ]
  },
  {
    name: 'Horario Refuerzo',
    type: 'REFUERZO',
    color: '#10b981',
    description: 'Horario para clases de refuerzo. Sesiones de 2 horas los martes y jueves por la tarde.',
    isTemplate: true,
    blocks: [
      { dayOfWeek: 'MARTES', startTime: '16:00', endTime: '18:00', subject: '', room: '', isBreak: false },
      { dayOfWeek: 'JUEVES', startTime: '16:00', endTime: '18:00', subject: '', room: '', isBreak: false },
    ]
  }
]

// Horarios de profesores basados en las templates
export const profesorSchedules2025_2026 = [
  {
    // Profesor de Programación - Horario mañanas
    userEmail: 'profesor@example.com',
    name: 'Horario Curso 2025-26 - Programación',
    type: 'NORMAL',
    color: '#3b82f6',
    validFrom: '2025-09-01',
    validUntil: '2026-06-30',
    validationStatus: 'VALIDADO',
    basedOnTemplate: 'Horario Base Mañanas',
    blocks: [
      // Lunes
      { dayOfWeek: 'LUNES', startTime: '08:00', endTime: '09:00', subject: 'Programación (1ºDAM)', room: 'Aula 101', isBreak: false },
      { dayOfWeek: 'LUNES', startTime: '09:00', endTime: '10:00', subject: 'Programación (1ºDAM)', room: 'Aula 101', isBreak: false },
      { dayOfWeek: 'LUNES', startTime: '10:00', endTime: '10:30', subject: 'Recreo', room: '', isBreak: true },
      { dayOfWeek: 'LUNES', startTime: '10:30', endTime: '11:30', subject: 'Acceso a Datos (2ºDAM)', room: 'Aula 202', isBreak: false },
      { dayOfWeek: 'LUNES', startTime: '11:30', endTime: '12:30', subject: 'Acceso a Datos (2ºDAM)', room: 'Aula 202', isBreak: false },
      { dayOfWeek: 'LUNES', startTime: '12:30', endTime: '13:30', subject: 'Desarrollo Interfaces (2ºDAM)', room: 'Aula 203', isBreak: false },
      { dayOfWeek: 'LUNES', startTime: '13:30', endTime: '14:30', subject: 'Desarrollo Interfaces (2ºDAM)', room: 'Aula 203', isBreak: false },
      // Martes
      { dayOfWeek: 'MARTES', startTime: '08:00', endTime: '09:00', subject: 'Programación (1ºDAW)', room: 'Aula 102', isBreak: false },
      { dayOfWeek: 'MARTES', startTime: '09:00', endTime: '10:00', subject: 'Programación (1ºDAW)', room: 'Aula 102', isBreak: false },
      { dayOfWeek: 'MARTES', startTime: '10:00', endTime: '10:30', subject: 'Recreo', room: '', isBreak: true },
      { dayOfWeek: 'MARTES', startTime: '10:30', endTime: '11:30', subject: 'Programación (1ºDAM)', room: 'Aula 101', isBreak: false },
      { dayOfWeek: 'MARTES', startTime: '11:30', endTime: '12:30', subject: 'Programación (1ºDAM)', room: 'Aula 101', isBreak: false },
      { dayOfWeek: 'MARTES', startTime: '12:30', endTime: '13:30', subject: 'Tutoría', room: 'Despacho', isBreak: false },
      { dayOfWeek: 'MARTES', startTime: '13:30', endTime: '14:30', subject: 'Tutoría', room: 'Despacho', isBreak: false },
      // Miércoles
      { dayOfWeek: 'MIERCOLES', startTime: '08:00', endTime: '09:00', subject: 'Programación (1ºDAM)', room: 'Aula 101', isBreak: false },
      { dayOfWeek: 'MIERCOLES', startTime: '09:00', endTime: '10:00', subject: 'Programación (1ºDAM)', room: 'Aula 101', isBreak: false },
      { dayOfWeek: 'MIERCOLES', startTime: '10:00', endTime: '10:30', subject: 'Recreo', room: '', isBreak: true },
      { dayOfWeek: 'MIERCOLES', startTime: '10:30', endTime: '11:30', subject: 'Acceso a Datos (2ºDAM)', room: 'Aula 202', isBreak: false },
      { dayOfWeek: 'MIERCOLES', startTime: '11:30', endTime: '12:30', subject: 'Acceso a Datos (2ºDAM)', room: 'Aula 202', isBreak: false },
      { dayOfWeek: 'MIERCOLES', startTime: '12:30', endTime: '13:30', subject: 'Programación (1ºDAW)', room: 'Aula 102', isBreak: false },
      { dayOfWeek: 'MIERCOLES', startTime: '13:30', endTime: '14:30', subject: 'Programación (1ºDAW)', room: 'Aula 102', isBreak: false },
      // Jueves
      { dayOfWeek: 'JUEVES', startTime: '08:00', endTime: '09:00', subject: 'Desarrollo Interfaces (2ºDAM)', room: 'Aula 203', isBreak: false },
      { dayOfWeek: 'JUEVES', startTime: '09:00', endTime: '10:00', subject: 'Desarrollo Interfaces (2ºDAM)', room: 'Aula 203', isBreak: false },
      { dayOfWeek: 'JUEVES', startTime: '10:00', endTime: '10:30', subject: 'Recreo', room: '', isBreak: true },
      { dayOfWeek: 'JUEVES', startTime: '10:30', endTime: '11:30', subject: 'Programación (1ºDAM)', room: 'Aula 101', isBreak: false },
      { dayOfWeek: 'JUEVES', startTime: '11:30', endTime: '12:30', subject: 'Programación (1ºDAM)', room: 'Aula 101', isBreak: false },
      { dayOfWeek: 'JUEVES', startTime: '12:30', endTime: '13:30', subject: 'Reunión Departamento', room: 'Sala Reuniones', isBreak: false },
      { dayOfWeek: 'JUEVES', startTime: '13:30', endTime: '14:30', subject: 'Reunión Departamento', room: 'Sala Reuniones', isBreak: false },
      // Viernes
      { dayOfWeek: 'VIERNES', startTime: '08:00', endTime: '09:00', subject: 'Programación (1ºDAW)', room: 'Aula 102', isBreak: false },
      { dayOfWeek: 'VIERNES', startTime: '09:00', endTime: '10:00', subject: 'Programación (1ºDAW)', room: 'Aula 102', isBreak: false },
      { dayOfWeek: 'VIERNES', startTime: '10:00', endTime: '10:30', subject: 'Recreo', room: '', isBreak: true },
      { dayOfWeek: 'VIERNES', startTime: '10:30', endTime: '11:30', subject: 'Acceso a Datos (2ºDAM)', room: 'Aula 202', isBreak: false },
      { dayOfWeek: 'VIERNES', startTime: '11:30', endTime: '12:30', subject: 'Acceso a Datos (2ºDAM)', room: 'Aula 202', isBreak: false },
      { dayOfWeek: 'VIERNES', startTime: '12:30', endTime: '13:30', subject: 'Programación (1ºDAM)', room: 'Aula 101', isBreak: false },
      { dayOfWeek: 'VIERNES', startTime: '13:30', endTime: '14:30', subject: 'Programación (1ºDAM)', room: 'Aula 101', isBreak: false },
    ]
  },
  {
    // Profesor de Base de Datos - Horario mixto
    userEmail: 'experto@example.com',
    name: 'Horario Curso 2025-26 - Bases de Datos',
    type: 'NORMAL',
    color: '#8b5cf6',
    validFrom: '2025-09-01',
    validUntil: '2026-06-30',
    validationStatus: 'PENDIENTE',
    basedOnTemplate: 'Horario Base Mañanas',
    blocks: [
      // Lunes
      { dayOfWeek: 'LUNES', startTime: '08:00', endTime: '09:00', subject: 'Bases de Datos (1ºDAM)', room: 'Aula 201', isBreak: false },
      { dayOfWeek: 'LUNES', startTime: '09:00', endTime: '10:00', subject: 'Bases de Datos (1ºDAM)', room: 'Aula 201', isBreak: false },
      { dayOfWeek: 'LUNES', startTime: '10:00', endTime: '10:30', subject: 'Recreo', room: '', isBreak: true },
      { dayOfWeek: 'LUNES', startTime: '10:30', endTime: '11:30', subject: 'Sistemas Gestión (2ºDAM)', room: 'Aula 204', isBreak: false },
      { dayOfWeek: 'LUNES', startTime: '11:30', endTime: '12:30', subject: 'Sistemas Gestión (2ºDAM)', room: 'Aula 204', isBreak: false },
      { dayOfWeek: 'LUNES', startTime: '12:30', endTime: '13:30', subject: 'Bases de Datos (1ºDAW)', room: 'Aula 205', isBreak: false },
      { dayOfWeek: 'LUNES', startTime: '13:30', endTime: '14:30', subject: 'Bases de Datos (1ºDAW)', room: 'Aula 205', isBreak: false },
      // Martes
      { dayOfWeek: 'MARTES', startTime: '08:00', endTime: '09:00', subject: 'Bases de Datos (1ºDAW)', room: 'Aula 205', isBreak: false },
      { dayOfWeek: 'MARTES', startTime: '09:00', endTime: '10:00', subject: 'Bases de Datos (1ºDAW)', room: 'Aula 205', isBreak: false },
      { dayOfWeek: 'MARTES', startTime: '10:00', endTime: '10:30', subject: 'Recreo', room: '', isBreak: true },
      { dayOfWeek: 'MARTES', startTime: '10:30', endTime: '11:30', subject: 'Bases de Datos (1ºDAM)', room: 'Aula 201', isBreak: false },
      { dayOfWeek: 'MARTES', startTime: '11:30', endTime: '12:30', subject: 'Bases de Datos (1ºDAM)', room: 'Aula 201', isBreak: false },
      { dayOfWeek: 'MARTES', startTime: '12:30', endTime: '13:30', subject: 'Sistemas Gestión (2ºDAM)', room: 'Aula 204', isBreak: false },
      { dayOfWeek: 'MARTES', startTime: '13:30', endTime: '14:30', subject: 'Sistemas Gestión (2ºDAM)', room: 'Aula 204', isBreak: false },
      // Miércoles
      { dayOfWeek: 'MIERCOLES', startTime: '08:00', endTime: '09:00', subject: 'Sistemas Gestión (2ºDAM)', room: 'Aula 204', isBreak: false },
      { dayOfWeek: 'MIERCOLES', startTime: '09:00', endTime: '10:00', subject: 'Sistemas Gestión (2ºDAM)', room: 'Aula 204', isBreak: false },
      { dayOfWeek: 'MIERCOLES', startTime: '10:00', endTime: '10:30', subject: 'Recreo', room: '', isBreak: true },
      { dayOfWeek: 'MIERCOLES', startTime: '10:30', endTime: '11:30', subject: 'Bases de Datos (1ºDAW)', room: 'Aula 205', isBreak: false },
      { dayOfWeek: 'MIERCOLES', startTime: '11:30', endTime: '12:30', subject: 'Bases de Datos (1ºDAW)', room: 'Aula 205', isBreak: false },
      { dayOfWeek: 'MIERCOLES', startTime: '12:30', endTime: '13:30', subject: 'Bases de Datos (1ºDAM)', room: 'Aula 201', isBreak: false },
      { dayOfWeek: 'MIERCOLES', startTime: '13:30', endTime: '14:30', subject: 'Bases de Datos (1ºDAM)', room: 'Aula 201', isBreak: false },
      // Jueves
      { dayOfWeek: 'JUEVES', startTime: '08:00', endTime: '09:00', subject: 'Bases de Datos (1ºDAM)', room: 'Aula 201', isBreak: false },
      { dayOfWeek: 'JUEVES', startTime: '09:00', endTime: '10:00', subject: 'Bases de Datos (1ºDAM)', room: 'Aula 201', isBreak: false },
      { dayOfWeek: 'JUEVES', startTime: '10:00', endTime: '10:30', subject: 'Recreo', room: '', isBreak: true },
      { dayOfWeek: 'JUEVES', startTime: '10:30', endTime: '11:30', subject: 'Sistemas Gestión (2ºDAM)', room: 'Aula 204', isBreak: false },
      { dayOfWeek: 'JUEVES', startTime: '11:30', endTime: '12:30', subject: 'Sistemas Gestión (2ºDAM)', room: 'Aula 204', isBreak: false },
      { dayOfWeek: 'JUEVES', startTime: '12:30', endTime: '13:30', subject: 'Bases de Datos (1ºDAW)', room: 'Aula 205', isBreak: false },
      { dayOfWeek: 'JUEVES', startTime: '13:30', endTime: '14:30', subject: 'Bases de Datos (1ºDAW)', room: 'Aula 205', isBreak: false },
      // Viernes
      { dayOfWeek: 'VIERNES', startTime: '08:00', endTime: '09:00', subject: 'Bases de Datos (1ºDAM)', room: 'Aula 201', isBreak: false },
      { dayOfWeek: 'VIERNES', startTime: '09:00', endTime: '10:00', subject: 'Bases de Datos (1ºDAM)', room: 'Aula 201', isBreak: false },
      { dayOfWeek: 'VIERNES', startTime: '10:00', endTime: '10:30', subject: 'Recreo', room: '', isBreak: true },
      { dayOfWeek: 'VIERNES', startTime: '10:30', endTime: '11:30', subject: 'Bases de Datos (1ºDAW)', room: 'Aula 205', isBreak: false },
      { dayOfWeek: 'VIERNES', startTime: '11:30', endTime: '12:30', subject: 'Bases de Datos (1ºDAW)', room: 'Aula 205', isBreak: false },
      { dayOfWeek: 'VIERNES', startTime: '12:30', endTime: '13:30', subject: 'Sistemas Gestión (2ºDAM)', room: 'Aula 204', isBreak: false },
      { dayOfWeek: 'VIERNES', startTime: '13:30', endTime: '14:30', subject: 'Sistemas Gestión (2ºDAM)', room: 'Aula 204', isBreak: false },
    ]
  },
  {
    // Horario de guardia
    userEmail: 'profesor@example.com',
    name: 'Guardias Semanales',
    type: 'GUARDIA',
    color: '#ef4444',
    validFrom: '2025-09-01',
    validUntil: '2026-06-30',
    validationStatus: 'VALIDADO',
    basedOnTemplate: 'Horario Guardia',
    blocks: [
      { dayOfWeek: 'LUNES', startTime: '08:00', endTime: '09:00', subject: 'Guardia', room: 'Hall Principal', isBreak: false },
      { dayOfWeek: 'MIERCOLES', startTime: '12:30', endTime: '13:30', subject: 'Guardia', room: 'Hall Principal', isBreak: false },
      { dayOfWeek: 'VIERNES', startTime: '11:30', endTime: '12:30', subject: 'Guardia', room: 'Hall Principal', isBreak: false },
    ]
  },
  {
    // Horario de refuerzo
    userEmail: 'experto@example.com',
    name: 'Refuerzo Programación',
    type: 'REFUERZO',
    color: '#10b981',
    validFrom: '2025-09-01',
    validUntil: '2026-06-30',
    validationStatus: 'BORRADOR',
    basedOnTemplate: 'Horario Refuerzo',
    blocks: [
      { dayOfWeek: 'MARTES', startTime: '16:00', endTime: '18:00', subject: 'Refuerzo Programación (1ºDAM)', room: 'Aula 101', isBreak: false },
      { dayOfWeek: 'JUEVES', startTime: '16:00', endTime: '18:00', subject: 'Refuerzo Programación (1ºDAM)', room: 'Aula 101', isBreak: false },
    ]
  }
]
