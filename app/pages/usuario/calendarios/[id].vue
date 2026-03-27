<!-- pages/usuario/calendarios/[id].vue - Detalle de calendario normal -->
<template>
  <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">
    <!-- Header -->
    <LayoutPageHeader
      :title="calendar?.data?.name || 'Cargando...'"
      :description="calendar?.data?.description || ''"
      back-to="/usuario/calendarios"
      :loading="pending"
      @refresh="refresh"
    >
      <template #actions>
        <Badge v-if="calendar?.data?.academicYear?.name" variant="outline" class="text-xs">
          Curso {{ calendar.data.academicYear.name }}
        </Badge>
      </template>
    </LayoutPageHeader>

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      <span class="ml-2 text-muted-foreground">Cargando calendario...</span>
    </div>

    <!-- Error -->
    <div v-else-if="!calendar?.data" class="text-center py-12">
      <CalendarX class="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
      <p class="mt-4 text-muted-foreground">No se pudo cargar el calendario</p>
      <Button variant="outline" class="mt-4" @click="refresh()">
        Reintentar
      </Button>
    </div>

    <template v-else>
      <!-- Info del calendario -->
      <Card class="bg-muted/50">
        <CardContent class="py-1">
          <div class="flex items-center gap-6 text-sm">
            <div class="flex items-center gap-2">
              <Icon name="lucide:calendar" class="h-4 w-4 text-muted-foreground" />
              <span>Curso {{ calendar.data.academicYear?.name }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Icon name="lucide:clock" class="h-4 w-4 text-muted-foreground" />
              <span>{{ formatDateRange(calendar.data.startDate, calendar.data.endDate) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Icon name="lucide:calendar-days" class="h-4 w-4 text-muted-foreground" />
              <span>{{ events.length }} eventos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Vista del calendario (SimpleCalendar) -->
      <Card>
        <CardContent class="pt-1">
          <SimpleCalendar 
            :events="calendarEvents"
            :initial-date="initialDate"
            @event-click="viewEventDetails"
          />
        </CardContent>
      </Card>


    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loader2, CalendarX } from 'lucide-vue-next'
import SimpleCalendar from '~/components/calendar/SimpleCalendar.vue'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

const route = useRoute()
const calendarId = route.params.id as string

// Fetch calendario con eventos
const { data: calendar, pending, refresh } = await useFetch(() => `/api/calendars/${calendarId}`, {
  key: `calendar-${calendarId}`,
  server: true,
})

const events = computed(() => {
  const eventList = calendar.value?.data?.events || []

  return eventList
})

// Fecha inicial para el calendario (mes actual)
const initialDate = computed(() => new Date())

// Transformar eventos para el componente de calendario
const calendarEvents = computed(() => {
  const mapped = events.value.map((event: any) => {
    // Asegurar formato YYYY-MM-DD
    const start = event.startDate ? event.startDate.split('T')[0] : ''
    const end = event.endDate 
      ? event.endDate.split('T')[0] 
      : start
    
    return {
      id: event.id,
      title: event.title,
      start: start,
      end: end,
      color: event.color || '#3b82f6',
      description: event.description,
    }
  })

  return mapped
})

// Helpers
function formatDateRange(start: string, end: string) {
  if (!start || !end) return ''
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${startDate.toLocaleDateString('es-ES')} - ${endDate.toLocaleDateString('es-ES')}`
}

function formatEventDate(event: any) {
  const start = new Date(event.startDate).toLocaleDateString('es-ES')
  if (event.endDate && event.endDate !== event.startDate) {
    const end = new Date(event.endDate).toLocaleDateString('es-ES')
    return `${start} al ${end}`
  }
  return start
}

function viewEventDetails(eventId: string) {
  const event = events.value.find((e: any) => e.id === eventId)
  if (event) {
    alert(`${event.title}\n${event.description || 'Sin descripción'}`)
  }
}


</script>
