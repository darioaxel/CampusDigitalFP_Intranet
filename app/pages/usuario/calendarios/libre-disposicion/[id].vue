<!-- pages/usuario/calendarios/libre-disposicion/[id].vue -->
<template>
  <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="sm" @click="navigateTo('/usuario/calendarios')">
            <Icon name="lucide:arrow-left" class="h-4 w-4 mr-1" />
            Volver
          </Button>
        </div>
        <h1 class="text-2xl font-bold">{{ calendar?.name }}</h1>
        <p class="text-muted-foreground text-sm">
          {{ calendar?.description }}
        </p>
      </div>
      
      <div class="flex items-center gap-2">
        <Badge variant="outline" class="text-xs">
          {{ calendar?.academicYear }}
        </Badge>
        <Button 
          variant="ghost" 
          size="sm"
          :disabled="loading"
          @click="refreshAll"
        >
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          <Icon v-else name="lucide:refresh-cw" class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Info del calendario -->
    <Alert>
      <Info class="h-4 w-4" />
      <AlertTitle class="text-sm">Cómo funciona</AlertTitle>
      <AlertDescription class="text-xs">
        Arrastra los días disponibles del calendario a tu panel de "Mis Días".
        Tienes un máximo de {{ calendar?.maxEventsPerUser || 4 }} días para este curso.
        Los días ya consumidos aparecen marcados.
      </AlertDescription>
    </Alert>

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      <span class="ml-2 text-muted-foreground">Cargando calendario...</span>
    </div>

    <!-- Calendario con drag-drop -->
    <CalendarDnd
      v-else
      :events="calendarEvents"
      :user-assignments="userAssignments"
      :max-assignments="calendar?.maxEventsPerUser || 4"
      :allow-drag-from-calendar="true"
      :allow-drop-to-calendar="true"
      :read-only="!canAssign"
      @assign="handleAssign"
      @unassign="handleUnassign"
      @event-click="viewEventDetails"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Loader2, Info } from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

const route = useRoute()
const calendarId = route.params.id as string

const loading = ref(false)

// Fetch calendario
const { data: calendar, pending, refresh: refreshCalendar } = useFetch(() => `/api/calendars/${calendarId}`)

// Fetch mis asignaciones
const { data: myAssignments, refresh: refreshAssignments } = useFetch(() => `/api/calendars/${calendarId}/my-assignments`)

// Transformar eventos para el componente
const calendarEvents = computed(() => {
  if (!calendar.value?.data?.events) return []
  
  return calendar.value.data.events.map((event: any) => {
    // Verificar si el evento ya está asignado por el usuario
    const isAssigned = myAssignments.value?.data?.some(
      (a: any) => a.eventId === event.id
    )
    
    // Verificar si el evento está lleno
    const isFull = event.maxAssignments && event._count?.assignments >= event.maxAssignments
    
    return {
      id: event.id,
      title: event.title,
      start: event.startDate.split('T')[0],
      end: event.endDate 
        ? event.endDate.split('T')[0] 
        : event.startDate.split('T')[0],
      color: isAssigned ? '#22c55e' : (isFull ? '#9ca3af' : (event.color || '#3b82f6')),
      description: event.description,
      isDraggable: !isAssigned && !isFull && event.type === 'FREE_DISPOSITION',
    }
  })
})

// Transformar asignaciones del usuario
const userAssignments = computed(() => {
  if (!myAssignments.value?.data) return []
  
  return myAssignments.value.data.map((assignment: any) => ({
    id: assignment.id,
    eventId: assignment.eventId,
    title: assignment.event.title,
    startDate: assignment.event.startDate,
    endDate: assignment.event.endDate,
    color: assignment.event.color,
    order: assignment.order,
  }))
})

// Verificar si puede asignar más
const canAssign = computed(() => {
  const max = calendar.value?.data?.maxEventsPerUser || 4
  const current = myAssignments.value?.data?.length || 0
  return current < max
})

// Handlers
async function handleAssign(eventId: string) {
  if (!canAssign.value) {
    alert('Has alcanzado el límite de días permitidos')
    return
  }
  
  loading.value = true
  try {
    await $fetch(`/api/calendars/${calendarId}/assign`, {
      method: 'POST',
      body: { eventId },
    })
    await refreshAll()
    alert('Día asignado correctamente')
  } catch (error: any) {
    alert(error.data?.message || 'Error al asignar el día')
  } finally {
    loading.value = false
  }
}

async function handleUnassign(assignmentId: string) {
  if (!confirm('¿Estás seguro de que quieres quitar este día?')) return
  
  loading.value = true
  try {
    await $fetch(`/api/calendars/${calendarId}/assign`, {
      method: 'DELETE',
      body: { eventId: assignmentId },
    })
    await refreshAll()
    alert('Día eliminado correctamente')
  } catch (error: any) {
    alert(error.data?.message || 'Error al eliminar el día')
  } finally {
    loading.value = false
  }
}

function viewEventDetails(eventId: string) {
  const event = calendar.value?.data?.events.find((e: any) => e.id === eventId)
  if (event) {
    // Mostrar detalles en modal o alert
    alert(`${event.title}\n${event.description || 'Sin descripción'}`)
  }
}

async function refreshAll() {
  await Promise.all([refreshCalendar(), refreshAssignments()])
}
</script>
