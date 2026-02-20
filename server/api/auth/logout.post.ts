export default defineEventHandler(async (event) => {
  await clearUserSession(event)
  console.log('✅ Logout successful')
  await sendRedirect(event, '/')
  return { ok: true }
})