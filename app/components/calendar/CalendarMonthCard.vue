<script setup lang="ts">
import { computed } from 'vue'

/**
 * Tipos de eventos de calendario soportados
 */
export interface CalendarMonthEvent {
  id: string
  title: string
  startDate: string // YYYY-MM-DD
  endDate?: string | null // YYYY-MM-DD (opcional)
  type?: 'HOLIDAY' | 'LECTIVE' | 'EVALUATION' | 'FREE_DISPOSITION' | 'MEETING' | 'DEADLINE' | 'OTHER'
  color?: string | null
}

/**
 * Props del componente CalendarMonthCard
 */
interface Props {
  // Fecha objetivo (año y mes)
  year: number
  month: number // 0-11 (Enero = 0)
  
  // Eventos a mostrar en el mes
  events?: CalendarMonthEvent[]
  
  // Días seleccionados (formato YYYY-MM-DD)
  selectedDays?: string[]
  
  // Configuración de comportamiento
  selectable?: boolean // Permite seleccionar días
  showWeekends?: boolean // Muestra días de fin de semana
  showEventIndicators?: boolean // Muestra indicadores de eventos
  compact?: boolean // Modo compacto (para grids)
  readonly?: boolean // Solo lectura, sin interacciones
  
  // Clases CSS personalizadas
  dayClass?: (day: CalendarDay) => string
}

const props = withDefaults(defineProps<Props>(), {
  events: () => [],
  selectedDays: () => [],
  selectable: false,
  showWeekends: true,
  showEventIndicators: true,
  compact: false,
  readonly: false,
  dayClass: () => '',
})

/**
 * Emits del componente
 */
const emit = defineEmits<{
  'day-click': [date: string, day: CalendarDay]
  'day-mouseenter': [date: string, day: CalendarDay]
  'day-mousedown': [date: string, day: CalendarDay]
  'day-mouseup': [date: string, day: CalendarDay]
}>()

// Días de la semana (inicia en lunes)
const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const weekDaysFull = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/**
 * Información de un día del calendario
 */
export interface CalendarDay {
  date: string // YYYY-MM-DD
  day: number // 1-31
  isCurrentMonth: boolean
  isWeekend: boolean
  isHoliday: boolean
  isExam: boolean
  events: CalendarMonthEvent[]
  eventCount: number
  empty: boolean // Día vacío (relleno)
}

// Nombre del mes en español
const monthName = computed(() => {
  const date = new Date(props.year, props.month, 1)
  return date.toLocaleDateString('es-ES', { month: 'long' })
})

// Lista de días del mes con su información
const days = computed<CalendarDay[]>(() => {
  const year = props.year
  const month = props.month
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Ajustar para que empiece en lunes (0 = lunes, 6 = domingo)
  let startDayOfWeek = firstDay.getDay() - 1
  if (startDayOfWeek < 0) startDayOfWeek = 6
  
  const days: CalendarDay[] = []
  
  // Días vacíos al inicio para alinear con el día de la semana
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({ empty: true } as CalendarDay)
  }
  
  // Días del mes
  for (let dayNum = 1; dayNum <= lastDay.getDate(); dayNum++) {
    const date = new Date(year, month, dayNum)
    const dateStr = date.toISOString().split('T')[0]
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    // Buscar eventos para este día
    const dayEvents = props.events.filter((e) => {
      const eventStart = e.startDate.split('T')[0]
      const eventEnd = e.endDate ? e.endDate.split('T')[0] : eventStart
      return dateStr >= eventStart && dateStr <= eventEnd
    })
    
    const holidayEvent = dayEvents.find((e) => e.type === 'HOLIDAY')
    const examEvent = dayEvents.find((e) => e.type === 'EVALUATION')
    
    days.push({
      day: dayNum,
      date: dateStr,
      isCurrentMonth: true,
      isWeekend,
      isHoliday: !!holidayEvent,
      isExam: !!examEvent,
      events: dayEvents,
      eventCount: dayEvents.length,
      empty: false,
    })
  }
  
  return days
})

// Verificar si un día está seleccionado
function isSelected(date: string): boolean {
  return props.selectedDays.includes(date)
}

