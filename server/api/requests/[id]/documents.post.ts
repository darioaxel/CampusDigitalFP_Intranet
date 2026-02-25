// server/api/requests/[id]/documents.post.ts
// Subir documento a una solicitud con versionado

import { z } from 'zod'
import { canManageRequests } from '../../../utils/workflow/stateMachine'

const documentSchema = z.object({
  fileId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
  replaceDocumentId: z.string().uuid().optional(), // Para reemplazar un documento inválido
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

  const requestId = getRouterParam(event, 'id')
  
  if (!requestId) {
    throw createError({
      statusCode: 400,
      message: 'ID de solicitud requerido',
    })
  }

  // Validar body
  const body = await readBody(event)
  const validation = documentSchema.safeParse(body)
  
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: 'Datos inválidos',
      data: validation.error.flatten(),
    })
  }

  const { fileId, notes, replaceDocumentId } = validation.data

  try {
    // Verificar que la solicitud existe
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        currentState: true,
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    if (!request) {
      throw createError({
        statusCode: 404,
        message: 'Solicitud no encontrada',
      })
    }

    // Verificar permisos
    const isRequester = request.requesterId === session.user.id
    const isAdmin = canManageRequests(session.user.role)
    
    // Solo el requester puede subir documentos (o admin en casos especiales)
    if (!isRequester && !isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'No tienes permiso para adjuntar documentos a esta solicitud',
      })
    }

    // Verificar que la solicitud acepte documentos (usando currentState)
    const allowedStateCodes = ['pending', 'communicated', 'rejected', 'docs_submitted', 'pending_docs']
    if (!allowedStateCodes.includes(request.currentState?.code || '')) {
      throw createError({
        statusCode: 400,
        message: `No se pueden adjuntar documentos en estado ${request.currentState?.name || 'actual'}`,
      })
    }

    // Verificar que el archivo existe
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      throw createError({
        statusCode: 404,
        message: 'Archivo no encontrado',
      })
    }

    // Verificar que el archivo no esté ya asociado a otro documento
    const existingDocWithFile = await prisma.requestDocument.findUnique({
      where: { fileId },
    })

    if (existingDocWithFile) {
      throw createError({
        statusCode: 400,
        message: 'Este archivo ya está asociado a otro documento',
      })
    }

    // Si es un reemplazo, verificar el documento anterior
    let replacedDocId: string | undefined
    if (replaceDocumentId) {
      const docToReplace = await prisma.requestDocument.findFirst({
        where: {
          id: replaceDocumentId,
          requestId: requestId,
        },
      })

      if (!docToReplace) {
        throw createError({
          statusCode: 404,
          message: 'Documento a reemplazar no encontrado',
        })
      }

      // Solo se pueden reemplazar documentos inválidos o pendientes
      if (docToReplace.status !== 'INVALID' && docToReplace.status !== 'PENDING') {
        throw createError({
          statusCode: 400,
          message: `No se puede reemplazar un documento en estado ${docToReplace.status}`,
        })
      }

      replacedDocId = replaceDocumentId
    }

    // Crear el documento en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear nuevo documento
      const newDocument = await tx.requestDocument.create({
        data: {
          requestId,
          uploadedById: session.user!.id,
          fileId,
          notes,
          status: 'SUBMITTED',
          // Si hay reemplazo, establecer la relación
          ...(replacedDocId && {
            replaces: {
              connect: { id: replacedDocId }
            }
          }),
        },
        include: {
          file: {
            select: {
              id: true,
              name: true,
              mime: true,
              size: true,
            },
          },
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      // Si hay reemplazo, actualizar el documento anterior
      if (replacedDocId) {
        await tx.requestDocument.update({
          where: { id: replacedDocId },
          data: {
            status: 'REPLACED',
            replacedById: newDocument.id,
          },
        })

        // Crear log del reemplazo
        await tx.activityLog.create({
          data: {
            actorId: session.user!.id,
            action: 'DOCUMENT_REPLACED',
            description: `Documento reemplazado por uno nuevo`,
            entityType: 'DOCUMENT',
            entityId: replacedDocId,
            requestId: requestId,
            metadata: JSON.stringify({
              oldDocumentId: replacedDocId,
              newDocumentId: newDocument.id,
            }),
          },
        })
      }

      // Crear log de subida
      await tx.activityLog.create({
        data: {
          actorId: session.user!.id,
          action: 'DOCUMENT_UPLOADED',
          description: `Documento subido: ${file.name}`,
          entityType: 'DOCUMENT',
          entityId: newDocument.id,
          requestId: requestId,
          metadata: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.mime,
            isReplacement: !!replacedDocId,
          }),
        },
      })

      return newDocument
    })

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    console.error('Error uploading document:', error)
    throw createError({
      statusCode: 500,
      message: 'Error al subir el documento',
    })
  }
})
