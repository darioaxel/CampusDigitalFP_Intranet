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
          @click="clearDayFormat" 
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
                    @click="deleteEvent(event)"
                  >
                    <Icon name="lucide:trash-2" class="h-3 w-3" />
                  </Button>
                </div>
              </template>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Grid de meses (ancho completo) -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        <Card v-for="month in months" :key="month.key" class="overflow-hidden p-0 gap-0">
          <div class="py-3 px-4 bg-muted/50">
            <div class="text-base font-semibold capitalize text-center leading-none">{{ month.name }} {{ month.year }}</div>
          </div>
          <CardContent class="p-3">
            <!-- Cabecera días de semana -->
            <div class="grid grid-cols-7 gap-1 mb-1">
              <div 
                v-for="day in weekDays" 
                :key="day"
                class="text-center text-xs font-medium text-muted-foreground py-1"
              >
                {{ day }}
              </div>
            </div>
            
            <!-- Días del mes -->
            <div class="grid grid-cols-7 gap-1">
              <template v-for="(day, index) in month.days" :key="index">
                <div
                  v-if="day.empty"
                  class="h-8"
                />
                <button
                  v-else
                  @click="toggleDay(day)"
                  @mousedown="startDrag(day)"
                  @mouseenter="dragOver(day)"
                  @mouseup="endDrag"
                  :class="[
                    getDayClasses(day),
                    selectedDays.includes(day.date) ? 'ring-2 ring-blue-600 ring-offset-1' : ''
                  ]"
                  :title="getDayTooltip(day)"
                  class="h-8 text-xs rounded flex items-center justify-center transition-all cursor-pointer select-none relative"
                >
                  {{ day.day }}
                  <!-- Indicador de eventos -->
                  <div v-if="day.eventCount > 0" class="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    <div 
                      v-for="n in Math.min(day.eventCount, 3)" 
                      :key="n"
                      class="w-1 h-1 rounded-full bg-current opacity-60"
                    />
                  </div>
                </button>
              </template>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>

    <!-- Modal: Marcar como exámenes -->
    <Dialog v-model:open="showExamModal">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>Marcar como Periodo de Exámenes</DialogTitle>
          <DialogDescription>
            Se marcarán {{ selectedDays.length }} días como periodo de evaluación
          </DialogDescription>
        </DialogHeader>
        
        <form @submit.prevent="markAsExams" class="space-y-4">
          <div class="space-y-2">
            <Label for="examType">Tipo de evaluación</Label>
            <Input 
              id="examType" 
              v-model="examForm.type" 
              placeholder="Ej: DAM/DAW, junio 1, extraordinarios..."
              required
            />
            <p class="text-xs text-muted-foreground">
              Este texto se mostrará en el título del evento
            </p>
          </div>
          
          <div class="space-y-2">
            <Label for="examDescription">Descripción (opcional)</Label>
            <Textarea 
              id="examDescription" 
              v-model="examForm.description" 
              placeholder="Detalles adicionales..."
              rows="2"
            />
          </div>
          
          <div class="bg-muted p-3 rounded text-sm">
            <p class="font-medium mb-1">Días seleccionados:</p>
            <p class="text-muted-foreground">
              {{ selectedDaysText }}
            </p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" @click="showExamModal = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="saving">
              <Loader2 v-if="saving" class="h-4 w-4 mr-2 animate-spin" />
              Marcar como exámenes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal: Crear/Editar Evento -->
    <Dialog v-model:open="showEventModal">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ editingEvent ? 'Editar Evento' : 'Nuevo Evento' }}</DialogTitle>
          <DialogDescription>
            {{ editingEvent ? 'Modifica los datos del evento' : 'Añade un nuevo evento al calendario' }}
          </DialogDescription>
        </DialogHeader>
        
        <form @submit.prevent="saveEvent" class="space-y-4">
          <div class="space-y-2">
            <Label for="title">Título</Label>
            <Input 
              id="title" 
              v-model="eventForm.title" 
              placeholder="Día de libre disposición"
              required
            />
          </div>
          
          <div class="space-y-2">
            <Label for="eventDescription">Descripción</Label>
            <Textarea 
              id="eventDescription" 
              v-model="eventForm.description" 
              placeholder="Descripción del evento..."
              rows="2"
            />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="eventType">Tipo</Label>
              <Select v-model="eventForm.type">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOLIDAY">Festivo / No lectivo</SelectItem>
                  <SelectItem value="LECTIVE">Día lectivo</SelectItem>
                  <SelectItem value="EVALUATION">Evaluación</SelectItem>
                  <SelectItem value="FREE_DISPOSITION">Libre Disposición</SelectItem>
                  <SelectItem value="MEETING">Reunión</SelectItem>
                  <SelectItem value="DEADLINE">Fecha límite</SelectItem>
                  <SelectItem value="OTHER">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div class="space-y-2">
              <Label for="color">Color</Label>
              <div class="flex gap-2">
                <Input 
                  id="color" 
                  v-model="eventForm.color" 
                  type="color"
                  class="w-16 h-10 p-1"
                />
                <Input 
                  v-model="eventForm.color" 
                  placeholder="#3b82f6"
                  class="flex-1"
                />
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="eventStartDate">Fecha inicio</Label>
              <Input 
                id="eventStartDate" 
                v-model="eventForm.startDate" 
                type="date"
                required
              />
            </div>
            
            <div class="space-y-2">
              <Label for="eventEndDate">Fecha fin (opcional)</Label>
              <Input 
                id="eventEndDate" 
                v-model="eventForm.endDate" 
                type="date"
              />
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <Switch id="isAllDay" v-model="eventForm.isAllDay" />
              <Label for="isAllDay" class="cursor-pointer">Todo el día</Label>
            </div>
            
            <div class="flex items-center gap-2">
              <Switch id="eventIsActive" v-model="eventForm.isActive" />
              <Label for="eventIsActive" class="cursor-pointer">Activo</Label>
            </div>
          </div>
          
          <div class="space-y-2">
            <Label for="maxAssignments">Máximo de asignaciones (opcional)</Label>
            <Input 
              id="maxAssignments" 
              v-model="eventForm.maxAssignments" 
              type="number"
              min="1"
              placeholder="Sin límite"
            />
            <p class="text-xs text-muted-foreground">
              Para eventos de libre disposición, límite de profesores que pueden seleccionar este día
            </p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" @click="showEventModal = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="saving">
              <Loader2 v-if="saving" class="h-4 w-4 mr-2 animate-spin" />
              {{ editingEvent ? 'Guardar Cambios' : 'Crear Evento' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

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
const editingEvent = ref<any>(null)
const saving = ref(false)

const examForm = reactive({
  type: '',
  description: '',
})

const eventForm = reactive({
  title: '',
  description: '',
  type: 'FREE_DISPOSITION',
  startDate: '',
  endDate: '',
  isAllDay: true,
  startTime: '',
  endTime: '',
  color: '#3b82f6',
  maxAssignments: null as number | null,
  isActive: true,
})

// Fetch calendario
const { data: calendarData, pending, refresh } = useFetch(`/api/calendars/${calendarId}`)
const calendar = computed(() => calendarData.value?.data)
const events = computed(() => calendar.value?.events || [])

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

// Generar meses del curso académico
const months = computed(() => {
  if (!calendar.value) return []
  
  const startDate = new Date(calendar.value.startDate)
  const endDate = new Date(calendar.value.endDate)
  
  const monthsList = []
  let current = new Date(startDate)
  
  while (current <= endDate) {
    const year = current.getFullYear()
    const month = current.getMonth()
    const key = `${year}-${month}`
    const name = current.toLocaleDateString('es-ES', { month: 'long' })
    
    // Generar días del mes
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    // Ajustar para que empiece en lunes
    let startDayOfWeek = firstDay.getDay() - 1
    if (startDayOfWeek < 0) startDayOfWeek = 6
    
    const days = []
    
    // Días vacíos al inicio
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ empty: true })
    }
    
    // Días del mes
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day)
      const dateStr = date.toISOString().split('T')[0]
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      
      // Buscar eventos para este día
      const dayEvents = events.value.filter((e: any) => {
        const eventStart = e.startDate.split('T')[0]
        const eventEnd = e.endDate ? e.endDate.split('T')[0] : eventStart
        return dateStr >= eventStart && dateStr <= eventEnd
      })
      
      const holidayEvent = dayEvents.find((e: any) => e.type === 'HOLIDAY')
      const examEvent = dayEvents.find((e: any) => e.type === 'EVALUATION')
      
      days.push({
        day,
        date: dateStr,
        isWeekend,
        isHoliday: !!holidayEvent,
        isExam: !!examEvent,
        eventTitle: holidayEvent?.title || examEvent?.title || '',
        eventCount: dayEvents.length,
        empty: false
      })
    }
    
    monthsList.push({ key, name, year, days })
    
    current.setMonth(current.getMonth() + 1)
  }
  
  return monthsList
})

