import { prisma } from './config.js'
import { rawUsers } from './data/users.js'
import { UserSeeder } from './seeders/user.seeder.js'
import { ScheduleSeeder } from './seeders/schedules.seeder.js'
import { CalendarSeeder } from './seeders/calendar.seeder.js'
import { allCalendars } from './data/calendars.js'
import { seedStudies } from './seeders/studies.seeder.js'
import { seedSchedules2025_2026 } from './seeders/schedules-2025-2026.seeder.js'
import { seedFreeDispositionCalendar } from './seeders/calendars-free-disposition.seeder.js'
import { seedWorkflows } from './seeders/workflow.seeder.js'
import { seedTasks } from './seeders/task.seeder.js'
import { seedRequests } from './seeders/request.seeder.js'


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
    
    // Limpiar primero las tablas hijas (con FKs)
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

    // 1. Usuarios
    const userSeeder = new UserSeeder(prisma)
    const createdUsers = await userSeeder.run(rawUsers)

     // 2. Horarios (asigna a todos, mínimo 1, profesores mínimo 2)
    const scheduleSeeder = new ScheduleSeeder(prisma)
    await scheduleSeeder.run(createdUsers)

    // 3. Calendarios escolares
    const calendarSeeder = new CalendarSeeder(prisma)
    await calendarSeeder.run(allCalendars)

    // 4. Estudios FP (Ciclos, Módulos, RAs, CEs, Temas)
    await seedStudies()

    // 5. Horarios específicos 2025-2026 (templates y horarios de profesores)
    await seedSchedules2025_2026()

    // 6. Calendario de libre disposición
    await seedFreeDispositionCalendar()

    // 7. Workflows configurables
    await seedWorkflows(prisma)

    // 8. Tareas de ejemplo (usando workflows configurables)
    await seedTasks(prisma, createdUsers)

    // 9. Solicitudes de ejemplo (usando workflows configurables)
    await seedRequests(prisma, createdUsers)

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
