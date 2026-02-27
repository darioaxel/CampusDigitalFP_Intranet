<!-- pages/admin/calendarios/[id]/dias.vue - Vista unificada de días y eventos -->
<template>
  <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="sm" as-child>
            <NuxtLink to="/admin/calendarios">
              <Icon name="lucide:arrow-left" class="h-4 w-4 mr-1" />
              Volver
            </NuxtLink>
          </Button>
        </div>
        <h1 class="text-2xl font-bold">{{ calendar?.name }}</h1>
        <p class="text-muted-foreground text-sm">
          Selecciona días para crear eventos o gestiona los eventos existentes
        </p>
      </div>
      
      <div class="flex gap-2">
        <Button 
          variant="outline" 
          @click="clearSelection"
          :disabled="selectedDays.length === 0"
        >
          <Icon name="lucide:x" class="h-4 w-4 mr-2" />
          Limpiar ({{ selectedDays.length }})
        </Button>
        <Button 
          variant="secondary"
          @click="openClearFormatModal" 
          :disabled="selectedDays.length === 0"
        >
          <Icon name="lucide:eraser" class="h-4 w-4 mr-2" />
          Borrar formato
        </Button>
        <Button 
          @click="markAsHolidays" 
          :disabled="selectedDays.length === 0"
          variant="destructive"
        >
          <Icon name="lucide:calendar-x" class="h-4 w-4 mr-2" />
          Festivos
        </Button>
        <Button 
          @click="showExamModal = true" 
          :disabled="selectedDays.length === 0"
        >
          <Icon name="lucide:graduation-cap" class="h-4 w-4 mr-2" />
          Exámenes
        </Button>
        <Button 
          @click="openCreateEventModal"
          variant="default"
        >
          <Icon name="lucide:plus" class="h-4 w-4 mr-2" />
          Nuevo Evento
        </Button>
      </div>
    </div>

    <!-- Info básica del calendario con leyenda -->
    <div class="flex items-center gap-6 text-xs text-muted-foreground flex-wrap">
      <div class="flex items-center gap-1.5">
        <Icon name="lucide:calendar" class="h-3 w-3" />
        <span>{{ calendar?.academicYear }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <Icon name="lucide:clock" class="h-3 w-3" />
        <span>{{ formatDateRange(calendar?.startDate, calendar?.endDate) }}</span>
      </div>
      <div v-if="calendar?.allowDragDrop" class="flex items-center gap-1.5">
        <Icon name="lucide:mouse-pointer-click" class="h-3 w-3" />
        <span>Drag-drop habilitado</span>
      </div>
      <div class="flex items-center gap-3 ml-auto">
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded bg-gray-200 border border-gray-300"></div>
          <span>Fin de semana</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
          <span>Festivo</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded bg-amber-100 border border-amber-300"></div>
          <span>Exámenes</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
          <span>Día lectivo</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded bg-blue-500 border border-blue-600"></div>
          <span>Seleccionado</span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      <span class="ml-2 text-muted-foreground">Cargando calendario...</span>
    </div>

    <template v-else>
      <!-- Card de eventos del día seleccionado (ancho completo, compacto) -->
      <Card v-if="selectedDays.length === 1" class="bg-muted/30">
        <CardContent class="py-3 px-4">
          <div class="flex items-center gap-4">
            <div class="font-semibold text-sm whitespace-nowrap">
              {{ formatDate(selectedDays[0]) }}
            </div>
            <div class="flex-1 flex items-center gap-3 overflow-x-auto">
              <template v-if="selectedDayEvents.length === 0">
                <span class="text-sm text-muted-foreground">No hay eventos en este día</span>
              </template>
              <template v-else>
                <div 
                  v-for="event in selectedDayEvents" 
                  :key="event.id"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border text-xs whitespace-nowrap"
                >
                  <div 
                    class="w-2 h-2 rounded-full flex-shrink-0"
                    :style="{ backgroundColor: event.color || '#3b82f6' }"
                  />
                  <span class="font-medium">{{ event.title }}</span>
                  <span class="text-muted-foreground">· {{ getEventTypeLabel(event.type) }}</span>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    class="h-5 w-5 ml-1 -mr-1"
                    @click="editEvent(event)"
                  >
                    <Icon name="lucide:pencil" class="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    class="h-5 w-5 -mr-1 text-destructive"
                    @click="openDeleteEventModal(event)"
                  >
                    <Icon name="lucide:trash-2" class="h-3 w-3" />
                  </Button>
                </div>
              </template>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Grid de meses usando el componente CalendarMonthGrid -->
      <CalendarMonthGrid
        ref="monthGridRef"
        :start-date="calendar?.startDate"
        :end-date="calendar?.endDate"
        :events="events"
        :selectable="true"
        :show-weekends="true"
        :show-event-indicators="true"
        :columns="4"
        :day-class="getDayClass"
        @day-click="handleDayClick"
        @day-mousedown="handleDayMouseDown"
        @day-mouseenter="handleDayMouseEnter"
        @day-mouseup="handleDayMouseUp"
      />
    </template>

    <!-- Modal: Marcar como exámenes -->
    <ExamPeriodDialog
      v-model:open="showExamModal"
      :selected-days-count="selectedDays.length"
      :selected-days-text="selectedDaysText"
      :loading="isLoading"
      @submit="handleExamSubmit"
    />

    <!-- Modal: Crear/Editar Evento -->
    <EventFormDialog
      v-model:open="showEventModal"
      :event="editingEvent"
      :default-start-date="selectedDays[0]"
      :loading="isLoading"
      @submit="handleEventSubmit"
    />

    <!-- Modal: Confirmar eliminar formato de días -->
    <ConfirmDialog
      v-model:open="showClearFormatModal"
      title="Confirmar eliminación"
      icon="lucide:alert-triangle"
      icon-class="text-amber-500"
      confirm-text="Eliminar formato"
      confirm-variant="destructive"
      :loading="isLoading"
      @confirm="confirmClearDayFormat"
    >
      <template #description>
        ¿Estás seguro de que deseas eliminar el formato de {{ selectedDays.length }} días seleccionados?
        Esta acción eliminará todos los eventos asociados a estos días y no se puede deshacer.
      </template>
      <div class="bg-muted p-3 rounded-lg text-sm mt-4">
        <p class="font-medium mb-1">Días afectados:</p>
        <p class="text-muted-foreground">{{ selectedDaysText }}</p>
      </div>
    </ConfirmDialog>

    <!-- Modal: Confirmar eliminar evento -->
    <ConfirmDialog
      v-model:open="showDeleteEventModal"
      title="Eliminar evento"
      description="¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer."
      icon="lucide:trash-2"
      icon-class="text-destructive"
      confirm-text="Eliminar"
      confirm-variant="destructive"
      :loading="isLoading"
      @confirm="confirmDeleteEvent"
    >
      <div class="bg-muted p-3 rounded-lg text-sm mt-4">
        <p class="font-medium mb-1">Evento a eliminar:</p>
        <p class="text-muted-foreground">{{ eventToDelete?.title }}</p>
      </div>
    </ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { CalendarDay } from '~/components/calendar/CalendarMonthCard.vue'
import ConfirmDialog from '~/components/calendar/dialogs/ConfirmDialog.vue'
import EventFormDialog from '~/components/calendar/dialogs/EventFormDialog.vue'
import ExamPeriodDialog from '~/components/calendar/dialogs/ExamPeriodDialog.vue'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
  roles: ['ADMIN', 'ROOT'],
})

