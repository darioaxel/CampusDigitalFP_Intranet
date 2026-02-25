<!-- pages/usuario/calendarios/libre-disposicion/[id].vue -->
<!-- REDIRECCIÓN: El sistema de libre disposición ahora usa solicitudes con workflow -->
<script setup lang="ts">
// Redirigir a la nueva página de solicitudes
definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

// Redirección inmediata
await navigateTo('/usuario/solicitudes/libre-disposicion', { replace: true })
</script>

<template>
  <div class="flex items-center justify-center py-12">
    <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
    <span class="ml-2 text-muted-foreground">Redirigiendo...</span>
  </div>
</template>
