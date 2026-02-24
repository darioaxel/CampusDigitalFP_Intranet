import { prisma } from '../config.js'
import { freeDispositionCalendar2025_2026 } from '../data/calendars-free-disposition.js'

export async function seedFreeDispositionCalendar() {
  console.log('🗓️  Seedings calendario de libre disposición...')

  try {
    // Buscar admin
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    })

    if (!admin) {
      console.warn('⚠️ No se encontró usuario ADMIN')
      return
    }

    // Verificar si ya existe
    const existing = await prisma.calendar.findFirst({
      where: {
        name: freeDispositionCalendar2025_2026.name,
        academicYear: freeDispositionCalendar2025_2026.academicYear
      }
    })

    if (existing) {
      console.log('  ⏭️ Calendario de libre disposición ya existe')
      return
    }

    // Crear calendario con eventos
    const calendar = await prisma.calendar.create({
      data: {
        name: freeDispositionCalendar2025_2026.name,
        type: freeDispositionCalendar2025_2026.type,
        academicYear: freeDispositionCalendar2025_2026.academicYear,
        description: freeDispositionCalendar2025_2026.description,
        allowDragDrop: freeDispositionCalendar2025_2026.allowDragDrop,
        maxEventsPerUser: freeDispositionCalendar2025_2026.maxEventsPerUser,
        startDate: new Date(freeDispositionCalendar2025_2026.validFrom),
        endDate: new Date(freeDispositionCalendar2025_2026.validUntil),
        isActive: true,
        isPublic: true,
        createdById: admin.id,
        events: {
          create: freeDispositionCalendar2025_2026.events.map(event => ({
            title: event.title,
            description: event.description,
            type: event.type,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
            isAllDay: event.isAllDay,
            isActive: event.isActive,
            maxAssignments: event.maxAssignments,
            createdById: admin.id
          }))
        }
      }
    })

    console.log(`  ✅ Calendario creado: ${calendar.name}`)
    console.log(`     ${freeDispositionCalendar2025_2026.events.length} días disponibles`)

  } catch (error) {
    console.error('❌ Error seedeando calendario de libre disposición:', error)
    throw error
  }
}
