<!-- pages/admin/calendarios/[id]/eventos.vue -->
<template>
  <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="sm" @click="navigateTo('/admin/calendarios')">
            <Icon name="lucide:arrow-left" class="h-4 w-4 mr-1" />
            Volver
          </Button>
        </div>
        <h1 class="text-2xl font-bold">{{ calendar?.name }}</h1>
        <p class="text-muted-foreground text-sm">
          Gestiona los eventos de este calendario
        </p>
      </div>
      
      <Button @click="showCreateModal = true">
        <Icon name="lucide:plus" class="h-4 w-4 mr-2" />
        Nuevo Evento
      </Button>
    </div>

    <!-- Info del calendario -->
    <Card class="bg-muted/50">
      <CardContent class="py-4">
        <div class="flex items-center gap-6 text-sm">
          <div class="flex items-center gap-2">
            <Icon name="lucide:calendar" class="h-4 w-4 text-muted-foreground" />
            <span>{{ calendar?.academicYear }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="lucide:clock" class="h-4 w-4 text-muted-foreground" />
            <span>{{ formatDateRange(calendar?.startDate, calendar?.endDate) }}</span>
          </div>
          <div v-if="calendar?.allowDragDrop" class="flex items-center gap-2">
            <Icon name="lucide:mouse-pointer-click" class="h-4 w-4 text-muted-foreground" />
            <span>Drag-drop habilitado</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      <span class="ml-2 text-muted-foreground">Cargando eventos...</span>
    </div>

    <template v-else>
      <!-- Vista previa del calendario -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="text-lg">Vista Previa</CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarView 
            :events="calendarEvents"
            @event-click="viewEventDetails"
          />
        </CardContent>
      </Card>

      <!-- Lista de eventos -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="text-lg">Eventos ({{ events?.length || 0 }})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Asignaciones</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead class="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="event in events" :key="event.id">
                <TableCell>
                  <div class="flex items-center gap-2">
                    <div 
                      class="w-3 h-3 rounded-full" 
                      :style="{ backgroundColor: event.color || '#3b82f6' }"
                    ></div>
                    <div>
                      <div class="font-medium">{{ event.title }}</div>
                      <div class="text-xs text-muted-foreground truncate max-w-[200px]">
                        {{ event.description || 'Sin descripción' }}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge :variant="getEventTypeVariant(event.type)" class="text-xs">
                    {{ getEventTypeLabel(event.type) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div class="text-sm">
                    {{ formatEventDate(event) }}
                  </div>
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-1">
                    <Icon name="lucide:users" class="h-3 w-3 text-muted-foreground" />
                    <span class="text-sm">
                      {{ event._count?.assignments || 0 }}
                      <span v-if="event.maxAssignments">/ {{ event.maxAssignments }}</span>
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge :variant="event.isActive ? 'default' : 'secondary'" class="text-xs">
                    {{ event.isActive ? 'Activo' : 'Inactivo' }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      @click="editEvent(event)"
                    >
                      <Icon name="lucide:pencil" class="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      class="text-destructive"
                      @click="deleteEvent(event)"
                    >
                      <Icon name="lucide:trash-2" class="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </template>

    <!-- Modal de creación/edición -->
    <Dialog v-model:open="showCreateModal">
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
            <Button type="button" variant="outline" @click="showCreateModal = false">
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

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

const route = useRoute()
const calendarId = route.params.id as string

const showCreateModal = ref(false)
const editingEvent = ref<any>(null)
const saving = ref(false)

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

// Fetch calendario con eventos
const { data: calendar, pending, refresh } = useFetch(() => `/api/calendars/${calendarId}`)

const events = computed(() => calendar.value?.data?.events || [])

// Transformar eventos para el componente de calendario
const calendarEvents = computed(() => {
  return events.value.map((event: any) => ({
    id: event.id,
    title: event.title,
    start: event.startDate.split('T')[0],
    end: event.endDate 
      ? event.endDate.split('T')[0] 
      : event.startDate.split('T')[0],
    color: event.color,
    description: event.description,
  }))
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
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${startDate.toLocaleDateString('es-ES')} - ${endDate.toLocaleDateString('es-ES')}`
}

function formatEventDate(event: any) {
  const start = new Date(event.startDate).toLocaleDateString('es-ES')
  if (event.endDate) {
    const end = new Date(event.endDate).toLocaleDateString('es-ES')
    return `${start} al ${end}`
  }
  return start
}

function resetEventForm() {
  eventForm.title = ''
  eventForm.description = ''
  eventForm.type = calendar.value?.data?.type === 'FREE_DISPOSITION' ? 'FREE_DISPOSITION' : 'OTHER'
  eventForm.startDate = ''
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
  showCreateModal.value = true
}

async function saveEvent() {
  saving.value = true
  
  try {
    const payload = {
      ...eventForm,
      maxAssignments: eventForm.maxAssignments ? parseInt(eventForm.maxAssignments as any) : undefined,
    }
    
    await $fetch(`/api/calendars/${calendarId}/events`, {
      method: 'POST',
      body: payload,
    })
    
    await refresh()
    showCreateModal.value = false
    editingEvent.value = null
    resetEventForm()
    alert('Evento creado correctamente')
  } catch (error: any) {
    alert(error.data?.message || 'Error al crear el evento')
  } finally {
    saving.value = false
  }
}

async function deleteEvent(event: any) {
  if (!confirm(`¿Eliminar el evento "${event.title}"?`)) return
  
  // Nota: No hay endpoint DELETE para eventos individuales aún
  // Se implementaría similar al de calendarios
  alert('Funcionalidad en desarrollo')
}

function viewEventDetails(eventId: string) {
  const event = events.value.find((e: any) => e.id === eventId)
  if (event) {
    alert(`${event.title}\n${event.description || 'Sin descripción'}`)
  }
}

// Inicializar
resetEventForm()
</script>
