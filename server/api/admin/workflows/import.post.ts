// server/api/admin/workflows/import.post.ts
// Importar workflow desde JSON (crear nuevo o actualizar existente)

import { z } from 'zod'
import { prisma } from '../../../utils/db'
import { validateWorkflowJson } from '../../../../app/lib/workflow-validation'

const importSchema = z.object({
  json: z.string().min(1, 'JSON requerido'),
  workflowId: z.string().optional() // Si se proporciona, actualiza; si no, crea nuevo
})

export default defineEventHandler(async (event) => {
  try {
    // Verificar que el usuario es admin
    const { user } = await getUserSession(event)
    if (!user || !['ADMIN', 'ROOT'].includes(user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'No autorizado'
      })
    }

    const body = await readValidatedBody(event, importSchema.parse)

    // Validar el JSON
    const validation = validateWorkflowJson(body.json)
    if (!validation.valid || !validation.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'JSON inválido',
        data: { errors: validation.errors }
      })
    }

    const workflowData = validation.data

    // Si se proporciona workflowId, verificar que existe
    let existingWorkflow = null
    if (body.workflowId) {
      existingWorkflow = await prisma.workflowDefinition.findUnique({
        where: { id: body.workflowId },
        include: { states: true, transitions: true }
      })

      if (!existingWorkflow) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Workflow no encontrado'
        })
      }

      // Verificar que el código no cambia en actualización
      if (existingWorkflow.code !== workflowData.code) {
        throw createError({
          statusCode: 400,
          statusMessage: 'No se puede cambiar el código de un workflow existente'
        })
      }
    } else {
      // Verificar que el código no existe al crear nuevo
      const codeExists = await prisma.workflowDefinition.findUnique({
        where: { code: workflowData.code }
      })

      if (codeExists) {
        throw createError({
          statusCode: 400,
          statusMessage: `Ya existe un workflow con el código "${workflowData.code}"`
        })
      }
    }

    // Crear o actualizar el workflow en una transacción
    const result = await prisma.$transaction(async (tx) => {
      let workflow

      if (existingWorkflow) {
        // Actualizar workflow existente
        workflow = await tx.workflowDefinition.update({
          where: { id: body.workflowId },
          data: {
            name: workflowData.name,
            description: workflowData.description,
            isActive: workflowData.isActive ?? true,
            version: { increment: 1 } // Incrementar versión al actualizar
          }
        })

        // Eliminar estados y transiciones antiguos
        await tx.workflowState.deleteMany({
          where: { workflowId: workflow.id }
        })
      } else {
        // Crear nuevo workflow
        workflow = await tx.workflowDefinition.create({
          data: {
            code: workflowData.code,
            name: workflowData.name,
            description: workflowData.description,
            entityType: workflowData.entityType,
            version: workflowData.version || 1,
            isActive: workflowData.isActive ?? true
          }
        })
      }

      // Crear estados
      const stateMap = new Map<string, string>() // code -> id

      for (let i = 0; i < workflowData.states.length; i++) {
        const state = workflowData.states[i]
        const createdState = await tx.workflowState.create({
          data: {
            workflowId: workflow.id,
            code: state.code,
            name: state.name,
            color: state.color || 'gray',
            order: state.order ?? i + 1,
            isInitial: state.isInitial ?? false,
            isFinal: state.isFinal ?? false,
            isTerminal: state.isTerminal ?? false,
            config: state.config ? JSON.stringify(state.config) : null
          }
        })
        stateMap.set(state.code, createdState.id)
      }

      // Crear transiciones
      for (const trans of workflowData.transitions) {
        const fromStateId = stateMap.get(trans.from)
        const toStateId = stateMap.get(trans.to)

        if (!fromStateId || !toStateId) {
          throw new Error(`Estados no encontrados para transición: ${trans.from} -> ${trans.to}`)
        }

        await tx.workflowTransition.create({
          data: {
            workflowId: workflow.id,
            fromStateId,
            toStateId,
            allowedRoles: JSON.stringify(trans.allowedRoles),
            requiresComment: trans.requiresComment ?? false,
            requiresFields: trans.requiresFields ? JSON.stringify(trans.requiresFields) : null,
            autoActions: trans.autoActions ? JSON.stringify(trans.autoActions) : null,
            validatorCode: trans.validatorCode || null
          }
        })
      }

      // Retornar el workflow completo
      return await tx.workflowDefinition.findUnique({
        where: { id: workflow.id },
        include: {
          states: { orderBy: { order: 'asc' } },
          transitions: {
            include: { fromState: true, toState: true }
          }
        }
      })
    })

    return {
      success: true,
      data: result,
      message: existingWorkflow
        ? 'Workflow actualizado correctamente'
        : 'Workflow creado correctamente'
    }

  } catch (error: any) {
    console.error('[workflows/import] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error al importar workflow'
    })
  }
})
