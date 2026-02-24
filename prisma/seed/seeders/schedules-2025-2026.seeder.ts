import { prisma } from '../config.js'
import { scheduleTemplates2025_2026, profesorSchedules2025_2026 } from '../data/schedules-2025-2026.js'

export async function seedSchedules2025_2026() {
  console.log('🌱 Seedings horarios 2025-2026...')

  try {
    // 1. Crear Templates de horario
    console.log('📋 Creando templates de horario...')
    const createdTemplates: Record<string, string> = {} // Map nombre -> id

    for (const templateData of scheduleTemplates2025_2026) {
      // Buscar admin para asignar como creador
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true }
      })

      if (!admin) {
        console.warn('⚠️ No se encontró usuario ADMIN para crear templates')
        continue
      }

      // Verificar si ya existe template con ese nombre
      const existing = await prisma.schedule.findFirst({
        where: {
          name: templateData.name,
          isTemplate: true
        }
      })

      if (existing) {
        console.log(`  ⏭️ Template "${templateData.name}" ya existe`)
        createdTemplates[templateData.name] = existing.id
        continue
      }

      // Crear template con sus bloques
      const template = await prisma.schedule.create({
        data: {
          name: templateData.name,
          type: templateData.type,
          description: templateData.description,
          color: templateData.color,
          isTemplate: true,
          isActive: true,
          userId: admin.id,
          validFrom: null,
          validUntil: null,
          validationStatus: 'VALIDADO', // Los templates siempre están validados
          blocks: {
            create: templateData.blocks.map(block => ({
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

      createdTemplates[templateData.name] = template.id
      console.log(`  ✅ Template creado: ${templateData.name} (${templateData.blocks.length} bloques)`)
    }

    // 2. Crear horarios de profesores
    console.log('👨‍🏫 Creando horarios de profesores...')

    for (const scheduleData of profesorSchedules2025_2026) {
      // Buscar usuario por email
      const user = await prisma.user.findUnique({
        where: { email: scheduleData.userEmail },
        select: { id: true }
      })

      if (!user) {
        console.warn(`⚠️ Usuario con email ${scheduleData.userEmail} no encontrado`)
        continue
      }

      // Verificar si ya existe un horario con ese nombre para ese usuario
      const existing = await prisma.schedule.findFirst({
        where: {
          name: scheduleData.name,
          userId: user.id
        }
      })

      if (existing) {
        console.log(`  ⏭️ Horario "${scheduleData.name}" ya existe para ${scheduleData.userEmail}`)
        continue
      }

      // Crear horario con sus bloques
      const schedule = await prisma.schedule.create({
        data: {
          name: scheduleData.name,
          type: scheduleData.type,
          color: scheduleData.color,
          isTemplate: false,
          isActive: true,
          userId: user.id,
          validFrom: scheduleData.validFrom ? new Date(scheduleData.validFrom) : null,
          validUntil: scheduleData.validUntil ? new Date(scheduleData.validUntil) : null,
          validationStatus: scheduleData.validationStatus,
          blocks: {
            create: scheduleData.blocks.map(block => ({
              dayOfWeek: block.dayOfWeek,
              startTime: block.startTime,
              endTime: block.endTime,
              subject: block.subject,
              room: block.room,
              isBreak: block.isBreak
            }))
          }
        },
        include: {
          blocks: true
        }
      })

      console.log(`  ✅ Horario creado: ${scheduleData.name} (${schedule.blocks.length} bloques) - ${scheduleData.validationStatus}`)
    }

    console.log('✅ Horarios 2025-2026 seedeados correctamente')
  } catch (error) {
    console.error('❌ Error seedeando horarios 2025-2026:', error)
    throw error
  }
}
