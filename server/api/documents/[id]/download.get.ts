// server/api/documents/[id]/download.get.ts
// Descargar un documento

export default defineEventHandler(async (event) => {
  // Verificar autenticación
  const session = await getUserSession(event)
  
  if (!session.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'No autenticado',
    })
  }

  const documentId = getRouterParam(event, 'id')
  
  if (!documentId) {
    throw createError({
      statusCode: 400,
      message: 'ID de documento requerido',
    })
  }

  try {
    // Obtener el documento con su archivo y solicitud asociada
    const document = await prisma.requestDocument.findUnique({
      where: { id: documentId },
      include: {
        file: true,
        request: {
          select: {
            requesterId: true,
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

    // Verificar permisos
    const isRequester = document.request.requesterId === session.user.id
    const isAdmin = ['ADMIN', 'ROOT'].includes(session.user.role)
    
    if (!isRequester && !isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'No tienes permiso para descargar este documento',
      })
    }

    // Verificar que el archivo tiene datos
    if (!document.file.data) {
      throw createError({
        statusCode: 404,
        message: 'Archivo no encontrado en el almacenamiento',
      })
    }

    // Configurar headers para descarga
    setHeader(event, 'Content-Type', document.file.mime)
    setHeader(event, 'Content-Disposition', `attachment; filename="${document.file.name}"`)
    setHeader(event, 'Content-Length', document.file.size.toString())

    return document.file.data
  } catch (error: any) {
    if (error.statusCode) throw error
    
    console.error('Error downloading document:', error)
    throw createError({
      statusCode: 500,
      message: 'Error al descargar el documento',
    })
  }
})