const selectedDaysText = computed(() => {
  if (selectedDays.value.length === 0) return 'Ninguno'
  return selectedDays.value
    .sort()
    .map(d => new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }))
    .join(', ')
})

// Helpers
function getDayClasses(day: any) {
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

function getDayTooltip(day: any) {
  if (day.isWeekend) return 'Fin de semana (no laborable)'
  if (day.eventTitle) return day.eventTitle
  if (day.eventCount > 0) return `${day.eventCount} evento(s)`
  return day.date
}

function toggleDay(day: any) {
  if (day.isWeekend) return
  
  if (hasDragged.value) return
  
  const index = selectedDays.value.indexOf(day.date)
  if (index === -1) {
    selectedDays.value.push(day.date)
  } else {
    selectedDays.value.splice(index, 1)
  }
}

function startDrag(day: any) {
  if (day.isWeekend) return
  isDragging.value = true
  hasDragged.value = false
  dragStartDay.value = day.date
}

function dragOver(day: any) {
  if (!isDragging.value || day.isWeekend) return
  
  hasDragged.value = true
  
  if (!selectedDays.value.includes(day.date)) {
    selectedDays.value.push(day.date)
  }
}

function endDrag() {
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
  
  saving.value = true
  try {
    const ranges = groupConsecutiveDates(selectedDays.value.sort())
    
    for (const range of ranges) {
      await $fetch(`/api/calendars/${calendarId}/events`, {
        method: 'POST',
        body: {
          title: 'Festivo',
          type: 'HOLIDAY',
          startDate: range.start,
          endDate: range.end,
          isAllDay: true,
          color: '#EF4444',
          isActive: true
        }
      })
    }
    
    await refresh()
    selectedDays.value = []
    toast.success('Días marcados como festivos')
  } catch (error: any) {
    toast.error(error.data?.message || 'Error al guardar')
  } finally {
    saving.value = false
  }
}

async function markAsExams() {
  if (selectedDays.value.length === 0) return
  
  saving.value = true
  try {
    const ranges = groupConsecutiveDates(selectedDays.value.sort())
    
    for (const range of ranges) {
      await $fetch(`/api/calendars/${calendarId}/events`, {
        method: 'POST',
        body: {
          title: `Evaluación: ${examForm.type}`,
          description: examForm.description,
          type: 'EVALUATION',
          startDate: range.start,
          endDate: range.end,
          isAllDay: true,
          color: '#F59E0B',
          isActive: true
        }
      })
    }
    
    await refresh()
    selectedDays.value = []
    examForm.type = ''
    examForm.description = ''
    showExamModal.value = false
    toast.success('Días marcados como periodo de evaluación')
  } catch (error: any) {
    toast.error(error.data?.message || 'Error al guardar')
  } finally {
    saving.value = false
  }
}

async function clearDayFormat() {
  if (selectedDays.value.length === 0) return
  
  if (!confirm(`¿Eliminar el formato de ${selectedDays.value.length} días seleccionados?`)) return
  
  saving.value = true
  try {
    const eventsToDelete = events.value.filter((event: any) => {
      const eventStart = event.startDate.split('T')[0]
      const eventEnd = event.endDate ? event.endDate.split('T')[0] : eventStart
      
      return selectedDays.value.some((day: string) => {
        return day >= eventStart && day <= eventEnd
      })
    })
    
    for (const event of eventsToDelete) {
      await $fetch(`/api/calendars/${calendarId}/events/${event.id}`, {
        method: 'DELETE'
      })
    }
    
    await refresh()
    selectedDays.value = []
    toast.success('Formato eliminado de los días seleccionados')
  } catch (error: any) {
    toast.error(error.data?.message || 'Error al eliminar el formato')
  } finally {
    saving.value = false
  }
}

// CRUD de eventos individuales
function openCreateEventModal() {
  editingEvent.value = null
  resetEventForm()
  showEventModal.value = true
}

function resetEventForm() {
  eventForm.title = ''
  eventForm.description = ''
  eventForm.type = 'FREE_DISPOSITION'
  eventForm.startDate = selectedDays.value[0] || ''
  eventForm.endDate = ''
  eventForm.isAllDay = true
  eventForm.startTime = ''
  eventForm.endTime = ''
  eventForm.color = '#3b82f6'
  eventForm.maxAssignments = null
  eventForm.isActive = true
}

function editEvent(event: any) {
  editingEvent.value = event
  eventForm.title = event.title
  eventForm.description = event.description || ''
  eventForm.type = event.type
  eventForm.startDate = event.startDate.split('T')[0]
  eventForm.endDate = event.endDate ? event.endDate.split('T')[0] : ''
  eventForm.isAllDay = event.isAllDay
  eventForm.startTime = event.startTime || ''
  eventForm.endTime = event.endTime || ''
  eventForm.color = event.color || '#3b82f6'
  eventForm.maxAssignments = event.maxAssignments
  eventForm.isActive = event.isActive
  showEventModal.value = true
}

async function saveEvent() {
  saving.value = true
  
  try {
    const payload = {
      ...eventForm,
      maxAssignments: eventForm.maxAssignments ? parseInt(eventForm.maxAssignments as any) : undefined,
    }
    
    if (editingEvent.value) {
      await $fetch(`/api/calendars/${calendarId}/events/${editingEvent.value.id}`, {
        method: 'PUT',
        body: payload,
      })
      toast.success('Evento actualizado correctamente')
    } else {
      await $fetch(`/api/calendars/${calendarId}/events`, {
        method: 'POST',
        body: payload,
      })
      toast.success('Evento creado correctamente')
    }
    
    await refresh()
    showEventModal.value = false
    editingEvent.value = null
    resetEventForm()
  } catch (error: any) {
    toast.error(error.data?.message || `Error al ${editingEvent.value ? 'actualizar' : 'crear'} el evento`)
  } finally {
    saving.value = false
  }
}

async function deleteEvent(event: any) {
  if (!confirm(`¿Eliminar el evento "${event.title}"?`)) return
  
  try {
    await $fetch(`/api/calendars/${calendarId}/events/${event.id}`, {
      method: 'DELETE'
    })
    await refresh()
    toast.success('Evento eliminado correctamente')
  } catch (error: any) {
    toast.error(error.data?.message || 'Error al eliminar el evento')
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
