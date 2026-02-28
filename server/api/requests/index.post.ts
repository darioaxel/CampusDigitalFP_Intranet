// server/api/requests/index.post.ts
// Crear una nueva solicitud usando workflow configurable

import { z } from 'zod'
import { canCreateRequest } from '../../utils/workflow/stateMachine'

// Mapeo de tipos de solicitud a códigos de workflow
const REQUEST_TYPE_TO_WORKFLOW: Record<string, string> = {
  'FREE_DAY': 'request_free_day',
  'MEDICAL_APPOINTMENT': 'request_medical',
  'LEAVE': 'request_standard',
  'TRAINING': 'request_standard',
  'OTHER': 'request_standard',
  'NEW_USER': 'request_new_user',
  'SICK_LEAVE': 'request_sick_leave',
}

// Schema para solicitudes autenticadas
const authenticatedRequestSchema = z.object({
  type: z.enum(['FREE_DAY', 'MEDICAL_APPOINTMENT', 'LEAVE', 'TRAINING', 'OTHER', 'SICK_LEAVE']),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  requestedDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  workflowCode: z.string().optional(), // Para usar workflow específico
  context: z.record(z.any()).optional(), // Datos adicionales del contexto
})

// Schema para solicitud pública de nuevo usuario
const publicNewUserRequestSchema = z.object({
  type: z.literal('NEW_USER'),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  // Datos del solicitante (persona que hace la solicitud)
  requesterName: z.string().min(2).max(100),
  requesterEmail: z.string().email(),
  requesterPhone: z.string().min(9).max(20).optional(),
  // Datos del usuario a dar de alta
  userData: z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    role: z.enum(['PROFESOR', 'EXPERTO']).optional(), // El rol lo asignará el admin
    dni: z.string().optional(),
    phone: z.string().optional(),
    // Campos adicionales para cuando el usuario crea su contraseña
    password: z.string().min(8).optional(),
    birthDate: z.string().optional(),
    emailPersonal: z.string().email().optional(),
  }),
  // Información adicional
  department: z.string().optional(),
  specialty: z.string().optional(),
  experience: z.string().max(2000).optional(),
})

// Schema combinado
const createRequestSchema = z.union([
  authenticatedRequestSchema,
  publicNewUserRequestSchema
])

