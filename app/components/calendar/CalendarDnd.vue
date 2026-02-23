<script setup lang="ts">
import { computed, ref } from 'vue'
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
  isDraggable?: boolean
}

interface UserAssignment {
  id: string
  eventId: string
  title: string
  startDate: string
  endDate?: string | null
  color?: string | null
  order: number
}

interface Props {
  events: CalendarEvent[]
  userAssignments?: UserAssignment[]
  maxAssignments?: number
  allowDragFromCalendar?: boolean
  allowDropToCalendar?: boolean
  readOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  userAssignments: () => [],
  maxAssignments: 4,
  allowDragFromCalendar: false,
  allowDropToCalendar: true,
  readOnly: false,
})

const emit = defineEmits<{
  'assign': [eventId: string]
  'unassign': [assignmentId: string]
  'event-click': [eventId: string]
}>()

// Estado de selección (alternativa a drag-drop nativo)
const selectedEvent = ref<CalendarEvent | null>(null)

// Transformar eventos del calendario para ScheduleX
const calendarEvents = computed(() => {
  return props.events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    color: event.color || '#3b82f6',
    description: event.description,
  }))
})

// Crear instancia del calendario
const calendarApp = computed(() => {
  return createCalendar({
    views: [createViewMonthGrid()],
    defaultView: 'month-grid',
    locale: 'es-ES',
    firstDayOfWeek: 1,
    monthGridOptions: {
      nEventsPerDay: 4,
    },
    events: calendarEvents.value,
    plugins: [createEventModalPlugin()],
    callbacks: {
      onEventClick: (event: any) => {
        selectedEvent.value = event
        emit('event-click', event.id)
      },
      onClickDate: (date: string) => {
        // Buscar evento en esa fecha
        const eventOnDate = props.events.find(e => e.start === date)
        if (eventOnDate && props.allowDragFromCalendar && !props.readOnly) {
          selectedEvent.value = eventOnDate
        }
      },
    },
  })
})

// Handler para asignar evento seleccionado
function handleAssignSelected() {
  if (!selectedEvent.value || props.readOnly) return
  emit('assign', selectedEvent.value.id)
  selectedEvent.value = null
}

// Handler para quitar asignación
function handleUnassign(assignmentId: string) {
  if (props.readOnly) return
  emit('unassign', assignmentId)
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
    <!-- Calendario principal -->
    <div class="lg:col-span-3">
      <div class="rounded-lg border border-border bg-card overflow-hidden">
        <ScheduleXCalendar :calendar-app="calendarApp" />
      </div>
      
      <!-- Leyenda -->
      <div class="flex flex-wrap gap-4 mt-4 text-sm">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Disponible para asignar</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Ya asignado</span>
        </div>
      </div>

      <!-- Botón de asignación rápida (alternativa a drag-drop) -->
      <div v-if="selectedEvent && allowDragFromCalendar && !readOnly" class="mt-4 p-4 bg-muted rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium">Evento seleccionado: {{ selectedEvent.title }}</p>
            <p class="text-xs text-muted-foreground">{{ selectedEvent.start }}</p>
          </div>
          <Button size="sm" @click="handleAssignSelected">
            <Icon name="lucide:plus" class="h-4 w-4 mr-1" />
            Asignar
          </Button>
        </div>
      </div>
    </div>

    <!-- Panel de asignaciones del usuario -->
    <div class="lg:col-span-1">
      <Card class="h-full">
        <CardHeader class="pb-3">
          <CardTitle class="text-lg flex items-center justify-between">
            <span>Mis Días</span>
            <Badge variant="secondary" class="text-xs">
              {{ userAssignments.length }}/{{ maxAssignments }}
            </Badge>
          </CardTitle>
          <CardDescription>
            {{ allowDropToCalendar && !readOnly 
              ? 'Haz clic en un día y luego "Asignar"' 
              : 'Tus días asignados' }}
          </CardDescription>
        </CardHeader>
        
        <CardContent class="space-y-3">
          <!-- Lista de asignaciones -->
          <div v-if="userAssignments.length === 0" class="text-center py-8 text-muted-foreground">
            <Icon name="lucide:calendar-plus" class="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p class="text-sm">No tienes días asignados</p>
            <p v-if="allowDropToCalendar && !readOnly" class="text-xs mt-1">
              Selecciona un día en el calendario
            </p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="assignment in userAssignments"
              :key="assignment.id"
              class="group relative p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
              :style="{ borderLeftColor: assignment.color || '#22c55e', borderLeftWidth: '4px' }"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <Badge variant="outline" class="text-xs shrink-0">
                      {{ assignment.order }}º
                    </Badge>
                    <p class="font-medium text-sm truncate">{{ assignment.title }}</p>
                  </div>
                  <p class="text-xs text-muted-foreground mt-1">
                    {{ new Date(assignment.startDate).toLocaleDateString('es-ES', { 
                      day: 'numeric', 
                      month: 'short' 
                    }) }}
                  </p>
                </div>
                
                <Button
                  v-if="!readOnly"
                  variant="ghost"
                  size="sm"
                  class="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  @click="handleUnassign(assignment.id)"
                >
                  <Icon name="lucide:x" class="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>

          <!-- Indicador de capacidad -->
          <div v-if="!readOnly" class="pt-2">
            <div class="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progreso</span>
              <span>{{ Math.round((userAssignments.length / maxAssignments) * 100) }}%</span>
            </div>
            <div class="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                class="h-full bg-primary transition-all duration-300"
                :style="{ width: `${(userAssignments.length / maxAssignments) * 100}%` }"
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<style scoped>
:deep(.sx__calendar) {
  --sx-color-primary: hsl(var(--primary));
  --sx-color-on-primary: hsl(var(--primary-foreground));
  --sx-color-surface: hsl(var(--card));
  --sx-color-on-surface: hsl(var(--card-foreground));
  --sx-color-background: hsl(var(--background));
  --sx-color-on-background: hsl(var(--foreground));
  --sx-border-color: hsl(var(--border));
  --sx-color-text: hsl(var(--foreground));
  --sx-color-text-muted: hsl(var(--muted-foreground));
}

:deep(.sx__month-grid-day) {
  min-height: 100px;
}

:deep(.sx__event) {
  border-radius: 4px;
  font-size: 11px;
  padding: 2px 6px;
  cursor: pointer;
}

:deep(.sx__event:hover) {
  opacity: 0.9;
}

:deep(.sx__event--selected) {
  ring: 2px;
  ring-color: hsl(var(--primary));
}
</style>
