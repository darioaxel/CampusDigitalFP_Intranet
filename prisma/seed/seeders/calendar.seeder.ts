import { Calendar, User, Role, PrismaClient } from '@prisma/client'
import { CalendarData, CalendarEventData } from '../data/calendars.js'

export class CalendarSeeder {
  private adminUser: User | null = null

  constructor(private prisma: PrismaClient) {}

  async run(calendars: CalendarData[]): Promise<Calendar[]> {
    console.log('📅 Seed de calendarios...\n')

    // Buscar un usuario ADMIN o ROOT para asignar como creador
    this.adminUser = await this.prisma.user.findFirst({
      where: {
        role: {
          in: [Role.ADMIN, Role.ROOT]
        }
      }
    })

    if (!this.adminUser) {
      console.warn('⚠️  No se encontró usuario ADMIN/ROOT. Saltando calendarios...')
      return []
    }

    const createdCalendars: Calendar[] = []

    for (const cal of calendars) {
      const existing = await this.prisma.calendar.findFirst({
        where: {
          name: cal.name,
          academicYear: cal.academicYear
        }
      })

      if (existing) {
        console.log(`✔  Ya existe: ${cal.name}`)
        createdCalendars.push(existing)
        continue
      }

      // Crear calendario con sus eventos
      const calendar = await this.prisma.calendar.create({
        data: {
          name: cal.name,
          description: cal.description,
          type: cal.type,
          academicYear: cal.academicYear,
          startDate: new Date(cal.startDate),
          endDate: new Date(cal.endDate),
          isActive: true,
          isPublic: cal.isPublic ?? true,
          allowDragDrop: cal.allowDragDrop ?? false,
          maxEventsPerUser: cal.maxEventsPerUser ?? null,
          createdById: this.adminUser.id,
          events: {
            create: cal.events.map((evt: CalendarEventData) => ({
              title: evt.title,
              description: evt.description,
              type: evt.type,
              startDate: new Date(evt.startDate),
              endDate: evt.endDate ? new Date(evt.endDate) : null,
              isAllDay: evt.isAllDay ?? true,
              color: evt.color,
              maxAssignments: evt.maxAssignments ?? null,
              isActive: true,
              createdById: this.adminUser!.id,
            }))
          }
        },
        include: {
          events: true
        }
      })

      console.log(`✔  Creado: ${calendar.name} (${calendar.events.length} eventos)`)
      createdCalendars.push(calendar)
    }

    console.log('')
    return createdCalendars
  }
}