export default defineEventHandler(async (event) => {
  // Validar body primero para saber el tipo
  const body = await readBody(event)
  const validation = createRequestSchema.safeParse(body)
  
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: 'Datos inválidos',
      data: validation.error.flatten(),
    })
  }

  const data = validation.data

  // ========================================
  // SOLICITUD PÚBLICA DE NUEVO USUARIO
  // ========================================
  if (data.type === 'NEW_USER') {
    try {
      // Verificar que el email del usuario a crear no exista
      const existingUser = await prisma.user.findUnique({
        where: { email: data.userData.email }
      })

      if (existingUser) {
        throw createError({
          statusCode: 409,
          message: 'Ya existe un usuario con ese email'
        })
      }

      // Obtener el workflow de nuevo usuario
      const workflow = await prisma.workflowDefinition.findUnique({
        where: { code: 'request_new_user' },
        include: { states: true }
      })

      if (!workflow) {
        throw createError({
          statusCode: 500,
          message: 'Workflow no configurado',
        })
      }

      const initialState = workflow.states.find(s => s.isInitial)
      if (!initialState) {
        throw createError({
          statusCode: 500,
          message: 'Workflow sin estado inicial',
        })
      }

      // Buscar un usuario admin para asignar la solicitud (opcional)
      const admin = await prisma.user.findFirst({
        where: { role: { in: ['ADMIN', 'ROOT'] } },
        select: { id: true }
      })

      // Crear la solicitud sin requesterId (es anónima/pública)
      const request = await prisma.request.create({
        data: {
          workflowId: workflow.id,
          currentStateId: initialState.id,
          title: data.title,
          description: data.description || `Solicitud de alta para ${data.userData.firstName} ${data.userData.lastName}`,
          requesterId: admin?.id || '00000000-0000-0000-0000-000000000000', // Placeholder si no hay admin
          adminId: admin?.id,
          context: JSON.stringify({ 
            type: 'NEW_USER',
            requester: {
              name: data.requesterName,
              email: data.requesterEmail,
              phone: data.requesterPhone
            },
            userData: data.userData,
            department: data.department,
            specialty: data.specialty,
            experience: data.experience
          }),
        },
        include: {
          currentState: true,
        },
      })

      // Crear log de actividad
      await prisma.activityLog.create({
        data: {
          actorId: admin?.id || request.id, // Usar request.id como fallback
          action: 'NEW_USER_REQUEST_CREATED',
          description: `Solicitud de alta de usuario "${data.userData.firstName} ${data.userData.lastName}" recibida desde formulario público`,
          entityType: 'REQUEST',
          entityId: request.id,
          requestId: request.id,
          metadata: JSON.stringify({
            type: 'NEW_USER',
            requesterEmail: data.requesterEmail,
            userEmail: data.userData.email,
            userRole: data.userData.role,
          }),
        },
      })

      return {
        success: true,
        message: 'Solicitud enviada correctamente. Será revisada por administración.',
        data: {
          id: request.id,
          title: request.title,
          status: request.currentState?.name || 'Pendiente',
        },
      }
    } catch (error: any) {
      console.error('Error creating new user request:', error)
      if (error.statusCode) throw error
      throw createError({
        statusCode: 500,
        message: 'Error al enviar la solicitud',
      })
    }
  }

  // ========================================
  // SOLICITUDES AUTENTICADAS (requieren login)
  // ========================================
  
  // Verificar autenticación para el resto de tipos
  const session = await getUserSession(event)
  
  if (!session.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'No autenticado',
    })
  }

  // Verificar permisos según el tipo de solicitud
  if (!canCreateRequest(session.user.role)) {
    throw createError({
      statusCode: 403,
      message: 'No tienes permiso para crear solicitudes',
    })
  }

  // Validaciones de fechas
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    if (start > end) {
      throw createError({
        statusCode: 400,
        message: 'La fecha de inicio no puede ser posterior a la fecha de fin',
      })
    }
  }

  try {
    // Obtener el workflow correspondiente
    const workflowCode = data.workflowCode || REQUEST_TYPE_TO_WORKFLOW[data.type]
    if (!workflowCode) {
      throw createError({
        statusCode: 400,
        message: 'Tipo de solicitud no soportado',
      })
    }

    const workflow = await prisma.workflowDefinition.findUnique({
      where: { code: workflowCode },
      include: { states: true }
    })

    if (!workflow) {
      throw createError({
        statusCode: 500,
        message: 'Workflow no configurado',
      })
    }

    const initialState = workflow.states.find(s => s.isInitial)
    if (!initialState) {
      throw createError({
        statusCode: 500,
        message: 'Workflow sin estado inicial',
      })
    }

    // Preparar contexto según el tipo
    const context: Record<string, any> = { type: data.type, ...data.context }

    // Crear la solicitud
    const request = await prisma.request.create({
      data: {
        workflowId: workflow.id,
        currentStateId: initialState.id,
        title: data.title,
        description: data.description,
        requestedDate: data.requestedDate ? new Date(data.requestedDate) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        requesterId: session.user.id,
        context: JSON.stringify(context),
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        currentState: true,
        documents: {
          select: {
            id: true,
            status: true,
            file: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Crear log de actividad
    await prisma.activityLog.create({
      data: {
        actorId: session.user.id,
        action: 'REQUEST_CREATED',
        description: `Solicitud "${data.title}" creada`,
        entityType: 'REQUEST',
        entityId: request.id,
        requestId: request.id,
        metadata: JSON.stringify({
          type: data.type,
          title: data.title,
          workflowCode,
        }),
      },
    })

    return {
      success: true,
      data: request,
    }
  } catch (error: any) {
    console.error('Error creating request:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: 'Error al crear la solicitud',
    })
  }
})
