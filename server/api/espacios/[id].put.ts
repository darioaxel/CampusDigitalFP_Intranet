// PUT /api/espacios/[id] - Actualizar un espacio
import { defineEventHandler, createError, getRouterParam, readValidatedBody } from 'h3'
import { z } from 'zod'
import { prisma } from '../../utils/db'

const updateEspacioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').optional(),
  planta: z.number().int().min(0, 'La planta debe ser un número positivo').optional(),
  observaciones: z.string().optional().nullable(),
  scheduleId: z.string().optional().nullable()
})

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID del espacio no proporcionado'
      })
    }

    const body = await readValidatedBody(event, updateEspacioSchema.parse)

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

    // Verificar nombre único si se está actualizando
    if (body.nombre && body.nombre !== existente.nombre) {
      const nombreExistente = await prisma.espacio.findUnique({
        where: { nombre: body.nombre }
      })

      if (nombreExistente) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Ya existe un espacio con ese nombre'
        })
      }
    }

    // Si se proporciona scheduleId, verificar que exista
    if (body.scheduleId) {
      const schedule = await prisma.schedule.findUnique({
        where: { id: body.scheduleId }
      })

      if (!schedule) {
        throw createError({
          statusCode: 400,
          statusMessage: 'El horario especificado no existe'
        })
      }

      // Verificar que el horario no esté ya asignado a otro espacio
      const espacioConHorario = await prisma.espacio.findFirst({
        where: {
          scheduleId: body.scheduleId,
          id: { not: id }
        }
      })

      if (espacioConHorario) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Este horario ya está asignado a otro espacio'
        })
      }
    }

    const espacio = await prisma.espacio.update({
      where: { id },
      data: {
        ...(body.nombre !== undefined && { nombre: body.nombre }),
        ...(body.planta !== undefined && { planta: body.planta }),
        ...(body.observaciones !== undefined && { observaciones: body.observaciones }),
        ...(body.scheduleId !== undefined && { scheduleId: body.scheduleId })
      },
      include: {
        schedule: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })

    return {
      success: true,
      data: espacio
    }
  } catch (error: any) {
    console.error('Error updating espacio:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al actualizar el espacio'
    })
  }
})
