// ~/composables/useAppUserSession.ts

import { useEventBus } from '@vueuse/core'
import type { UserSessionState, FullUser } from '~/types/auth' // ✅ Usa alias

export const authBus = useEventBus<string>('auth-events')

export const useAppUserSession = () => {
  const { user: baseUser } = useUserSession()

  // Estado reactivo compartido
  const state = useState<UserSessionState>('auth:state', () => ({
    user: null,
    loggedIn: false,
    loading: true,
    role: null
  }))

  const loadUser = async (): Promise<void> => {
    if (!baseUser.value?.id) {
      // ✅ CORREGIDO: Incluye role: null para consistencia
      state.value = { user: null, loggedIn: false, loading: false, role: null }
      return
    }

    state.value.loading = true

    // ✅ TIPADO: useFetch<FullUser> para seguridad de tipos
    const { data, error } = await useFetch<FullUser>('/api/user', {
      server: false,
      lazy: false
    })

    if (error.value) {
      console.error('❌ Error cargando usuario:', error.value)
      state.value = { user: null, loggedIn: false, loading: false, role: null }
      return
    }

    if (data.value) {
      state.value = {
        user: data.value,
        loggedIn: true,
        loading: false,
        role: data.value.role
      }
      authBus.emit('user-loaded')
    }
  }

  // Watch para cambios en la sesión base
  watch(
    () => baseUser.value?.id,
    (userId) => {
      console.log('👀 ID de usuario cambiado:', userId)
      if (userId) {
        loadUser()
      } else {
        // ✅ Reset completo (ya estaba bien)
        state.value = { user: null, loggedIn: false, loading: false, role: null }
      }
    },
    { immediate: true }
  )

  // Listener de eventos globales
  authBus.on((event) => {
    console.log('📡 Evento recibido:', event)

    if (event === 'logout') {
      // ✅ Reset completo (ya estaba bien)
      state.value = { user: null, loggedIn: false, loading: false, role: null }
      clearNuxtData('/api/user')
      console.log('✅ Estado reseteado por evento logout')
    } else if (event === 'login') {
      loadUser()
    }
  })

  onMounted(() => {
    if (baseUser.value?.id) {
      loadUser()
    } else {
      state.value.loading = false
    }
  })

  // Método logout
  const logout = async (): Promise<void> => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      await clearUserSession()
      authBus.emit('logout')
      await navigateTo('/login')
    } catch (error) {
      console.error('❌ Error en logout:', error)
      authBus.emit('logout')
      await navigateTo('/login') // ✅ CORREGIDO: await faltaba en tu versión
    }
  }

  return {
    session: computed(() => state.value),
    logout,
    refresh: loadUser
  }
}