// GET /api/studies/ciclos - Listar ciclos formativos
import { defineEventHandler, createError, getQuery } from 'h3'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { nivel, familia, activo = 'true' } = query

    const where: any = {}
    
    if (nivel) where.nivel = nivel
    if (familia) where.familia = familia
    if (activo !== undefined) where.activo = activo === 'true'

    const ciclos = await prisma.cicloFormativo.findMany({
      where,
      include: {
        _count: {
          select: {
            modulos: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return {
      success: true,
      data: ciclos
    }
  } catch (error: any) {
    console.error('Error fetching ciclos:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al cargar los ciclos formativos'
    })
  }
})
