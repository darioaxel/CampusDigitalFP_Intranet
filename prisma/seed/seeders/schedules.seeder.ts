import { PrismaClient, User, Role, ScheduleType } from '@prisma/client'
import { scheduleTemplates, teacherExtraTemplates, ScheduleTemplate } from '../data/schedules.js'

export class ScheduleSeeder {
  constructor(private prisma: PrismaClient) {}

  async run(users: User[]): Promise<void> {
    console.log(`\n📅 Generando horarios para ${users.length} usuarios...`)

    // Separar usuarios por rol
    const teachers = users.filter(u => 
      [Role.TEACHER, Role.HEAD, Role.ADMIN, Role.ROOT].includes(u.role)
    )
    const students = users.filter(u => u.role === Role.STUDENT)
    const others = users.filter(u => 
      ![Role.TEACHER, Role.HEAD, Role.ADMIN, Role.ROOT, Role.STUDENT].includes(u.role)
    )

    // 1. Todos los usuarios tienen al menos 1 horario base
    for (const user of users) {
      const template = this.getRandomTemplate(scheduleTemplates)
      await this.createSchedule(user.id, template)
    }
    console.log(`  ✓ Horarios base: ${users.length} usuarios`)

    // 2. Profesores tienen mínimo 2 horarios (segundo obligatorio)
    for (const teacher of teachers) {
      const template = this.getRandomTemplate(
        scheduleTemplates.filter(t => t.name !== this.getUserFirstScheduleName(teacher.id))
      )
      await this.createSchedule(teacher.id, template)
    }
    console.log(`  ✓ Segundos horarios: ${teachers.length} profesores`)

    // 3. 50% de profesores tienen un tercer horario (tutorías/coordinación)
    const teachersWithExtra = this.shuffleArray(teachers).slice(0, Math.ceil(teachers.length * 0.5))
    for (const teacher of teachersWithExtra) {
      const template = this.getRandomTemplate(teacherExtraTemplates)
      await this.createSchedule(teacher.id, template)
    }
    console.log(`  ✓ Horarios extra: ${teachersWithExtra.length} profesores`)

    // 4. 30% de estudiantes tienen horario de exámenes
    const studentsWithExams = this.shuffleArray(students).slice(0, Math.ceil(students.length * 0.3))
    const examTemplate = scheduleTemplates.find(t => t.type === ScheduleType.EXAMENES)!
    for (const student of studentsWithExams) {
      await this.createSchedule(student.id, examTemplate)
    }
    console.log(`  ✓ Horarios exámenes: ${studentsWithExams.length} estudiantes`)

    console.log('✅ Horarios completados')
  }

  private async createSchedule(userId: string, template: ScheduleTemplate): Promise<void> {
    await this.prisma.schedule.create({
      data: {
        name: template.name,
        type: template.type,
        color: template.color,
        isActive: true,
        userId: userId,
        blocks: {
          create: template.blocks.map(block => ({
            dayOfWeek: block.dayOfWeek,
            startTime: block.startTime,
            endTime: block.endTime,
            subject: block.subject,
            room: block.room,
            isBreak: block.isBreak || false
          }))
        }
      }
    })
  }

  // Helper para evitar duplicados (simplificado - en producción verificaría la DB)
  private userSchedules: Map<string, string[]> = new Map()
  
  private getUserFirstScheduleName(userId: string): string {
    return this.userSchedules.get(userId)?.[0] || ''
  }

  private getRandomTemplate(templates: ScheduleTemplate[]): ScheduleTemplate {
    return templates[Math.floor(Math.random() * templates.length)]
  }

  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }
}