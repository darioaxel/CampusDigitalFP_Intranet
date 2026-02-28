<script setup lang="ts">
// Redirección a la nueva vista unificada de gestión de horarios
definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

// Redirigir a la página principal de horarios
await navigateTo('/admin/horarios', { replace: true })
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
</template>