const route = useRoute()
const calendarId = route.params.id as string

// Estado
const selectedDays = ref<string[]>([])
const isDragging = ref(false)
const hasDragged = ref(false)
const dragStartDay = ref<string | null>(null)
const showExamModal = ref(false)
const showEventModal = ref(false)
const showClearFormatModal = ref(false)
const showDeleteEventModal = ref(false)
const editingEvent = ref<any>(null)
const eventToDelete = ref<any>(null)
// Composables de API
const { calendar, events, pending, refresh } = useCalendarData(calendarId)
const { 
  createHolidayEvents, 
  createExamEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  isLoading 
} = useCalendarApi(calendarId)

const examForm = reactive({
  type: '',
  description: '',
})

// Referencia al componente CalendarMonthGrid
const monthGridRef = ref<InstanceType<typeof CalendarMonthGrid> | null>(null)

const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// Eventos ordenados por fecha
const sortedEvents = computed(() => {
  return [...events.value].sort((a: any, b: any) => {
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  })
})

// Eventos del día seleccionado (solo cuando hay exactamente 1 día seleccionado)
const selectedDayEvents = computed(() => {
  if (selectedDays.value.length !== 1) return []
  const selectedDate = selectedDays.value[0]
  
  return events.value.filter((event: any) => {
    const eventStart = event.startDate.split('T')[0]
    const eventEnd = event.endDate ? event.endDate.split('T')[0] : eventStart
    return selectedDate >= eventStart && selectedDate <= eventEnd
  })
})



const selectedDaysText = computed(() => {
  if (selectedDays.value.length === 0) return 'Ninguno'
  return selectedDays.value
    .sort()
    .map(d => new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }))
    .join(', ')
})



// Helpers - Clase CSS personalizada para los días
function getDayClass(day: CalendarDay): string {
  const isSelected = selectedDays.value.includes(day.date)
  
  if (isSelected) {
    return 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600'
  }
  
  if (day.isWeekend) {
    return 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
  }
  
  if (day.isHoliday) {
    return 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'
  }
  
  if (day.isExam) {
    return 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200'
  }
  
  return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
}

function getDayTooltip(day: CalendarDay): string {
  if (day.isWeekend) return 'Fin de semana (no laborable)'
  if (day.events.length > 0) {
    const holiday = day.events.find((e: any) => e.type === 'HOLIDAY')
    const exam = day.events.find((e: any) => e.type === 'EVALUATION')
    return holiday?.title || exam?.title || `${day.events.length} evento(s)`
  }
  return day.date
}