// Obtener las clases CSS para un día
function getDayClasses(day: CalendarDay): string {
  if (day.empty) return ''
  
  const baseClasses = props.compact 
    ? 'h-7 text-[10px]' 
    : 'h-8 text-xs'
  
  const isSelectedDay = isSelected(day.date)
  
  // Si hay clase personalizada, usarla
  const customClass = props.dayClass?.(day) || ''
  if (customClass) {
    return `${baseClasses} ${customClass} ${isSelectedDay ? 'ring-2 ring-primary ring-offset-1' : ''}`
  }
  
  // Clases por defecto
  let stateClasses = ''
  
  if (isSelectedDay) {
    stateClasses = 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
  } else if (day.isWeekend && !props.showWeekends) {
    stateClasses = 'bg-muted/30 text-muted-foreground'
  } else if (day.isWeekend) {
    stateClasses = 'bg-gray-100 text-gray-400'
  } else if (day.isHoliday) {
    stateClasses = 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
  } else if (day.isExam) {
    stateClasses = 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200'
  } else if (day.eventCount > 0) {
    stateClasses = 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
  } else {
    stateClasses = 'bg-green-50/50 text-foreground border-transparent hover:bg-green-50'
  }
  
  const interactiveClasses = (!props.readonly && !day.isWeekend && props.selectable)
    ? 'cursor-pointer transition-all'
    : 'cursor-default'
  
  const borderClasses = 'rounded border'
  
  return `${baseClasses} ${stateClasses} ${interactiveClasses} ${borderClasses} flex items-center justify-center relative select-none`
}

// Obtener tooltip para un día
function getDayTooltip(day: CalendarDay): string {
  if (day.empty) return ''
  if (day.isWeekend) return 'Fin de semana'
  if (day.events.length > 0) {
    return day.events.map((e) => e.title).join(', ')
  }
  return day.date
}

// Handlers de eventos
function handleDayClick(day: CalendarDay) {
  if (props.readonly || day.empty || (day.isWeekend && !props.selectable)) return
  emit('day-click', day.date, day)
}

function handleMouseDown(day: CalendarDay) {
  if (props.readonly || day.empty || (day.isWeekend && !props.selectable)) return
  emit('day-mousedown', day.date, day)
}

function handleMouseEnter(day: CalendarDay) {
  if (props.readonly || day.empty || (day.isWeekend && !props.selectable)) return
  emit('day-mouseenter', day.date, day)
}

function handleMouseUp(day: CalendarDay) {
  if (props.readonly || day.empty) return
  emit('day-mouseup', day.date, day)
}

// Exponer información útil para el padre
defineExpose({
  monthName,
  days,
  year: props.year,
  month: props.month,
})
</script>

<template>
  <Card class="overflow-hidden p-0 gap-0 h-full" :class="{ 'text-xs': compact }">
    <!-- Header del mes -->
    <div 
      class="py-3 px-4 bg-muted/50 border-b"
      :class="{ 'py-2': compact }"
    >
      <div 
        class="font-semibold capitalize text-center leading-none"
        :class="compact ? 'text-sm' : 'text-base'"
      >
        {{ monthName }} {{ year }}
      </div>
    </div>
    
    <!-- Contenido del calendario -->
    <CardContent :class="compact ? 'p-2' : 'p-3'">
      <!-- Cabecera días de semana -->
      <div 
        class="grid grid-cols-7 gap-1 mb-1"
        :class="{ 'gap-0.5': compact }"
      >
        <div 
          v-for="day in weekDays" 
          :key="day"
          class="text-center font-medium text-muted-foreground"
          :class="compact ? 'text-[10px] py-0.5' : 'text-xs py-1'"
          :title="weekDaysFull[weekDays.indexOf(day)]"
        >
          {{ day }}
        </div>
      </div>
      
      <!-- Grid de días -->
      <div 
        class="grid grid-cols-7 gap-1"
        :class="{ 'gap-0.5': compact }"
      >
        <template v-for="(day, index) in days" :key="index">
          <!-- Día vacío (relleno) -->
          <div
            v-if="day.empty"
            :class="compact ? 'h-7' : 'h-8'"
          />
          
          <!-- Día del mes -->
          <button
            v-else
            type="button"
            :class="getDayClasses(day)"
            :title="getDayTooltip(day)"
            :disabled="readonly || (day.isWeekend && !selectable)"
            @click="handleDayClick(day)"
            @mousedown="handleMouseDown(day)"
            @mouseenter="handleMouseEnter(day)"
            @mouseup="handleMouseUp(day)"
          >
            {{ day.day }}
            
            <!-- Indicadores de eventos (puntos) -->
            <div 
              v-if="showEventIndicators && day.eventCount > 0 && !isSelected(day.date)" 
              class="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5"
            >
              <div 
                v-for="n in Math.min(day.eventCount, 3)" 
                :key="n"
                class="rounded-full bg-current opacity-60"
                :class="compact ? 'w-0.5 h-0.5' : 'w-1 h-1'"
              />
            </div>
          </button>
        </template>
      </div>
    </CardContent>
  </Card>
</template>
