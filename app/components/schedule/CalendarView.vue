<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ScheduleXCalendar } from '@schedule-x/vue'
import { createCalendar, createViewMonthGrid, type CalendarConfig } from '@schedule-x/calendar'
import { createEventModalPlugin } from '@schedule-x/event-modal'
import '@schedule-x/theme-default/dist/index.css'

interface CalendarEvent {
  id: string
  title: string
  start: string  // YYYY-MM-DD
  end: string    // YYYY-MM-DD
  color?: string
  description?: string
}

interface Props {
  events?: CalendarEvent[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'event-click': [eventId: string]
  'date-click': [date: string]
}>()

// Referencia al calendario
const calendarApp = ref<any>(null)
const isReady = ref(false)

// Función para crear el calendario
function createCalendarInstance(events: CalendarEvent[]) {
  // Asegurar que las fechas están en formato correcto
  const formattedEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    color: event.color || '#3b82f6',
    description: event.description,
  }))

  const config: CalendarConfig = {
    views: [createViewMonthGrid()],
    defaultView: 'month-grid',
    locale: 'es-ES',
    firstDayOfWeek: 1,
    dayBoundaries: {
      start: '00:00',
      end: '23:59',
    },
    weekOptions: {
      gridHeight: 600,
    },
    monthGridOptions: {
      nEventsPerDay: 3,
    },
    events: formattedEvents,
    plugins: [createEventModalPlugin()],
    callbacks: {
      onEventClick: (event: any) => {
        emit('event-click', event.id)
      },
      onClickDate: (date: string) => {
        emit('date-click', date)
      },
    },
  }

  return createCalendar(config)
}

// Crear calendario inicial en cliente
onMounted(() => {
  if (typeof window === 'undefined') return
  
  // Asegurar que Temporal está disponible
  if (!(globalThis as any).Temporal) {
    console.warn('Temporal API no disponible, cargando polyfill...')
    import('temporal-polyfill').then(({ Temporal }) => {
      ;(globalThis as any).Temporal = Temporal
      calendarApp.value = createCalendarInstance(props.events || [])
      isReady.value = true
    })
  } else {
    calendarApp.value = createCalendarInstance(props.events || [])
    isReady.value = true
  }
})

// Recrear calendario cuando cambian los eventos
watch(() => props.events, (newEvents) => {
  if (typeof window === 'undefined') return
  if (!newEvents) return
  
  // Recrear el calendario con los nuevos eventos
  calendarApp.value = createCalendarInstance(newEvents)
}, { deep: true })
</script>

<template>
  <div class="schedulex-calendar rounded-lg border border-border bg-card overflow-hidden">
    <ScheduleXCalendar v-if="calendarApp" :calendar-app="calendarApp" />
    <div v-else class="flex items-center justify-center" style="height: 600px;">
      <div class="text-muted-foreground">Cargando calendario...</div>
    </div>
  </div>
</template>

<style scoped>
.schedulex-calendar :deep(.sx__calendar) {
  --sx-color-primary: #3b82f6;
  --sx-color-on-primary: #ffffff;
  --sx-color-surface: hsl(var(--card));
  --sx-color-on-surface: hsl(var(--card-foreground));
  --sx-color-background: hsl(var(--background));
  --sx-color-on-background: hsl(var(--foreground));
  --sx-border-color: hsl(var(--border));
  --sx-color-text: hsl(var(--foreground));
  --sx-color-text-muted: hsl(var(--muted-foreground));
  --sx-internal-color-text: hsl(var(--foreground));
}

.schedulex-calendar :deep(.sx__month-grid-day) {
  min-height: 80px;
}

.schedulex-calendar :deep(.sx__event) {
  border-radius: 4px;
  font-size: 11px;
  padding: 2px 4px;
}
</style>
