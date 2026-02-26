import { prisma } from './config.js'
import { rawUsers } from './data/users.js'
import { UserSeeder } from './seeders/user.seeder.js'
import { CalendarSeeder } from './seeders/calendar.seeder.js'
import { allCalendars } from './data/calendars.js'
import { seedWorkflows } from './seeders/workflow.seeder.js'
// Los siguientes imports están comentados temporalmente para pruebas del workflow NEW_USER
// import { ScheduleSeeder } from './seeders/schedules.seeder.js'
// import { seedStudies } from './seeders/studies.seeder.js'
// import { seedSchedules2025_2026 } from './seeders/schedules-2025-2026.seeder.js'
// import { seedFreeDispositionCalendar } from './seeders/calendars-free-disposition.seeder.js'
// import { seedTasks } from './seeders/task.seeder.js'
// import { seedRequests } from './seeders/request.seeder.js'


async function main() {
  console.log('🌱 Iniciando seed...\n')

  try {
     // Limpieza en orden correcto (respetando FKs)
    console.log('🗑️  Limpiando base de datos...')
    
    // Limpiar tablas de estudios (orden: hijas primero)
    await prisma.contenidoTema.deleteMany()
    await prisma.recursoTema.deleteMany()
    await prisma.criterioEvaluacion.deleteMany()
    await prisma.tema.deleteMany() // La relación m:m con RA se borra automáticamente
    await prisma.resultadoAprendizaje.deleteMany()
    await prisma.moduloProfesional.deleteMany()
    await prisma.cicloFormativo.deleteMany()
    
    // Limpiar primero las tablas hijas (con FKs) - orden importante
    await prisma.activityLog.deleteMany()
    await prisma.stateHistory.deleteMany()
    await prisma.vote.deleteMany()
    await prisma.taskAssignment.deleteMany()
    await prisma.requestDocument.deleteMany()
    await prisma.task.deleteMany()
    await prisma.request.deleteMany()
    await prisma.workflowNotification.deleteMany()
    await prisma.workflowTransition.deleteMany()
    await prisma.workflowState.deleteMany()
    await prisma.workflowDefinition.deleteMany()
    await prisma.userCalendarEvent.deleteMany()
    await prisma.calendarEvent.deleteMany()
    await prisma.calendar.deleteMany()
    await prisma.scheduleBlock.deleteMany()
    await prisma.schedule.deleteMany()

    // ========================================
    // DATOS ESENCIALES PARA PRUEBAS
    // ========================================
    
    // 1. Usuarios (mínimo necesario: un admin para aprobar solicitudes)
    const userSeeder = new UserSeeder(prisma)
    const createdUsers = await userSeeder.run(rawUsers)

    // 2. Calendarios escolares (template y libre disposición)
    const calendarSeeder = new CalendarSeeder(prisma)
    await calendarSeeder.run(allCalendars)

    // 3. Workflows configurables (incluye el workflow de NEW_USER)
    await seedWorkflows(prisma)

    // ========================================
    // DATOS NO ESENCIALES (comentados para pruebas del workflow NEW_USER)
    // ========================================
    
    // Horarios de profesores (no necesarios para probar solicitudes de usuario)
    // const scheduleSeeder = new ScheduleSeeder(prisma)
    // await scheduleSeeder.run(createdUsers)
    // await seedSchedules2025_2026()
    
    // Estudios FP (no necesarios para probar solicitudes de usuario)
    // await seedStudies()
    
    // Tareas de ejemplo (no necesarias para probar solicitudes de usuario)
    // await seedTasks(prisma, createdUsers)
    
    // Solicitudes de ejemplo (no necesarias - creamos manualmente desde el formulario)
    // await seedRequests(prisma, createdUsers)

    console.log('\n✨ Seed completado exitosamente')
  } catch (error) {
    console.error('\n❌ Error en seed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
