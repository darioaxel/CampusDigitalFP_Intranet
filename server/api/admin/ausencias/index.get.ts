// server/api/admin/ausencias/index.get.ts
// Obtener todas las ausencias (bajas validadas + días libres aprobados) para el calendario

import { prisma } from '../../../utils/db'

export interface Absence {
  id: string
  type: 'SICK_LEAVE' | 'FREE_DAY'
  typeLabel: string
  userId: string
  firstName: string
  lastName: string
  email: string
  date: string // YYYY-MM-DD
  description?: string
  subType?: string // Para bajas (BAJA_MEDICA, etc.)
}

export default defineEventHandler(async (event) => {
  // Verificar sesión y permisos
  const session = await requireUserSession(event)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any
  
  if (!user.role || !['ADMIN', 'ROOT'].includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: 'No tienes permisos para acceder a esta información'
    })
  }

  // Obtener parámetros de fecha (por defecto año académico actual)
  const query = getQuery(event)
  const now = new Date()
  const currentYear = now.getFullYear()
  const academicYearStart = now.getMonth() >= 8 ? currentYear : currentYear - 1
  const academicYearEnd = academicYearStart + 1

  const startDate = query.startDate 
    ? new Date(query.startDate as string)
    : new Date(academicYearStart, 8, 1) // 1 de septiembre
  
  const endDate = query.endDate
    ? new Date(query.endDate as string)
    : new Date(academicYearEnd, 6, 31) // 31 de julio

  // Obtener workflows
  const [sickLeaveWorkflow, freeDayWorkflow] = await Promise.all([
    prisma.workflowDefinition.findUnique({
      where: { code: 'request_sick_leave' },
      include: { states: true }
    }),
    prisma.workflowDefinition.findUnique({
      where: { code: 'request_free_day' },
      include: { states: true }
    })
  ])

  const absences: Absence[] = []

  // 1. Obtener bajas validadas
  if (sickLeaveWorkflow) {
    const validatedState = sickLeaveWorkflow.states.find(s => s.code === 'validated')
    
    if (validatedState) {
      const sickLeaveRequests = await prisma.request.findMany({
        where: {
          workflowId: sickLeaveWorkflow.id,
          currentStateId: validatedState.id,
          OR: [
            // Solicitudes que intersectan con el rango de fechas
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate }
            },
            // O solicitudes con requestedDate en el rango
            {
              requestedDate: {
                gte: startDate,
                lte: endDate
              }
            }
          ]
        },
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      for (const request of sickLeaveRequests) {
        // Parsear contexto para obtener tipo de baja y fechas específicas
        let context: any = {}
        try {
          if (request.context) {
            context = JSON.parse(request.context)
          }
        } catch {
          context = {}
        }

        // Determinar fechas de ausencia
        let absenceDates: string[] = []
        
        if (context.dates && Array.isArray(context.dates) && context.dates.length > 0) {
          // Usar fechas del contexto
          absenceDates = context.dates.filter((d: string) => {
            const date = new Date(d)
            return date >= startDate && date <= endDate
          })
        } else if (request.startDate && request.endDate) {
          // Generar fechas desde el rango startDate-endDate
          const current = new Date(request.startDate)
          const end = new Date(request.endDate)
          
          while (current <= end) {
            if (current >= startDate && current <= endDate) {
              absenceDates.push(current.toISOString().split('T')[0])
            }
            current.setDate(current.getDate() + 1)
          }
        } else if (request.requestedDate) {
          const dateStr = request.requestedDate.toISOString().split('T')[0]
          absenceDates = [dateStr]
        }

        // Crear entrada de ausencia por cada fecha
        for (const date of absenceDates) {
          absences.push({
            id: `${request.id}_${date}`,
            type: 'SICK_LEAVE',
            typeLabel: getSickLeaveTypeLabel(context.subType),
            userId: request.requester.id,
            firstName: request.requester.firstName,
            lastName: request.requester.lastName,
            email: request.requester.email,
            date,
            description: request.description || undefined,
            subType: context.subType
          })
        }
      }
    }
  }

  // 2. Obtener días libres aprobados
  if (freeDayWorkflow) {
    const approvedState = freeDayWorkflow.states.find(s => s.code === 'approved')
    
    if (approvedState) {
      const freeDayRequests = await prisma.request.findMany({
        where: {
          workflowId: freeDayWorkflow.id,
          currentStateId: approvedState.id,
          requestedDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      for (const request of freeDayRequests) {
        if (request.requestedDate) {
          const dateStr = request.requestedDate.toISOString().split('T')[0]
          
          absences.push({
            id: request.id,
            type: 'FREE_DAY',
            typeLabel: 'Día Libre Disposición',
            userId: request.requester.id,
            firstName: request.requester.firstName,
            lastName: request.requester.lastName,
            email: request.requester.email,
            date: dateStr,
            description: request.description || undefined
          })
        }
      }
    }
  }

  // Agrupar por fecha para facilitar el consumo
  const absencesByDate = new Map<string, Absence[]>()
  
  for (const absence of absences) {
    const existing = absencesByDate.get(absence.date) || []
    existing.push(absence)
    absencesByDate.set(absence.date, existing)
  }

  // Convertir a objeto para JSON
  const groupedAbsences: Record<string, Absence[]> = {}
  for (const [date, dateAbsences] of absencesByDate) {
    groupedAbsences[date] = dateAbsences
  }

  return {
    success: true,
    data: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalAbsences: absences.length,
      absencesByDate: groupedAbsences,
      allAbsences: absences
    }
  }
})

// Helper para obtener etiqueta del tipo de baja
function getSickLeaveTypeLabel(subType?: string): string {
  const labels: Record<string, string> = {
    'BAJA_MEDICA': 'Baja Médica',
    'BAJA_MATERNIDAD': 'Baja Maternidad/Paternidad',
    'BAJA_RIESGO_EMBARAZO': 'Baja Riesgo Embarazo',
    'BAJA_ACCIDENTE_TRABAJO': 'Accidente Trabajo',
    'PERMISO_FUERZA_MAYOR': 'Permiso Fuerza Mayor',
    'OTRA': 'Baja (Otra)'
  }
  return labels[subType || ''] || 'Baja'
}