// Handlers para eventos del CalendarMonthGrid
function handleDayClick(date: string, day: CalendarDay) {
  if (day.isWeekend) return
  
  if (hasDragged.value) return
  
  const index = selectedDays.value.indexOf(date)
  if (index === -1) {
    selectedDays.value.push(date)
  } else {
    selectedDays.value.splice(index, 1)
  }
}

function handleDayMouseDown(date: string, day: CalendarDay) {
  if (day.isWeekend) return
  isDragging.value = true
  hasDragged.value = false
  dragStartDay.value = date
}

function handleDayMouseEnter(date: string, day: CalendarDay) {
  if (!isDragging.value || day.isWeekend) return
  
  hasDragged.value = true
  
  if (!selectedDays.value.includes(date)) {
    selectedDays.value.push(date)
  }
}

function handleDayMouseUp() {
  isDragging.value = false
  dragStartDay.value = null
  setTimeout(() => {
    hasDragged.value = false
  }, 50)
}

function clearSelection() {
  selectedDays.value = []
}

async function markAsHolidays() {
  if (selectedDays.value.length === 0) return
  
  try {
    const ranges = groupConsecutiveDates(selectedDays.value.sort())
    await createHolidayEvents(ranges)
    
    await refresh()
    selectedDays.value = []
    toast.success('Días marcados como festivos')
  } catch (error: any) {
    toast.error(error.data?.message || 'Error al guardar')
  }
}

async function handleExamSubmit(data: { type: string; description: string }) {
  if (selectedDays.value.length === 0) return
  
  try {
    const ranges = groupConsecutiveDates(selectedDays.value.sort())
    await createExamEvents(ranges, data.type, data.description)
    
    await refresh()
    selectedDays.value = []
    showExamModal.value = false
    toast.success('Días marcados como periodo de evaluación')
  } catch (error: any) {
    toast.error(error.data?.message || 'Error al guardar')
  }
}

function openClearFormatModal() {
  if (selectedDays.value.length === 0) return
  showClearFormatModal.value = true
}

async function confirmClearDayFormat() {
  showClearFormatModal.value = false
  
  try {
    const eventsToDelete = events.value.filter((event: any) => {
      const eventStart = event.startDate.split('T')[0]
      const eventEnd = event.endDate ? event.endDate.split('T')[0] : eventStart
      
      return selectedDays.value.some((day: string) => {
        return day >= eventStart && day <= eventEnd
      })
    })
    
    for (const event of eventsToDelete) {
      await deleteEvent(event.id)
    }
    
    await refresh()
    selectedDays.value = []
    toast.success('Formato eliminado de los días seleccionados')
  } catch (error: any) {
    toast.error(error.data?.message || 'Error al eliminar el formato')
  }
}

// CRUD de eventos individuales
function openCreateEventModal() {
  editingEvent.value = null
  showEventModal.value = true
}

function editEvent(event: any) {
  editingEvent.value = event
  showEventModal.value = true
}

async function handleEventSubmit(payload: any) {
  try {
    if (editingEvent.value) {
      await updateEvent(editingEvent.value.id, payload)
      toast.success('Evento actualizado correctamente')
    } else {
      await createEvent(payload)
      toast.success('Evento creado correctamente')
    }
    
    await refresh()
    showEventModal.value = false
    editingEvent.value = null
  } catch (error: any) {
    toast.error(error.data?.message || `Error al ${editingEvent.value ? 'actualizar' : 'crear'} el evento`)
  }
}

function openDeleteEventModal(event: any) {
  eventToDelete.value = event
  showDeleteEventModal.value = true
}

async function confirmDeleteEvent() {
  if (!eventToDelete.value) return
  showDeleteEventModal.value = false
  
  try {
    await deleteEvent(eventToDelete.value.id)
    await refresh()
    toast.success('Evento eliminado correctamente')
  } catch (error: any) {
    toast.error(error.data?.message || 'Error al eliminar el evento')
  } finally {
    eventToDelete.value = null
  }
}

function groupConsecutiveDates(dates: string[]): { start: string, end: string }[] {
  if (dates.length === 0) return []
  
  const ranges = []
  let start = dates[0]
  let end = dates[0]
  
  for (let i = 1; i < dates.length; i++) {
    const current = new Date(dates[i])
    const previous = new Date(dates[i - 1])
    const diffTime = current.getTime() - previous.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    
    if (diffDays === 1) {
      end = dates[i]
    } else {
      ranges.push({ start, end })
      start = dates[i]
      end = dates[i]
    }
  }
  
  ranges.push({ start, end })
  return ranges
}

function formatDateRange(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${startDate.toLocaleDateString('es-ES')} - ${endDate.toLocaleDateString('es-ES')}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })
}

function formatEventDate(event: any) {
  const start = new Date(event.startDate).toLocaleDateString('es-ES')
  if (event.endDate && event.endDate !== event.startDate) {
    const end = new Date(event.endDate).toLocaleDateString('es-ES')
    return `${start} al ${end}`
  }
  return start
}

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
</script>
