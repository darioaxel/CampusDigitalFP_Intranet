// GET /api/requests/[id] - Obtener detalle de una solicitud
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { canManageRequests } from '../../../utils/workflow/stateMachine'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const requestId = getRouterParam(event, 'id')
  
  if (!requestId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de solicitud requerido'
    })
  }

  try {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        currentState: true,
        workflow: true,
        documents: {
          include: {
            file: {
              select: {
                id: true,
                name: true,
                mime: true,
                size: true,
              }
            },
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        stateHistory: {
          include: {
            actor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            },
            toState: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!request) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Solicitud no encontrada'
      })
    }

    // Verificar permisos
    const isAdmin = canManageRequests(session.user.role)
    const isRequester = request.requesterId === session.user.id

    // Para solicitudes de tipo NEW_USER (desde formulario público), permitir acceso a admin
    const context = request.context ? JSON.parse(request.context) : {}
    const isNewUserRequest = context.type === 'NEW_USER'

    if (!isAdmin && !isRequester) {
      throw createError({
        statusCode: 403,
        statusMessage: 'No tienes acceso a esta solicitud'
      })
    }

    // Para solicitudes NEW_USER, enriquecer la respuesta con datos del contexto
    let enrichedData = { ...request }
    
    if (isNewUserRequest) {
      enrichedData = {
        ...request,
        // Si es solicitud pública, mostrar los datos del solicitante desde el contexto
        newUserData: context.userData || null,
        requesterInfo: context.requester || null,
        additionalInfo: {
          department: context.department,
          specialty: context.specialty,
          experience: context.experience,
        }
      }
    }

    return {
      success: true,
      data: enrichedData
    }
  } catch (error: any) {
    console.error('Error fetching request:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Error al cargar la solicitud'
    })
  }
})
