// POST /api/espacios - Crear un nuevo espacio
import { defineEventHandler, createError, readValidatedBody } from 'h3'
import { z } from 'zod'
import { prisma } from '../../utils/db'

const createEspacioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  planta: z.number().int().min(0, 'La planta debe ser un número positivo'),
  observaciones: z.string().optional(),
  scheduleId: z.string().optional()
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, createEspacioSchema.parse)

    // Verificar que no exista un espacio con el mismo nombre
    const existente = await prisma.espacio.findUnique({
      where: { nombre: body.nombre }
    })

    if (existente) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ya existe un espacio con ese nombre'
      })
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
      const espacioConHorario = await prisma.espacio.findUnique({
        where: { scheduleId: body.scheduleId }
      })

      if (espacioConHorario) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Este horario ya está asignado a otro espacio'
        })
      }
    }

    const espacio = await prisma.espacio.create({
      data: {
        nombre: body.nombre,
        planta: body.planta,
        observaciones: body.observaciones,
        scheduleId: body.scheduleId
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
    console.error('Error creating espacio:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al crear el espacio'
    })
  }
})
