// DELETE /api/espacios/[id] - Eliminar un espacio
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

    // Verificar que el espacio existe
    const existente = await prisma.espacio.findUnique({
      where: { id }
    })

    if (!existente) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Espacio no encontrado'
      })
    }

    await prisma.espacio.delete({
      where: { id }
    })

    return {
      success: true,
      message: 'Espacio eliminado correctamente'
    }
  } catch (error: any) {
    console.error('Error deleting espacio:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al eliminar el espacio'
    })
  }
})
