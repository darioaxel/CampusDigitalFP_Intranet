<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

const route = useRoute()
const router = useRouter()
const { user } = await useUserSession()

// Detectar si estamos en modo revisión (admin viene desde una tarea)
const scheduleId = route.query.view as string | undefined
const taskId = route.query.task as string | undefined
const isReviewMode = computed(() => {
  return ['ADMIN', 'ROOT'].includes(user.value?.role || '') && !!taskId && !!scheduleId
})

// Datos normales o de revisión
const { data: mySchedulesResponse, pending, error, refresh } = await useFetch('/api/schedules/me', {
  key: 'my-schedules',
  default: () => [],
  immediate: !isReviewMode.value // Solo cargar si NO es modo revisión
})

// Extraer horarios de la respuesta (manejar ambos formatos por compatibilidad)
const mySchedules = computed(() => {
  const response = mySchedulesResponse.value
  if (!response) return []
  // Si es array, devolver directamente (formato antiguo)
  if (Array.isArray(response)) return response
  // Si tiene data, devolver data (nuevo formato)
  return response.data || []
})

// Si es modo revisión, cargar el horario específico y la tarea
const { data: reviewScheduleResponse, pending: reviewPending } = await useFetch(
  () => scheduleId ? `/api/schedules/${scheduleId}` : null,
  {
    key: 'review-schedule',
    immediate: isReviewMode.value
  }
)

// Extraer datos de la respuesta
const reviewSchedule = computed(() => reviewScheduleResponse.value?.data || null)

const { data: task } = await useFetch(
  () => taskId ? `/api/tasks/${taskId}` : null,
  {
    key: 'review-task',
    immediate: isReviewMode.value
  }
)

// Schedules a mostrar (los míos o el de revisión)
const schedules = computed(() => {
  if (isReviewMode.value && reviewSchedule.value) {
    return [reviewSchedule.value]
  }
  return mySchedules.value
})

const loading = computed(() => isReviewMode.value ? reviewPending.value : pending.value)

// Validar/Rechazar horario
const validateAndComplete = async (action: 'VALIDAR' | 'RECHAZAR') => {
  try {
    // 1. Validar/Rechazar el horario
    const { error: valError } = await useFetch(`/api/schedules/${scheduleId}/validate`, {
      method: 'POST',
      body: { action }
    })

    if (valError.value) throw valError.value

    // 2. Completar la tarea (si existe taskId)
    if (taskId) {
      const { error: taskError } = await useFetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST'
      })
      if (taskError.value) {
        console.warn('Error completando tarea:', taskError.value)
      }
    }

    toast.success(action === 'VALIDAR' ? 'Horario validado correctamente' : 'Horario rechazado')
    
    // Redirigir al dashboard de tareas
    await navigateTo('/usuario/tareas')
  } catch (err: any) {
    toast.error(err.message || 'Error al procesar la validación')
  }
}

// Volver a la lista de tareas (si es modo revisión)
const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    navigateTo('/usuario/tareas')
  }
}

if (error.value) {
  console.error('Error cargando horarios:', error.value)
}
</script>

<template>
  <div class="min-h-screen bg-background p-4">
    <div class="mx-auto max-w-7xl">
      <!-- Cabecera -->
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- Botón volver (solo en modo revisión) -->
          <Button 
            v-if="isReviewMode"
            variant="ghost" 
            size="sm" 
            class="h-8 w-8 p-0"
            as-child
          >
            <NuxtLink to="/usuario/tareas">
              <Icon name="lucide:arrow-left" class="h-4 w-4" />
            </NuxtLink>
          </Button>
          
          <div>
            <h1 class="text-lg font-semibold tracking-tight text-foreground">
              {{ isReviewMode ? 'Revisión de Horario' : 'Mis Horarios' }}
            </h1>
            <p class="text-xs text-muted-foreground">
              <template v-if="isReviewMode && reviewSchedule">
                Profesor: {{ reviewSchedule.user?.firstName }} {{ reviewSchedule.user?.lastName }} 
                • {{ reviewSchedule.user?.email }}
              </template>
              <template v-else>
                {{ user?.firstName }} {{ user?.lastName }} • {{ user?.email }}
              </template>
            </p>
          </div>
        </div>
        
        <div class="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            @click="refresh"
            :disabled="loading"
            class="h-8 w-8 p-0"
          >
            <Icon 
              name="lucide:refresh-cw" 
              class="h-4 w-4"
              :class="{ 'animate-spin': loading }"
            />
          </Button>
        </div>
      </div>

      <!-- Panel de acción para admin (modo revisión) -->
      <div 
        v-if="isReviewMode && task?.type === 'REVIEW'" 
        class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4"
      >
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-start gap-3">
            <div class="bg-amber-100 dark:bg-amber-900 p-2 rounded-full">
              <Icon name="lucide:clipboard-check" class="h-5 w-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <h3 class="font-medium text-amber-900 dark:text-amber-100">Revisión de Horario</h3>
              <p class="text-sm text-amber-700 dark:text-amber-300">
                Tarea asignada. Revisa los bloques y valida el horario antes de completar.
              </p>
              <p v-if="task?.description" class="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {{ task.description }}
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button 
              variant="default" 
              class="bg-green-600 hover:bg-green-700 text-white"
              @click="validateAndComplete('VALIDAR')"
            >
              <Icon name="lucide:check" class="mr-1 h-4 w-4" />
              Validar Horario
            </Button>
            <Button 
              variant="destructive" 
              @click="validateAndComplete('RECHAZAR')"
            >
              <Icon name="lucide:x" class="mr-1 h-4 w-4" />
              Rechazar
            </Button>
          </div>
        </div>
      </div>

      <!-- Estados -->
      <div v-if="loading" class="h-[calc(100vh-10rem)] rounded-lg border border-border bg-card animate-pulse" />
      
      <div v-else-if="error" class="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p class="text-sm text-destructive">Error al cargar los horarios</p>
      </div>

      <div v-else-if="!schedules?.length" class="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
        <Icon name="lucide:calendar-x" class="h-8 w-8 text-muted-foreground" />
        <p class="mt-2 text-sm text-muted-foreground">
          {{ isReviewMode ? 'Horario no encontrado o no tienes permiso para verlo' : 'No tienes horarios asignados' }}
        </p>
      </div>

      <!-- Componente principal con tabs -->
      <ScheduleViewer 
        v-else
        :schedules="schedules" 
        :loading="loading"
        :is-review-mode="isReviewMode"
        @refresh="refresh"
      />
    </div>
  </div>
</template>