// GET /api/studies/ciclos/[id] - Obtener un ciclo con sus módulos
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, message: 'ID requerido' })
    }

    const ciclo = await prisma.cicloFormativo.findUnique({
      where: { id },
      include: {
        modulos: {
          include: {
            docente: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            _count: {
              select: {
                resultadosAprendizaje: true,
                temas: true
              }
            }
          },
          orderBy: [
            { curso: 'asc' },
            { orden: 'asc' }
          ]
        }
      }
    })

    if (!ciclo) {
      throw createError({ statusCode: 404, message: 'Ciclo formativo no encontrado' })
    }

    return {
      success: true,
      data: ciclo
    }
  } catch (error: any) {
    console.error('Error fetching ciclo:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al cargar el ciclo formativo'
    })
  }
})
