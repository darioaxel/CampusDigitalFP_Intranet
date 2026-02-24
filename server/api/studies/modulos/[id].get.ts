// GET /api/studies/modulos/[id] - Obtener un módulo con RAs y temas
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, message: 'ID requerido' })
    }

    const modulo = await prisma.moduloProfesional.findUnique({
      where: { id },
      include: {
        ciclo: {
          select: {
            id: true,
            nombre: true,
            nivel: true
          }
        },
        docente: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        resultadosAprendizaje: {
          include: {
            criteriosEvaluacion: {
              orderBy: { orden: 'asc' }
            }
          },
          orderBy: { orden: 'asc' }
        },
        temas: {
          include: {
            resultadosAprendizaje: {
              select: {
                id: true,
                numero: true,
                descripcion: true
              }
            },
            contenidos: {
              orderBy: { orden: 'asc' }
            },
            recursos: {
              orderBy: { orden: 'asc' }
            }
          },
          orderBy: { orden: 'asc' }
        }
      }
    })

    if (!modulo) {
      throw createError({ statusCode: 404, message: 'Módulo profesional no encontrado' })
    }

    return {
      success: true,
      data: modulo
    }
  } catch (error: any) {
    console.error('Error fetching modulo:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al cargar el módulo profesional'
    })
  }
})
