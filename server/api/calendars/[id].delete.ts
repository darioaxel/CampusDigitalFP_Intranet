// DELETE /api/calendars/[id] - Eliminar calendario (solo ADMIN/ROOT)
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user as any
  
  if (!user?.id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }
  
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }
  
  // Verificar que sea ADMIN o ROOT
  const prisma = getPrisma()
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })
  
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'ROOT')) {
    throw createError({ statusCode: 403, message: 'Solo administradores pueden eliminar calendarios' })
  }
  
  // Eliminar calendario (cascade elimina eventos y asignaciones)
  await prisma.calendar.delete({
    where: { id },
  })
  
  return {
    success: true,
    message: 'Calendario eliminado correctamente',
  }
})
