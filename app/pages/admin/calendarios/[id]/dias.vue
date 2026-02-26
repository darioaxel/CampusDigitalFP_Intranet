<!-- pages/admin/calendarios/[id]/dias.vue -->
<template>
  <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <NuxtLink to="/admin/calendarios">
            <Button variant="ghost" size="sm">
              <Icon name="lucide:arrow-left" class="h-4 w-4 mr-1" />
              Volver
            </Button>
          </NuxtLink>
        </div>
        <h1 class="text-2xl font-bold">Editar Días: {{ calendar?.name }}</h1>
        <p class="text-muted-foreground text-sm">
          Selecciona múltiples días para marcarlos como festivos o periodo de exámenes
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
      </div>
    </div>

    <!-- Info -->
    <Card class="bg-muted/50">
      <CardContent class="py-4">
        <div class="flex items-center gap-6 text-sm flex-wrap">
          <div class="flex items-center gap-2">
            <Icon name="lucide:calendar" class="h-4 w-4 text-muted-foreground" />
            <span>{{ calendar?.academicYear }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="lucide:clock" class="h-4 w-4 text-muted-foreground" />
            <span>{{ formatDateRange(calendar?.startDate, calendar?.endDate) }}</span>
          </div>
          <div class="flex items-center gap-4 ml-auto">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded bg-gray-200 border border-gray-300"></div>
              <span class="text-muted-foreground">Fin de semana</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
              <span class="text-muted-foreground">Festivo</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded bg-amber-100 border border-amber-300"></div>
              <span class="text-muted-foreground">Exámenes</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
              <span class="text-muted-foreground">Día lectivo</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded bg-blue-500 border border-blue-600"></div>
              <span class="text-muted-foreground">Seleccionado</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      <span class="ml-2 text-muted-foreground">Cargando calendario...</span>
    </div>

    <template v-else>
      <!-- Grid de meses -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <Card v-for="month in months" :key="month.key" class="overflow-hidden">
          <CardHeader class="py-3 px-4 bg-muted/50">
            <CardTitle class="text-base capitalize">{{ month.name }} {{ month.year }}</CardTitle>
          </CardHeader>
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
                  class="h-8 text-xs rounded flex items-center justify-center transition-all cursor-pointer select-none"
                >
                  {{ day.day }}
                </button>
              </template>
            </div>
          </CardContent>
        </Card>
      </div>

    </template>

    <!-- Modal para marcar como exámenes -->
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

const route = useRoute()
const calendarId = route.params.id as string

// Estado
const selectedDays = ref<string[]>([])
const isDragging = ref(false)
const hasDragged = ref(false)
const dragStartDay = ref<string | null>(null)
const showExamModal = ref(false)
const saving = ref(false)

const examForm = reactive({
  type: '',
  description: '',
})

// Fetch calendario
const { data: calendarData, pending, refresh } = await useFetch(`/api/calendars/${calendarId}`)
const calendar = computed(() => calendarData.value?.data)
const events = computed(() => calendar.value?.events || [])

const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

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
      
      // Buscar si hay evento para este día
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
  return day.date
}

// Selección de días - click simple
function toggleDay(day: any) {
  if (day.isWeekend) return
  
  // Si estamos arrastrando, no hacer toggle (ya se maneja en dragOver)
  if (hasDragged.value) return
  
  const index = selectedDays.value.indexOf(day.date)
  if (index === -1) {
    selectedDays.value.push(day.date)
  } else {
    selectedDays.value.splice(index, 1)
  }
}

// Drag selection
function startDrag(day: any) {
  if (day.isWeekend) return
  isDragging.value = true
  hasDragged.value = false
  dragStartDay.value = day.date
  // No añadir aquí, esperar a dragOver o click
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
  // Reset hasDragged después de un pequeño delay para permitir el click
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
    // Agrupar días consecutivos
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
    // Agrupar días consecutivos
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
    // Encontrar eventos que contengan los días seleccionados
    const eventsToDelete = events.value.filter((event: any) => {
      const eventStart = event.startDate.split('T')[0]
      const eventEnd = event.endDate ? event.endDate.split('T')[0] : eventStart
      
      // Verificar si algún día seleccionado está dentro de este evento
      return selectedDays.value.some((day: string) => {
        return day >= eventStart && day <= eventEnd
      })
    })
    
    // Eliminar los eventos encontrados
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

async function deleteEvent(event: any) {
  if (!confirm(`¿Eliminar el evento "${event.title}"?`)) return
  
  try {
    await $fetch(`/api/calendars/${calendarId}/events/${event.id}`, {
      method: 'DELETE'
    })
    await refresh()
    toast.success('Evento eliminado')
  } catch (error: any) {
    toast.error(error.data?.message || 'Error al eliminar')
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
      // Consecutivo
      end = dates[i]
    } else {
      // No consecutivo, guardar rango anterior
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
</script>
