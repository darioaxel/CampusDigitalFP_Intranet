// GET /api/espacios - Listar espacios
import { defineEventHandler, createError, getQuery } from 'h3'
import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { planta } = query

    const where: any = {}
    
    if (planta !== undefined) {
      where.planta = parseInt(planta as string, 10)
    }

    const espacios = await prisma.espacio.findMany({
      where,
      include: {
        schedule: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: [
        { planta: 'asc' },
        { nombre: 'asc' }
      ]
    })

    return {
      success: true,
      data: espacios
    }
  } catch (error: any) {
    console.error('Error fetching espacios:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al cargar los espacios'
    })
  }
})
