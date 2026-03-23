// server/api/admin/workflows/validate.post.ts
// Validar JSON de workflow sin guardar

import { z } from 'zod'
import { validateWorkflowJson } from '../../../../app/lib/workflow-validation'

const validateSchema = z.object({
  json: z.string().min(1, 'JSON requerido')
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

    const body = await readValidatedBody(event, validateSchema.parse)
    const result = validateWorkflowJson(body.json)

    return {
      success: result.valid,
      valid: result.valid,
      errors: result.errors,
      parseError: result.parseError
    }
  } catch (error: any) {
    console.error('[workflows/validate] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error al validar workflow'
    })
  }
})
