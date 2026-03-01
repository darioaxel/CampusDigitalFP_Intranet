// server/api/user/workflow-items.get.ts
// Obtiene solicitudes y tareas relacionadas con el usuario actual
import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any
  
  const userId = user.id as string
  const userRole = user.role as string
  const isAdmin = ['ADMIN', 'ROOT'].includes(userRole)

  try {
    console.log(`[workflow-items] Buscando items para usuario: ${userId}, rol: ${userRole}`)

    // Solicitudes creadas por el usuario
    const myRequests = await prisma.request.findMany({
      where: { requesterId: userId },
      include: {
        requester: {
          select: { firstName: true, lastName: true, email: true },
        },
        admin: {
          select: { firstName: true, lastName: true },
        },
        currentState: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    console.log(`[workflow-items] Solicitudes creadas por usuario: ${myRequests.length}`)

    // Solicitudes pendientes de gestionar (para admin)
    // Incluye solicitudes públicas (NEW_USER) donde el requester es el admin placeholder
    const pendingRequests = isAdmin
      ? await prisma.request.findMany({
          where: {
            currentState: {
              isFinal: false,
              isTerminal: false
            },
            OR: [
              { requesterId: { not: userId } }, // Excluir las propias del admin
              { 
                // Incluir solicitudes públicas (NEW_USER desde formulario)
                context: {
                  contains: '"type":"NEW_USER"'
                }
              }
            ]
          },
          include: {
            requester: {
              select: { firstName: true, lastName: true, email: true },
            },
            admin: {
              select: { firstName: true, lastName: true },
            },
            currentState: true,
          },
          orderBy: { createdAt: 'desc' },
        })
      : []
    console.log(`[workflow-items] Solicitudes pendientes para admin: ${pendingRequests.length}`)

    // Tareas creadas por el usuario (si es jefe depto/admin)
    const myTasks = ['JEFE_DEPT', 'ADMIN', 'ROOT'].includes(userRole)
      ? await prisma.task.findMany({
          where: { creatorId: userId },
          include: {
            creator: {
              select: { firstName: true, lastName: true, email: true },
            },
            currentState: true,
            assignments: {
              select: {
                completedAt: true,
                assignee: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      : []
    console.log(`[workflow-items] Tareas creadas por usuario: ${myTasks.length}`)

    // Tareas asignadas al usuario
    const assignedTasks = await prisma.task.findMany({
      where: {
        assignments: {
          some: { assigneeId: userId },
        },
      },
      include: {
        creator: {
          select: { firstName: true, lastName: true, email: true },
        },
        currentState: true,
        assignments: {
          where: { assigneeId: userId },
          select: {
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    console.log(`[workflow-items] Tareas asignadas al usuario: ${assignedTasks.length}`)

    // Combinar y formatear todo
    const formatDate = (date: Date | null | undefined) => 
      date ? new Date(date).toLocaleDateString('es-ES') : '-'

    const isTerminalStatus = (isFinal: boolean, isTerminal: boolean) => {
      return isFinal || isTerminal
    }



    const workflowItems = [
      // Mis solicitudes
      ...myRequests.map((req) => ({
        id: req.id,
        type: 'Solicitud' as const,
        subType: req.context ? JSON.parse(req.context)?.type || 'OTHER' : 'OTHER',
        title: req.title,
        createdAt: req.createdAt,
        createdBy: `${req.requester.firstName || ''} ${req.requester.lastName || ''}`.trim() || req.requester.email,
        status: req.currentState?.name || 'Desconocido',
        statusCode: req.currentState?.code || 'unknown',
        statusColor: req.currentState?.color || 'gray',
        completedAt: isTerminalStatus(req.currentState?.isFinal || false, req.currentState?.isTerminal || false) ? req.updatedAt : null,
        role: 'Creador',
      })),

      // Solicitudes pendientes de gestionar (admin)
      ...pendingRequests.map((req) => ({
        id: req.id,
        type: 'Solicitud' as const,
        subType: req.context ? JSON.parse(req.context)?.type || 'OTHER' : 'OTHER',
        title: req.title,
        createdAt: req.createdAt,
        createdBy: `${req.requester.firstName || ''} ${req.requester.lastName || ''}`.trim() || req.requester.email,
        status: req.currentState?.name || 'Desconocido',
        statusCode: req.currentState?.code || 'unknown',
        statusColor: req.currentState?.color || 'gray',
        completedAt: isTerminalStatus(req.currentState?.isFinal || false, req.currentState?.isTerminal || false) ? req.updatedAt : null,
        role: 'Validador',
      })),

      // Mis tareas (creadas)
      ...myTasks.map((task) => ({
        id: task.id,
        type: 'Tarea' as const,
        subType: task.context ? JSON.parse(task.context)?.type || 'REVIEW' : 'REVIEW',
        title: task.title,
        createdAt: task.createdAt,
        createdBy: `${task.creator.firstName || ''} ${task.creator.lastName || ''}`.trim() || task.creator.email,
        status: task.currentState?.name || 'Desconocido',
        statusCode: task.currentState?.code || 'unknown',
        statusColor: task.currentState?.color || 'gray',
        completedAt: isTerminalStatus(task.currentState?.isFinal || false, task.currentState?.isTerminal || false) ? task.completedAt : null,
        role: 'Creador',
      })),

      // Tareas asignadas
      ...assignedTasks.map((task) => ({
        id: task.id,
        type: 'Tarea' as const,
        subType: task.context ? JSON.parse(task.context)?.type || 'REVIEW' : 'REVIEW',
        title: task.title,
        createdAt: task.createdAt,
        createdBy: `${task.creator.firstName || ''} ${task.creator.lastName || ''}`.trim() || task.creator.email,
        status: task.currentState?.name || 'Desconocido',
        statusCode: task.currentState?.code || 'unknown',
        statusColor: task.currentState?.color || 'gray',
        completedAt: task.assignments[0]?.completedAt,
        role: 'Asignado',
      })),
    ]

    // Ordenar por fecha de creación descendente
    workflowItems.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    console.log(`[workflow-items] Total items encontrados: ${workflowItems.length}`)

    return {
      success: true,
      data: workflowItems.map((item) => ({
        ...item,
        createdAt: formatDate(item.createdAt),
        completedAt: formatDate(item.completedAt),
      })),
      counts: {
        total: workflowItems.length,
        pending: workflowItems.filter((i) => !i.completedAt).length,
        completed: workflowItems.filter((i) => i.completedAt).length,
      },
    }
  } catch (error: any) {
    console.error('[workflow-items] Error:', error)
    throw createError({
      statusCode: 500,
      message: 'Error al obtener los elementos de workflow: ' + (error.message || 'Error desconocido'),
    })
  }
})
