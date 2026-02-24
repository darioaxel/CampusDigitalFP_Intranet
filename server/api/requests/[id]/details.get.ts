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
        }
      }
    })

    if (!request) {
      throw createError({ statusCode: 404, message: 'Solicitud no encontrada' })
    }

    // Contar solicitudes del profesor
    const teacherStats = await prisma.request.groupBy({
      by: ['status'],
      where: {
        requesterId: request.requesterId,
        type: 'FREE_DAY'
      },
      _count: {
        id: true
      }
    })

    const approvedByTeacher = teacherStats.find(s => s.status === 'APPROVED')?._count.id || 0
    const pendingByTeacher = teacherStats.find(s => s.status === 'PENDING')?._count.id || 0

    // Contar profesores que tienen aprobado el mismo día
    const sameDayApproved = await prisma.request.count({
      where: {
        type: 'FREE_DAY',
        status: 'APPROVED',
        requestedDate: request.requestedDate
      }
    })

    // Listar profesores con solicitudes aprobadas para ese día
    const sameDayTeachers = await prisma.request.findMany({
      where: {
        type: 'FREE_DAY',
        status: 'APPROVED',
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
          status: request.status,
          requestedDate: request.requestedDate?.toISOString().split('T')[0],
          createdAt: request.createdAt,
          adminNotes: request.adminNotes
        },
        teacher: {
          id: request.requester.id,
          name: `${request.requester.firstName} ${request.requester.lastName}`,
          email: request.requester.email,
          stats: {
            approved: approvedByTeacher,
            pending: pendingByTeacher,
            total: approvedByTeacher + pendingByTeacher
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
