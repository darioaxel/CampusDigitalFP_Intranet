<script setup lang="ts">
import { computed } from 'vue'
import { ScheduleXCalendar } from '@schedule-x/vue'
import { createCalendar, createViewMonthGrid } from '@schedule-x/calendar'
import { createEventModalPlugin } from '@schedule-x/event-modal'
import '@schedule-x/theme-default/dist/index.css'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  color?: string
  description?: string
}

interface Props {
  events?: CalendarEvent[]
  onEventClick?: (eventId: string) => void
  onDateClick?: (date: string) => void
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'event-click': [eventId: string]
  'date-click': [date: string]
}>()

// Transform events to ScheduleX format
const calendarEvents = computed(() => {
  return (props.events || []).map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    color: event.color || '#3b82f6',
    description: event.description,
  }))
})

// Create calendar instance
const calendarApp = computed(() => {
  return createCalendar({
    views: [createViewMonthGrid()],
    defaultView: 'month-grid',
    locale: 'es-ES',
    firstDayOfWeek: 1, // Monday
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
    events: calendarEvents.value,
    plugins: [createEventModalPlugin()],
    callbacks: {
      onEventClick: (event: any) => {
        emit('event-click', event.id)
        props.onEventClick?.(event.id)
      },
      onClickDate: (date: string) => {
        emit('date-click', date)
        props.onDateClick?.(date)
      },
    },
  })
})
</script>

<template>
  <div class="schedulex-calendar rounded-lg border border-border bg-card overflow-hidden">
    <ScheduleXCalendar :calendar-app="calendarApp" />
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
