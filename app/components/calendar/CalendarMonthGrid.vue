<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CalendarMonthEvent, CalendarDay } from './CalendarMonthCard.vue'

/**
 * Props del componente CalendarMonthGrid
 */
interface Props {
  // Rango de fechas a mostrar
  startDate: string | Date // Inicio del rango
  endDate: string | Date // Fin del rango
  
  // Eventos a mostrar
  events?: CalendarMonthEvent[]
  
  // Configuración
  selectable?: boolean
  showWeekends?: boolean
  showEventIndicators?: boolean
  compact?: boolean
  readonly?: boolean
  columns?: number // Número de columnas en la grid (1-4)
  
  // Callback personalizado para clases de días
  dayClass?: (day: CalendarDay) => string
}

const props = withDefaults(defineProps<Props>(), {
  events: () => [],
  selectable: false,
  showWeekends: true,
  showEventIndicators: true,
  compact: false,
  readonly: false,
  columns: 3,
})

/**
 * Emits
 */
const emit = defineEmits<{
  'day-click': [date: string, day: CalendarDay]
  'day-mouseenter': [date: string, day: CalendarDay]
  'day-mousedown': [date: string, day: CalendarDay]
  'day-mouseup': [date: string, day: CalendarDay]
  'selection-change': [selectedDays: string[]]
}>()

// Días seleccionados (estado interno si no se proporciona externamente)
const internalSelectedDays = ref<string[]>([])
const selectedDays = computed({
  get: () => internalSelectedDays.value,
  set: (val) => {
    internalSelectedDays.value = val
    emit('selection-change', val)
  },
})

// Parsear fechas de inicio y fin
const parsedStartDate = computed(() => {
  return typeof props.startDate === 'string' 
    ? new Date(props.startDate) 
    : props.startDate
})

const parsedEndDate = computed(() => {
  return typeof props.endDate === 'string' 
    ? new Date(props.endDate) 
    : props.endDate
})

// Generar lista de meses en el rango
const months = computed(() => {
  const monthsList: { year: number; month: number; key: string }[] = []
  
  const current = new Date(parsedStartDate.value)
  current.setDate(1) // Primer día del mes
  
  const end = new Date(parsedEndDate.value)
  
  while (current <= end) {
    const year = current.getFullYear()
    const month = current.getMonth()
    
    monthsList.push({
      year,
      month,
      key: `${year}-${month}`,
    })
    
    current.setMonth(current.getMonth() + 1)
  }
  
  return monthsList
})

// Clases CSS para la grid de columnas
const gridClasses = computed(() => {
  const cols = props.columns
  if (cols === 1) return 'grid-cols-1'
  if (cols === 2) return 'grid-cols-1 md:grid-cols-2'
  if (cols === 3) return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
  return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
})

// Handlers de eventos que se propagan a los hijos
function handleDayClick(date: string, day: CalendarDay) {
  if (props.selectable && !day.isWeekend) {
    const index = selectedDays.value.indexOf(date)
    if (index === -1) {
      selectedDays.value = [...selectedDays.value, date]
    } else {
      const newSelection = [...selectedDays.value]
      newSelection.splice(index, 1)
      selectedDays.value = newSelection
    }
  }
  emit('day-click', date, day)
}

function handleMouseEnter(date: string, day: CalendarDay) {
  emit('day-mouseenter', date, day)
}

function handleMouseDown(date: string, day: CalendarDay) {
  emit('day-mousedown', date, day)
}

function handleMouseUp(date: string, day: CalendarDay) {
  emit('day-mouseup', date, day)
}

// Métodos públicos
function clearSelection() {
  selectedDays.value = []
}

function selectAll() {
  // Seleccionar todos los días laborables del rango
  const allDays: string[] = []
  const current = new Date(parsedStartDate.value)
  const end = new Date(parsedEndDate.value)
  
  while (current <= end) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      allDays.push(current.toISOString().split('T')[0])
    }
    current.setDate(current.getDate() + 1)
  }
  
  selectedDays.value = allDays
}

function getSelectedDays(): string[] {
  return [...selectedDays.value]
}

// Exponer métodos para el padre
defineExpose({
  clearSelection,
  selectAll,
  getSelectedDays,
  months,
})
</script>

<template>
  <div 
    class="grid gap-4"
    :class="gridClasses"
  >
    <CalendarMonthCard
      v-for="{ year, month, key } in months"
      :key="key"
      :year="year"
      :month="month"
      :events="events"
      :selected-days="selectedDays"
      :selectable="selectable"
      :show-weekends="showWeekends"
      :show-event-indicators="showEventIndicators"
      :compact="compact"
      :readonly="readonly"
      :day-class="dayClass"
      @day-click="handleDayClick"
      @day-mouseenter="handleMouseEnter"
      @day-mousedown="handleMouseDown"
      @day-mouseup="handleMouseUp"
    />
  </div>
</template>
