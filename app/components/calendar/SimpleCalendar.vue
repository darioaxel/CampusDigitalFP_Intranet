<!-- Componente de calendario simple sin dependencias externas -->
<template>
  <div class="simple-calendar">
    <!-- Header del mes -->
    <div class="flex items-center justify-between mb-4">
      <Button variant="ghost" size="sm" @click="prevMonth">
        <Icon name="lucide:chevron-left" class="h-4 w-4" />
      </Button>
      <h3 class="font-semibold capitalize">
        {{ currentMonthYear }}
      </h3>
      <Button variant="ghost" size="sm" @click="nextMonth">
        <Icon name="lucide:chevron-right" class="h-4 w-4" />
      </Button>
    </div>

    <!-- Días de la semana -->
    <div class="grid grid-cols-7 gap-1 mb-2">
      <div v-for="day in weekDays" :key="day" class="text-center text-xs font-medium text-muted-foreground py-2">
        {{ day }}
      </div>
    </div>

    <!-- Grilla de días -->
    <div class="grid grid-cols-7 gap-1">
      <div 
        v-for="(day, index) in calendarDays" 
        :key="index"
        class="min-h-[80px] p-1 border rounded-md"
        :class="{
          'bg-muted/30': !day.isCurrentMonth,
          'bg-primary/10 border-primary/30': day.isToday,
        }"
      >
        <div class="text-xs font-medium mb-1" :class="{ 'text-primary': day.isToday }">
          {{ day.date.getDate() }}
        </div>
        <div class="space-y-1">
          <div 
            v-for="event in day.events" 
            :key="event.id"
            class="text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
            :style="{ backgroundColor: event.color + '20', color: event.color, borderLeft: `2px solid ${event.color}` }"
            @click="$emit('event-click', event.id)"
          >
            {{ event.title }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

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
  initialDate?: Date
}

const props = withDefaults(defineProps<Props>(), {
  events: () => [],
  initialDate: () => new Date()
})

defineEmits<{
  'event-click': [eventId: string]
}>()

const currentDate = ref(new Date(props.initialDate))

const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
})

// Parsear eventos una sola vez
const parsedEvents = computed(() => {
  return (props.events || []).map(event => ({
    ...event,
    startDate: new Date(event.start),
    endDate: new Date(event.end),
  }))
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  // Primer día del mes
  const firstDay = new Date(year, month, 1)
  // Último día del mes
  const lastDay = new Date(year, month + 1, 0)
  
  // Ajustar para que la semana empiece en lunes (0)
  let startingDay = firstDay.getDay() - 1
  if (startingDay < 0) startingDay = 6
  
  const days = []
  const today = new Date()
  
  // Días del mes anterior
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startingDay - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      events: getEventsForDate(date)
    })
  }
  
  // Días del mes actual
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    days.push({
      date,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      events: getEventsForDate(date)
    })
  }
  
  // Días del mes siguiente para completar la grilla (6 filas = 42 celdas)
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      events: getEventsForDate(date)
    })
  }
  
  return days
})

function isSameDay(d1: Date, d2: Date) {
  return d1.getDate() === d2.getDate() && 
         d1.getMonth() === d2.getMonth() && 
         d1.getFullYear() === d2.getFullYear()
}

function getEventsForDate(date: Date) {
  return parsedEvents.value.filter(event => {
    const eventStart = new Date(event.start)
    const eventEnd = new Date(event.end)
    // Normalizar horas a 00:00:00
    eventStart.setHours(0, 0, 0, 0)
    eventEnd.setHours(23, 59, 59, 999)
    const checkDate = new Date(date)
    checkDate.setHours(12, 0, 0, 0)
    
    return checkDate >= eventStart && checkDate <= eventEnd
  })
}

function prevMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

// Actualizar cuando cambian los eventos
watch(() => props.events, () => {
  // Forzar recálculo
}, { deep: true })
</script>

<style scoped>
.simple-calendar {
  padding: 1rem;
}
</style>
