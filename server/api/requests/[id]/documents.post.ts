// server/api/requests/[id]/documents.post.ts
// Subir documento a una solicitud - soporta multipart/form-data y JSON

import { z } from 'zod'

// Schema para JSON (modo legacy)
const jsonSchema = z.object({
  fileId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
  replaceDocumentId: z.string().uuid().optional(),
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

  try {
    // Verificar que la solicitud existe
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        currentState: true,
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
    const isAdmin = ['ADMIN', 'ROOT'].includes(session.user.role)
    
    if (!isRequester && !isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'No tienes permiso para adjuntar documentos a esta solicitud',
      })
    }

    // Verificar que la solicitud acepta documentos
    const allowedStateCodes = ['pending', 'communicated', 'rejected', 'docs_submitted', 'pending_docs', 'notified']
    if (!allowedStateCodes.includes(request.currentState?.code || '')) {
      throw createError({
        statusCode: 400,
        message: `No se pueden adjuntar documentos en estado ${request.currentState?.name || 'actual'}`,
      })
    }

    // Determinar tipo de contenido
    const contentType = getHeader(event, 'content-type') || ''
    const isMultipart = contentType.includes('multipart/form-data')

    let fileId: string
    let notes: string | undefined
    let replaceDocumentId: string | undefined

    if (isMultipart) {
      // Modo multipart - subir archivo directamente
      const formData = await readMultipartFormData(event)
      
      if (!formData || formData.length === 0) {
        throw createError({
          statusCode: 400,
          message: 'No se encontró ningún archivo',
        })
      }

      const fileField = formData.find(f => f.name === 'file')
      const notesField = formData.find(f => f.name === 'notes')
      const replaceField = formData.find(f => f.name === 'replaceDocumentId')

      if (!fileField || !fileField.data) {
        throw createError({
          statusCode: 400,
          message: 'Archivo requerido',
        })
      }

      // Validar tipo de archivo (solo PDF)
      const fileType = fileField.type || 'application/octet-stream'
      if (fileType !== 'application/pdf') {
        throw createError({
          statusCode: 400,
          message: 'Solo se permiten archivos PDF',
        })
      }

      // Validar tamaño (máx 10MB)
      const maxSize = 10 * 1024 * 1024
      if (fileField.data.length > maxSize) {
        throw createError({
          statusCode: 400,
          message: 'El archivo excede el tamaño máximo de 10MB',
        })
      }

      notes = notesField?.data?.toString()
      replaceDocumentId = replaceField?.data?.toString()

      // Crear el registro de archivo
      const fileRecord = await prisma.file.create({
        data: {
          name: fileField.filename || 'documento.pdf',
          mime: 'application/pdf',
          size: fileField.data.length,
          data: fileField.data,
          uploadedById: session.user.id,
        },
      })

      fileId = fileRecord.id
    } else {
      // Modo JSON - usar fileId existente
      const body = await readBody(event)
      const validation = jsonSchema.safeParse(body)
      
      if (!validation.success) {
        throw createError({
          statusCode: 400,
          message: 'Datos inválidos',
          data: validation.error.flatten(),
        })
      }

      fileId = validation.data.fileId
      notes = validation.data.notes
      replaceDocumentId = validation.data.replaceDocumentId

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

      // Verificar que el archivo no esté ya asociado
      const existingDoc = await prisma.requestDocument.findUnique({
        where: { fileId },
      })

      if (existingDoc) {
        throw createError({
          statusCode: 400,
          message: 'Este archivo ya está asociado a otro documento',
        })
      }
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

      if (docToReplace.status !== 'INVALID' && docToReplace.status !== 'PENDING' && docToReplace.status !== 'SUBMITTED') {
        throw createError({
          statusCode: 400,
          message: `No se puede reemplazar un documento en estado ${docToReplace.status}`,
        })
      }

      replacedDocId = replaceDocumentId
    }

    // Crear el documento en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Obtener info del archivo
      const file = await tx.file.findUnique({
        where: { id: fileId },
      })

      if (!file) {
        throw createError({
          statusCode: 404,
          message: 'Archivo no encontrado',
        })
      }

      // Crear nuevo documento
      const newDocument = await tx.requestDocument.create({
        data: {
          requestId,
          uploadedById: session.user!.id,
          fileId,
          notes,
          status: 'SUBMITTED',
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
  } catch (error: any) {
    if (error.statusCode) throw error
    
    console.error('Error uploading document:', error)
    throw createError({
      statusCode: 500,
      message: 'Error al subir el documento',
    })
  }
})
