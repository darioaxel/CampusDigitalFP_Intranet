<script setup lang="ts">
import { Button } from '@/components/ui/button'

const { session } = useAppUserSession()
const userRole = computed(() => session.value.role)
const isLoggedIn = computed(() => session.value.loggedIn)

// Verificar si el usuario es admin o root
const isAdmin = computed(() => {
  return userRole.value === 'ADMIN' || userRole.value === 'ROOT'
})
</script>

<template>
  <div v-if="isLoggedIn" class="flex items-center gap-1">
    <!-- Enlace a área de usuario (visible para cualquier usuario logueado con rol) -->
    <Button
      variant="ghost"
      size="sm"
      as-child
      class="h-9 px-3 text-muted-foreground hover:text-foreground"
    >
      <NuxtLink to="/usuario" class="flex items-center gap-2">
        <Icon name="lucide:user" class="h-4 w-4" />
        <span class="hidden sm:inline">Usuario</span>
      </NuxtLink>
    </Button>

    <!-- Enlace a área de admin (solo para ADMIN o ROOT) -->
    <Button
      v-if="isAdmin"
      variant="ghost"
      size="sm"
      as-child
      class="h-9 px-3 text-muted-foreground hover:text-foreground"
    >
      <NuxtLink to="/admin" class="flex items-center gap-2">
        <Icon name="lucide:shield" class="h-4 w-4" />
        <span class="hidden sm:inline">Admin</span>
      </NuxtLink>
    </Button>
  </div>
</template>
