// server/api/documents/[id]/validate.put.ts
// Validar/rechazar documento por administración

import { z } from 'zod'
import { canManageRequests } from '../../../utils/workflow/stateMachine'

const validateSchema = z.object({
  valid: z.boolean(),
  notes: z.string().max(1000).optional(),
})

export default defineEventHandler(async (event) => {
  // Verificar autenticación
  const session = await getUserSession(event)
  
  if (!session.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'No autenticado',
    })
  }

  // Solo administración puede validar documentos
  if (!canManageRequests(session.user.role)) {
    throw createError({
      statusCode: 403,
      message: 'No tienes permiso para validar documentos',
    })
  }

  const documentId = getRouterParam(event, 'id')
  
  if (!documentId) {
    throw createError({
      statusCode: 400,
      message: 'ID de documento requerido',
    })
  }

  // Validar body
  const body = await readBody(event)
  const validation = validateSchema.safeParse(body)
  
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: 'Datos inválidos',
      data: validation.error.flatten(),
    })
  }

  const { valid, notes } = validation.data

  try {
    // Obtener el documento con su solicitud
    const document = await prisma.requestDocument.findUnique({
      where: { id: documentId },
      include: {
        request: {
          select: {
            id: true,
            status: true,
            title: true,
            requesterId: true,
          },
        },
        file: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!document) {
      throw createError({
        statusCode: 404,
        message: 'Documento no encontrado',
      })
    }

    // Verificar que el documento esté en estado válido para validación
    const validatableStatuses = ['SUBMITTED', 'PENDING']
    if (!validatableStatuses.includes(document.status)) {
      throw createError({
        statusCode: 400,
        message: `No se puede validar un documento en estado ${document.status}`,
      })
    }

    // Actualizar el documento
    const updatedDocument = await prisma.requestDocument.update({
      where: { id: documentId },
      data: {
        status: valid ? 'VALID' : 'INVALID',
        validatedById: session.user.id,
        validatedAt: new Date(),
        notes: notes || document.notes,
      },
      include: {
        file: {
          select: {
            id: true,
            name: true,
            mime: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        validatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        request: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    })

    // Crear log de actividad
    await prisma.activityLog.create({
      data: {
        actorId: session.user.id,
        action: valid ? 'DOCUMENT_VALIDATED' : 'DOCUMENT_REJECTED',
        description: valid 
          ? `Documento "${document.file.name}" validado` 
          : `Documento "${document.file.name}" marcado como inválido`,
        entityType: 'DOCUMENT',
        entityId: documentId,
        requestId: document.requestId,
        metadata: JSON.stringify({
          fileName: document.file.name,
          validationResult: valid,
          notes,
          previousStatus: document.status,
        }),
      },
    })

    // Si el documento es válido y la solicitud es médica en estado COMMUNICATED,
    // podríamos notificar o permitir cierre automático
    if (valid && document.request.status === 'COMMUNICATED') {
      // Opcional: Notificar al usuario que puede proceder al cierre
      // o cerrar automáticamente si es el único documento requerido
      
      const validDocsCount = await prisma.requestDocument.count({
        where: {
          requestId: document.requestId,
          status: 'VALID',
        },
      })

      // Si es el primer documento válido, podríamos notificar
      if (validDocsCount === 1) {
        await prisma.activityLog.create({
          data: {
            actorId: session.user.id,
            action: 'REQUEST_READY_TO_CLOSE',
            description: `Solicitud "${document.request.title}" lista para cierre - documentación validada`,
            entityType: 'REQUEST',
            entityId: document.requestId,
            requestId: document.requestId,
            metadata: JSON.stringify({
              validDocumentsCount: validDocsCount,
            }),
          },
        })
      }
    }

    return {
      success: true,
      data: {
        document: updatedDocument,
        validationResult: valid ? 'VALID' : 'INVALID',
        canCloseRequest: valid && document.request.status === 'COMMUNICATED',
      },
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    console.error('Error validating document:', error)
    throw createError({
      statusCode: 500,
      message: 'Error al validar el documento',
    })
  }
})
