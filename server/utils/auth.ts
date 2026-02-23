// server/utils/auth.ts - Utilidades de autenticación para el servidor

import { createError, H3Event } from 'h3'

/**
 * Verifica que el usuario tenga uno de los roles requeridos
 */
export async function requireRole(event: H3Event, allowedRoles: string[]) {
  const session = await requireUserSession(event)
  const user = session.user as any
  
  if (!user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }
  
  if (!allowedRoles.includes(user.role)) {
    throw createError({ 
      statusCode: 403, 
      message: 'No tienes permisos para realizar esta acción' 
    })
  }
  
  return user
}

/**
 * Verifica que el usuario esté autenticado
 */
export async function requireAuth(event: H3Event) {
  const session = await requireUserSession(event)
  const user = session.user as any
  
  if (!user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }
  
  return user
}

/**
 * Verifica si el usuario es ADMIN o ROOT
 */
export async function requireAdmin(event: H3Event) {
  const session = await requireUserSession(event)
  const user = session.user as any
  
  if (!user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }
  
  if (user.role !== 'ADMIN' && user.role !== 'ROOT') {
    throw createError({ 
      statusCode: 403, 
      message: 'Solo administradores pueden realizar esta acción' 
    })
  }
  
  return user
}
