// server/api/user/workflow-items.get.ts
// Obtiene solicitudes y tareas relacionadas con el usuario actual

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any
  
  const userId = user.id as string
  const userRole = user.role as string
  const isAdmin = ['ADMIN', 'ROOT'].includes(userRole)

  try {
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
      },
      orderBy: { createdAt: 'desc' },
    })

    // Solicitudes pendientes de gestionar (para admin)
    const pendingRequests = isAdmin
      ? await prisma.request.findMany({
          where: {
            status: { in: ['PENDING', 'COMMUNICATED'] },
            requesterId: { not: userId }, // Excluir las propias
          },
          include: {
            requester: {
              select: { firstName: true, lastName: true, email: true },
            },
            admin: {
              select: { firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      : []

    // Tareas creadas por el usuario (si es jefe depto/admin)
    const myTasks = ['JEFE_DEPT', 'ADMIN', 'ROOT'].includes(userRole)
      ? await prisma.task.findMany({
          where: { creatorId: userId },
          include: {
            creator: {
              select: { firstName: true, lastName: true, email: true },
            },
            assignments: {
              select: {
                status: true,
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
        assignments: {
          where: { assigneeId: userId },
          select: {
            status: true,
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Combinar y formatear todo
    const formatDate = (date: Date | null | undefined) => 
      date ? new Date(date).toLocaleDateString('es-ES') : '-'

    const isTerminalStatus = (status: string, type: 'request' | 'task') => {
      if (type === 'request') {
        return ['APPROVED', 'REJECTED', 'CLOSED'].includes(status)
      }
      return ['DONE', 'CANCELLED'].includes(status)
    }

    const workflowItems = [
      // Mis solicitudes
      ...myRequests.map((req) => ({
        id: req.id,
        type: 'Solicitud',
        subType: req.type,
        title: req.title,
        createdAt: req.createdAt,
        createdBy: `${req.requester.firstName || ''} ${req.requester.lastName || ''}`.trim() || req.requester.email,
        status: req.status,
        completedAt: isTerminalStatus(req.status, 'request') ? req.updatedAt : null,
        role: 'Creador',
      })),

      // Solicitudes pendientes de gestionar (admin)
      ...pendingRequests.map((req) => ({
        id: req.id,
        type: 'Solicitud',
        subType: req.type,
        title: req.title,
        createdAt: req.createdAt,
        createdBy: `${req.requester.firstName || ''} ${req.requester.lastName || ''}`.trim() || req.requester.email,
        status: req.status,
        completedAt: isTerminalStatus(req.status, 'request') ? req.updatedAt : null,
        role: 'Validador',
      })),

      // Mis tareas (creadas)
      ...myTasks.map((task) => ({
        id: task.id,
        type: 'Tarea',
        subType: task.type,
        title: task.title,
        createdAt: task.createdAt,
        createdBy: `${task.creator.firstName || ''} ${task.creator.lastName || ''}`.trim() || task.creator.email,
        status: task.status,
        completedAt: isTerminalStatus(task.status, 'task') ? task.completedAt : null,
        role: 'Creador',
      })),

      // Tareas asignadas
      ...assignedTasks.map((task) => ({
        id: task.id,
        type: 'Tarea',
        subType: task.type,
        title: task.title,
        createdAt: task.createdAt,
        createdBy: `${task.creator.firstName || ''} ${task.creator.lastName || ''}`.trim() || task.creator.email,
        status: task.assignments[0]?.status || task.status,
        completedAt: task.assignments[0]?.completedAt,
        role: 'Asignado',
      })),
    ]

    // Ordenar por fecha de creación descendente
    workflowItems.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return {
      success: true,
      data: workflowItems.map((item) => ({
        ...item,
        createdAt: formatDate(item.createdAt),
        completedAt: formatDate(item.completedAt),
      })),
      counts: {
        total: workflowItems.length,
        pending: workflowItems.filter((i) => 
          !isTerminalStatus(i.status, i.type === 'Solicitud' ? 'request' : 'task')
        ).length,
        completed: workflowItems.filter((i) => 
          isTerminalStatus(i.status, i.type === 'Solicitud' ? 'request' : 'task')
        ).length,
      },
    }
  } catch (error) {
    console.error('Error fetching workflow items:', error)
    throw createError({
      statusCode: 500,
      message: 'Error al obtener los elementos de workflow',
    })
  }
})
