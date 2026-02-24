// GET /api/schedules/[id] - Obtener un horario específico con bloques
import { defineEventHandler, createError, getRouterParam } from 'h3'
import pkg from '@prisma/client'
import { prisma } from '../../utils/db'

const { Role } = pkg

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  try {
    // Verificar rol del usuario actual
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const isAdminOrRoot = [Role.ADMIN, Role.ROOT].includes(currentUser?.role as any)

    // Buscar el horario
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        blocks: {
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        request: true
      }
    })

    if (!schedule) {
      throw createError({ statusCode: 404, message: 'Horario no encontrado' })
    }

    // Verificar permisos: solo el dueño o admin/root pueden ver
    const canView = schedule.userId === session.user.id || isAdminOrRoot

    if (!canView) {
      throw createError({ statusCode: 403, message: 'No autorizado para ver este horario' })
    }

    return {
      success: true,
      data: schedule
    }
  } catch (error: any) {
    console.error('Error fetching schedule:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al cargar el horario'
    })
  }
})
