<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

const { user } = await useUserSession()

const { data: schedules, pending, error, refresh } = await useFetch('/api/schedules/me', {
  key: 'my-schedules',
  default: () => []
})

if (error.value) {
  console.error('Error cargando horarios:', error.value)
}
</script>

<template>
  <div class="min-h-screen bg-background p-4">
    <div class="mx-auto max-w-7xl">
      <!-- Cabecera Compacta -->
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h1 class="text-lg font-semibold tracking-tight text-foreground">
            Mis Horarios
          </h1>
          <p class="text-xs text-muted-foreground">
            {{ user?.firstName }} {{ user?.lastName }} • {{ user?.email }}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          @click="refresh"
          :disabled="pending"
          class="h-8 w-8 p-0"
        >
          <Icon 
            name="lucide:refresh-cw" 
            class="h-4 w-4"
            :class="{ 'animate-spin': pending }"
          />
        </Button>
      </div>

      <!-- Estados -->
      <div v-if="pending" class="h-[calc(100vh-10rem)] rounded-lg border border-border bg-card animate-pulse" />
      
      <div v-else-if="error" class="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p class="text-sm text-destructive">Error al cargar los horarios</p>
      </div>

      <div v-else-if="!schedules?.length" class="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
        <Icon name="lucide:calendar-x" class="h-8 w-8 text-muted-foreground" />
        <p class="mt-2 text-sm text-muted-foreground">No tienes horarios asignados</p>
      </div>

      <!-- Componente principal con tabs -->
      <ScheduleViewer 
        v-else
        :schedules="schedules" 
        :loading="pending"
      />
    </div>
  </div>
</template>