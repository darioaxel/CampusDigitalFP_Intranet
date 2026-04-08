// GET /api/espacios/[id] - Obtener un espacio por ID
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID del espacio no proporcionado'
      })
    }

    const espacio = await prisma.espacio.findUnique({
      where: { id },
      include: {
        schedule: {
          include: {
            blocks: true,
            academicYear: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (!espacio) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Espacio no encontrado'
      })
    }

    return {
      success: true,
      data: espacio
    }
  } catch (error: any) {
    console.error('Error fetching espacio:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al cargar el espacio'
    })
  }
})
