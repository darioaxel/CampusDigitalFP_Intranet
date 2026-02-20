export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, fetch } = useUserSession()

  // Nos aseguramos de tener la sesión actualizada (SSR/CSR)
  if (!loggedIn.value) {
    await fetch()
  }

  // Si no está logueado y NO está en /login → redirigir a /login
  if (!loggedIn.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  if (loggedIn.value && to.path === 'login') {
    return navigateTo('/usuario')
  }
})
