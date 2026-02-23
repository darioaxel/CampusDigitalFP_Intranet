import { prisma } from './config.js'
import { rawUsers } from './data/users.js'
import { UserSeeder } from './seeders/user.seeder.js'
import { ScheduleSeeder } from './seeders/schedules.seeder.js'


async function main() {
  console.log('🌱 Iniciando seed...\n')

  try {
     // Limpieza en orden correcto (respetando FKs)
    console.log('🗑️  Limpiando base de datos...')
    await prisma.scheduleBlock.deleteMany()
    await prisma.schedule.deleteMany()
    
    // 1. Usuarios 
    const userSeeder = new UserSeeder(prisma)  
    const createdUsers = await userSeeder.run(rawUsers)   
    
     // 2. Horarios (asigna a todos, mínimo 1, profesores mínimo 2)
    const scheduleSeeder = new ScheduleSeeder(prisma)
    await scheduleSeeder.run(createdUsers)


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