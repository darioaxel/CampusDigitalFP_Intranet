export default defineNuxtRouteMiddleware((to) => {
  
  const { user, loggedIn } = useUserSession()
  
  if (!loggedIn) {
    return navigateTo("/login")
  }
  
  // Lee los roles permitidos desde definePageMeta
  const allowed = to.meta.roles as string[] | undefined
  console.log('Está entrando en: ', to.path)
  console.log('ROLES permitidos en la web:', to.meta.roles as string[])
  console.log('ROL del usuario:', user.value?.role)

  // Si la página pide roles y el usuario no tiene uno válido → forbidden
  if (allowed && !allowed.includes(user.value?.role || '')) {
    return navigateTo("/forbidden")
  }
})
