
export default defineEventHandler(async (event) => {
  // solo ADMIN o ROOT
  const session = await getUserSession(event)
  if (!session?.user || !['ADMIN', 'ROOT'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'No autorizado' })
  }

  const id = getRouterParam(event, 'id')
  await prisma.user.update({
    where: { id },
    data: { isActive: false, deactivatedAt: new Date() },
  })

  return { ok: true }
})