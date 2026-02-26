<!-- pages/usuario/calendarios/[id].vue - Detalle de calendario normal -->
<template>
  <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">
    <!-- Debug info (eliminar en producción) -->
    <div v-if="false" class="bg-yellow-100 p-4 rounded text-xs font-mono">
      <p>Calendar ID: {{ calendarId }}</p>
      <p>Pending: {{ pending }}</p>
      <p>Has data: {{ !!calendar }}</p>
      <p>Events count: {{ events.length }}</p>
      <pre>{{ JSON.stringify(calendar, null, 2) }}</pre>
    </div>

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <NuxtLink to="/usuario/calendarios">
            <Button variant="ghost" size="sm">
              <Icon name="lucide:arrow-left" class="h-4 w-4 mr-1" />
              Volver
            </Button>
          </NuxtLink>
        </div>
        <h1 class="text-2xl font-bold">{{ calendar?.data?.name || 'Cargando...' }}</h1>
        <p class="text-muted-foreground text-sm">
          {{ calendar?.data?.description }}
        </p>
      </div>
      
      <div class="flex items-center gap-2">
        <Badge v-if="calendar?.data?.academicYear" variant="outline" class="text-xs">
          {{ calendar.data.academicYear }}
        </Badge>
        <Button 
          variant="ghost" 
          size="sm"
          :disabled="pending"
          @click="refresh()"
        >
          <Loader2 v-if="pending" class="h-4 w-4 animate-spin" />
          <Icon v-else name="lucide:refresh-cw" class="h-4 w-4" />
        </Button>
      </div>
    </div>

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
        <CardContent class="py-4">
          <div class="flex items-center gap-6 text-sm">
            <div class="flex items-center gap-2">
              <Icon name="lucide:calendar" class="h-4 w-4 text-muted-foreground" />
              <span>{{ calendar.data.academicYear }}</span>
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
        <CardHeader class="pb-3">
          <CardTitle class="text-lg">Calendario</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleCalendar 
            :events="calendarEvents"
            :initial-date="initialDate"
            @event-click="viewEventDetails"
          />
        </CardContent>
      </Card>

      <!-- Lista de eventos -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="text-lg">Eventos ({{ events.length }})</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="!events.length" class="text-center py-8 text-muted-foreground">
            No hay eventos en este calendario
          </div>
          <div v-else class="space-y-3">
            <div 
              v-for="event in events" 
              :key="event.id"
              class="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div 
                class="w-4 h-4 rounded-full mt-0.5 shrink-0" 
                :style="{ backgroundColor: event.color || '#3b82f6' }"
              ></div>
              <div class="flex-1 min-w-0">
                <div class="font-medium">{{ event.title }}</div>
                <div class="text-sm text-muted-foreground">
                  {{ formatEventDate(event) }}
                </div>
                <div v-if="event.description" class="text-sm text-muted-foreground mt-1">
                  {{ event.description }}
                </div>
              </div>
              <Badge :variant="getEventTypeVariant(event.type)" class="text-xs shrink-0">
                {{ getEventTypeLabel(event.type) }}
              </Badge>
            </div>
          </div>
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
  console.log('Eventos recibidos de la API:', eventList.length, eventList)
  return eventList
})

// Fecha inicial para el calendario (inicio del calendario o hoy)
const initialDate = computed(() => {
  if (calendar.value?.data?.startDate) {
    return new Date(calendar.value.data.startDate)
  }
  return new Date()
})

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
  console.log('Eventos mapeados para SimpleCalendar:', mapped)
  return mapped
})

// Helpers
function getEventTypeLabel(type: string) {
  const labels: Record<string, string> = {
    'HOLIDAY': 'Festivo',
    'LECTIVE': 'Lectivo',
    'EVALUATION': 'Evaluación',
    'FREE_DISPOSITION': 'Libre Disp.',
    'MEETING': 'Reunión',
    'DEADLINE': 'Fecha límite',
    'OTHER': 'Otro',
  }
  return labels[type] || type
}

function getEventTypeVariant(type: string): any {
  const variants: Record<string, any> = {
    'HOLIDAY': 'destructive',
    'LECTIVE': 'default',
    'EVALUATION': 'secondary',
    'FREE_DISPOSITION': 'outline',
    'MEETING': 'default',
    'DEADLINE': 'secondary',
    'OTHER': 'secondary',
  }
  return variants[type] || 'default'
}

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

// Log inicial
console.log('Calendar ID:', calendarId)
console.log('Calendar data:', calendar.value)
</script>
