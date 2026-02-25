// GET /api/requests/[id]/details - Obtener detalles de solicitud para aprobación
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session?.user?.id) {
      throw createError({ statusCode: 401, message: 'No autenticado' })
    }

    const requestId = getRouterParam(event, 'id')
    if (!requestId) {
      throw createError({ statusCode: 400, message: 'ID requerido' })
    }

    // Verificar que es admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!['ADMIN', 'ROOT'].includes(user?.role || '')) {
      throw createError({ statusCode: 403, message: 'No autorizado' })
    }

    // Obtener el workflow de días libres
    const freeDayWorkflow = await prisma.workflowDefinition.findUnique({
      where: { code: 'request_free_day' },
      include: { states: true }
    })

    if (!freeDayWorkflow) {
      throw createError({ statusCode: 500, message: 'Workflow no configurado' })
    }

    const approvedState = freeDayWorkflow.states.find(s => s.code === 'approved')
    const pendingState = freeDayWorkflow.states.find(s => s.code === 'pending')

    // Obtener solicitud
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        currentState: true
      }
    })

    if (!request) {
      throw createError({ statusCode: 404, message: 'Solicitud no encontrada' })
    }

    // Contar solicitudes del profesor
    const teacherApproved = await prisma.request.count({
      where: {
        requesterId: request.requesterId,
        workflowId: freeDayWorkflow.id,
        currentStateId: approvedState?.id
      }
    })

    const teacherPending = await prisma.request.count({
      where: {
        requesterId: request.requesterId,
        workflowId: freeDayWorkflow.id,
        currentStateId: pendingState?.id
      }
    })

    // Contar profesores que tienen aprobado el mismo día
    const sameDayApproved = await prisma.request.count({
      where: {
        workflowId: freeDayWorkflow.id,
        currentStateId: approvedState?.id,
        requestedDate: request.requestedDate
      }
    })

    // Listar profesores con solicitudes aprobadas para ese día
    const sameDayTeachers = await prisma.request.findMany({
      where: {
        workflowId: freeDayWorkflow.id,
        currentStateId: approvedState?.id,
        requestedDate: request.requestedDate,
        requesterId: { not: request.requesterId }
      },
      include: {
        requester: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return {
      success: true,
      data: {
        request: {
          id: request.id,
          title: request.title,
          description: request.description,
          status: request.currentState?.name || 'Desconocido',
          statusCode: request.currentState?.code || 'unknown',
          requestedDate: request.requestedDate?.toISOString().split('T')[0],
          createdAt: request.createdAt,
          adminNotes: request.adminNotes
        },
        teacher: {
          id: request.requester.id,
          name: `${request.requester.firstName} ${request.requester.lastName}`,
          email: request.requester.email,
          stats: {
            approved: teacherApproved,
            pending: teacherPending,
            total: teacherApproved + teacherPending
          }
        },
        sameDay: {
          approvedCount: sameDayApproved,
          teachers: sameDayTeachers.map(r => ({
            name: `${r.requester.firstName} ${r.requester.lastName}`
          }))
        }
      }
    }
  } catch (error: any) {
    console.error('Error fetching request details:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error al cargar los detalles'
    })
  }
})
