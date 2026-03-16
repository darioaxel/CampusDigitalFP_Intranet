// Script de prueba para el flujo de rollover de horarios
import { prisma } from './config.js'

async function testRollover() {
  console.log('🧪 Probando flujo de rollover de horarios...\n')

  try {
    // 1. Verificar estado inicial
    console.log('1️⃣ Estado inicial:')
    const courses = await prisma.academicYear.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { schedules: true } }
      }
    })
    
    for (const course of courses) {
      console.log(`   📚 ${course.name}: ${course._count.schedules} horarios (${course.isActive ? 'Activo' : course.isClosed ? 'Cerrado' : 'Inactivo'})`)
    }

    // 2. Cerrar curso 2025-2026
    console.log('\n2️⃣ Cerrando curso 2025-2026...')
    await prisma.academicYear.update({
      where: { name: '2025-2026' },
      data: { isClosed: true, isActive: false }
    })
    console.log('   ✅ Curso 2025-2026 cerrado')

    // 3. Activar curso 2026-2027
    console.log('\n3️⃣ Activando curso 2026-2027...')
    await prisma.academicYear.update({
      where: { name: '2026-2027' },
      data: { isActive: true }
    })
    console.log('   ✅ Curso 2026-2027 activado')

    // 4. Ejecutar rollover de horarios
    console.log('\n4️⃣ Ejecutando rollover de horarios...')
    
    const sourceYear = await prisma.academicYear.findUnique({
      where: { name: '2025-2026' },
      include: { 
        schedules: {
          where: { isTemplate: false },
          include: { blocks: true }
        }
      }
    })
    
    const targetYear = await prisma.academicYear.findUnique({
      where: { name: '2026-2027' }
    })

    if (!sourceYear || !targetYear) {
      throw new Error('Cursos no encontrados')
    }

    console.log(`   📊 Horarios a copiar: ${sourceYear.schedules.length}`)

    // Copiar horarios en transacción
    const results = await prisma.$transaction(async (tx) => {
      const created = []

      for (const schedule of sourceYear.schedules) {
        // Desactivar horario antiguo
        await tx.schedule.update({
          where: { id: schedule.id },
          data: { isActive: false }
        })

        // Crear copia en nuevo curso
        const newSchedule = await tx.schedule.create({
          data: {
            name: schedule.name,
            type: schedule.type,
            description: `${schedule.description || ''} (Copiado desde ${sourceYear.name})`,
            color: schedule.color,
            isTemplate: false,
            isActive: true,
            userId: schedule.userId,
            academicYearId: targetYear.id,
            parentScheduleId: schedule.id,
            validationStatus: 'BORRADOR',
            blocks: {
              create: schedule.blocks.map(block => ({
                dayOfWeek: block.dayOfWeek,
                startTime: block.startTime,
                endTime: block.endTime,
                subject: block.subject,
                room: block.room,
                isBreak: block.isBreak
              }))
            }
          }
        })

        created.push({
          oldId: schedule.id,
          newId: newSchedule.id,
          name: newSchedule.name
        })
      }

      return created
    })

    console.log(`   ✅ ${results.length} horarios copiados correctamente`)

    // 5. Verificar estado final
    console.log('\n5️⃣ Estado final:')
    const finalCourses = await prisma.academicYear.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { schedules: true } },
        schedules: {
          where: { isTemplate: false },
          select: { name: true, validationStatus: true, isActive: true }
        }
      }
    })
    
    for (const course of finalCourses) {
      console.log(`\n   📚 ${course.name} (${course.isActive ? 'Activo' : course.isClosed ? 'Cerrado' : 'Inactivo'})`)
      console.log(`      Total horarios: ${course._count.schedules}`)
      for (const schedule of course.schedules.slice(0, 3)) {
        console.log(`      - ${schedule.name} [${schedule.validationStatus}] ${schedule.isActive ? '' : '(Inactivo)'}`)
      }
      if (course.schedules.length > 3) {
        console.log(`      ... y ${course.schedules.length - 3} más`)
      }
    }

    console.log('\n✨ Flujo de rollover completado exitosamente!')
    console.log('\n📋 Resumen:')
    console.log('   • Curso 2025-2026: Cerrado, horarios desactivados')
    console.log('   • Curso 2026-2027: Activado, horarios copiados en estado BORRADOR')
    console.log('   • Los profesores pueden ahora modificar sus horarios para el nuevo curso')

  } catch (error) {
    console.error('\n❌ Error en el flujo de rollover:', error)
    throw error
  }
}

testRollover()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
