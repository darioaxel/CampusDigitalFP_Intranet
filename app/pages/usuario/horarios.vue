<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})
import MySchedule from '~/components/schedule/MySchedule.vue'
const { user } = await useUserSession()

// CORREGIDO: Eliminada referencia a route.params
const { data: schedules, pending, error, refresh } = await useFetch('/api/schedules/me', {
  key: 'my-schedules',
  default: () => []
})

// Log para debug
if (error.value) {
  console.error('Error cargando horarios:', error.value)
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="container mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">
          Mis Horarios
        </h1>
        <p class="mt-2 text-slate-600">
          {{ user?.firstName }} {{ user?.lastName }} 
          <span class="text-slate-400">•</span> 
          <span class="text-sm text-slate-500">{{ user?.email }}</span>
        </p>
      </div>

      <!-- CORREGIDO: Nombre del componente coincide con el archivo -->
      <MySchedule 
        :schedules="schedules || []" 
        :loading="pending"
        @refresh="refresh"
      />
    </div>
  </div>
</template>