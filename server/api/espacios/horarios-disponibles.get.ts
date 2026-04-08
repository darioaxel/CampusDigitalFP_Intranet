// GET /api/espacios/horarios-disponibles - Listar horarios disponibles para asignar a espacios
import { defineEventHandler, createError, getQuery } from 'h3'
import { prisma } from '../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { excludeEspacioId } = query

    // Obtener IDs de horarios ya asignados a otros espacios
    const espaciosConHorario = await prisma.espacio.findMany({
      where: {
        scheduleId: { not: null },
        ...(excludeEspacioId && { id: { not: excludeEspacioId as string } })
      },
      select: { scheduleId: true }
    })

    const horariosOcupados = espaciosConHorario
      .map(e => e.scheduleId)
      .filter((id): id is string => id !== null)

    // Obtener horarios disponibles (no asignados)
    const horarios = await prisma.schedule.findMany({
      where: {
        id: { notIn: horariosOcupados },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        academicYear: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            blocks: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return {
      success: true,
      data: horarios
    }
  } catch (error: any) {
    console.error('Error fetching horarios disponibles:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al cargar los horarios disponibles'
    })
  }
})
