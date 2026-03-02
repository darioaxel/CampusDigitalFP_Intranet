// GET /api/admin/profesores/horarios - Obtener todos los profesores con sus horarios
import { defineEventHandler, createError } from 'h3'
import pkg from '@prisma/client'
import { prisma } from '../../../utils/db'

const { Role } = pkg

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  try {
    // Verificar que el usuario sea ADMIN o ROOT
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const isAdminOrRoot = [Role.ADMIN, Role.ROOT].includes(currentUser?.role as any)

    if (!isAdminOrRoot) {
      throw createError({ statusCode: 403, message: 'No autorizado' })
    }

    // Obtener parámetros de búsqueda/filtro
    const query = getQuery(event)
    const search = (query.search as string) || ''

    // Construir where para usuarios (profesores, excluyendo ROOT)
    const userWhere: any = {
      role: { not: Role.ROOT }
    }

    // Filtro de búsqueda por nombre/email
    if (search) {
      userWhere.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Obtener profesores con sus horarios
    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        schedules: {
          where: { isActive: true },
          include: {
            blocks: {
              orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
              ]
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })

    // Formatear respuesta
    const profesores = users.map(user => ({
      id: user.id,
      nombre: `${user.lastName || ''}, ${user.firstName || ''}`.trim() || user.email,
      email: user.email,
      rol: user.role,
      activo: user.isActive,
      totalHorarios: user.schedules.length,
      horarios: user.schedules.map(schedule => ({
        id: schedule.id,
        nombre: schedule.name,
        tipo: schedule.type,
        descripcion: schedule.description,
        color: schedule.color,
        validFrom: schedule.validFrom,
        validUntil: schedule.validUntil,
        validationStatus: schedule.validationStatus,
        totalBloques: schedule.blocks.length,
        bloques: schedule.blocks.map(block => ({
          id: block.id,
          dia: block.dayOfWeek,
          horaInicio: block.startTime,
          horaFin: block.endTime,
          asignatura: block.subject,
          aula: block.room,
          esRecreo: block.isBreak
        }))
      }))
    }))

    return {
      success: true,
      data: profesores,
      total: profesores.length
    }

  } catch (error: any) {
    console.error('Error fetching profesores horarios:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al cargar los horarios de profesores'
    })
  }
})
