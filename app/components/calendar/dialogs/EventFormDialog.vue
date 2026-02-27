<script setup lang="ts">
import type { CalendarEventPayload } from '~/composables/useCalendarApi'

/**
 * Modal de formulario para crear/editar eventos de calendario
 * 
 * @example
 * ```vue
 * <EventFormDialog
 *   v-model:open="showModal"
 *   :event="editingEvent"
 *   :default-start-date="selectedDate"
 *   :loading="saving"
 *   @submit="handleSubmit"
 * />
 * ```
 */
interface CalendarEvent {
  id: string
  title: string
  description?: string
  type: string
  startDate: string
  endDate?: string
  isAllDay?: boolean
  startTime?: string
  endTime?: string
  color?: string
  maxAssignments?: number
  isActive?: boolean
}

interface Props {
  open: boolean
  event?: CalendarEvent | null
  defaultStartDate?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  event: null,
  defaultStartDate: '',
  loading: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'submit': [payload: CalendarEventPayload]
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const isEditing = computed(() => !!props.event)

const form = reactive<CalendarEventPayload>({
  title: '',
  description: '',
  type: 'FREE_DISPOSITION',
  startDate: '',
  endDate: '',
  isAllDay: true,
  startTime: '',
  endTime: '',
  color: '#3b82f6',
  maxAssignments: undefined,
  isActive: true,
})

// Resetear formulario cuando se abre/cierra o cambia el evento
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})

watch(() => props.event, (event) => {
  if (event) {
    form.title = event.title
    form.description = event.description || ''
    form.type = event.type as any
    form.startDate = event.startDate.split('T')[0]
    form.endDate = event.endDate ? event.endDate.split('T')[0] : ''
    form.isAllDay = event.isAllDay ?? true
    form.startTime = event.startTime || ''
    form.endTime = event.endTime || ''
    form.color = event.color || '#3b82f6'
    form.maxAssignments = event.maxAssignments
    form.isActive = event.isActive ?? true
  }
}, { immediate: true })

function resetForm() {
  if (props.event) return // No resetear si estamos editando
  
  form.title = ''
  form.description = ''
  form.type = 'FREE_DISPOSITION'
  form.startDate = props.defaultStartDate || ''
  form.endDate = ''
  form.isAllDay = true
  form.startTime = ''
  form.endTime = ''
  form.color = '#3b82f6'
  form.maxAssignments = undefined
  form.isActive = true
}

function handleSubmit() {
  const payload: CalendarEventPayload = {
    ...form,
    maxAssignments: form.maxAssignments ? parseInt(form.maxAssignments as any) : undefined,
  }
  emit('submit', payload)
}

function handleClose() {
  isOpen.value = false
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {{ isEditing ? 'Editar Evento' : 'Nuevo Evento' }}
        </DialogTitle>
        <DialogDescription>
          {{ isEditing ? 'Modifica los datos del evento' : 'Añade un nuevo evento al calendario' }}
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <Label for="title">Título</Label>
          <Input 
            id="title" 
            v-model="form.title" 
            placeholder="Día de libre disposición"
            required
          />
        </div>
        
        <div class="space-y-2">
          <Label for="description">Descripción</Label>
          <Textarea 
            id="description" 
            v-model="form.description" 
            placeholder="Descripción del evento..."
            rows="2"
          />
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="type">Tipo</Label>
            <Select v-model="form.type">
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
                v-model="form.color" 
                type="color"
                class="w-16 h-10 p-1"
              />
              <Input 
                v-model="form.color" 
                placeholder="#3b82f6"
                class="flex-1"
              />
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="startDate">Fecha inicio</Label>
            <Input 
              id="startDate" 
              v-model="form.startDate" 
              type="date"
              required
            />
          </div>
          
          <div class="space-y-2">
            <Label for="endDate">Fecha fin (opcional)</Label>
            <Input 
              id="endDate" 
              v-model="form.endDate" 
              type="date"
            />
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <Switch id="isAllDay" v-model="form.isAllDay" />
            <Label for="isAllDay" class="cursor-pointer">Todo el día</Label>
          </div>
          
          <div class="flex items-center gap-2">
            <Switch id="isActive" v-model="form.isActive" />
            <Label for="isActive" class="cursor-pointer">Activo</Label>
          </div>
        </div>
        
        <div class="space-y-2">
          <Label for="maxAssignments">Máximo de asignaciones (opcional)</Label>
          <Input 
            id="maxAssignments" 
            v-model="form.maxAssignments" 
            type="number"
            min="1"
            placeholder="Sin límite"
          />
          <p class="text-xs text-muted-foreground">
            Para eventos de libre disposición, límite de profesores que pueden seleccionar este día
          </p>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose">
            Cancelar
          </Button>
          <Button type="submit" :disabled="loading">
            <Loader2 v-if="loading" class="h-4 w-4 mr-2 animate-spin" />
            {{ isEditing ? 'Guardar Cambios' : 'Crear Evento' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
