<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

const { user } = await useUserSession()
const router = useRouter()

// Estado del paso actual
const step = ref<'select-template' | 'fill-schedule'>('select-template')
const selectedTemplate = ref<any>(null)

// Templates disponibles
const { data: templatesResponse, pending: loadingTemplates } = await useFetch('/api/schedules/templates')
const templates = computed(() => templatesResponse.value?.data || [])

// Cargar horarios existentes del usuario
const { data: existingSchedulesResponse, pending: loadingExisting } = await useFetch('/api/schedules/me', {
  key: 'my-schedules-existing'
})
const existingSchedules = computed(() => {
  const response = existingSchedulesResponse.value
  if (!response) return []
  if (Array.isArray(response)) return response
  return response.data || []
})

// Datos del horario
const form = reactive({
  name: '',
  type: 'NORMAL',
  color: '#3b82f6', // Color por defecto del horario
  blocks: [] as any[]
})

// Estados
const submitting = ref(false)
const requestValidation = ref(false)
const validationNotes = ref('')

// Configuración de días
const days = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']

// Horas dinámicas basadas en los slots del template
const hours = computed(() => {
  if (!form.blocks.length) return []
  const times = [...new Set(form.blocks.map(b => b.startTime))]
  return times.sort((a, b) => a.localeCompare(b))
})

// Diálogo de edición
const showDialog = ref(false)
const editingBlock = ref<any>(null)

// Tipos de horario
const scheduleTypes = [
  { value: 'NORMAL', label: 'Horario Normal' },
  { value: 'EXAMENES', label: 'Exámenes' },
  { value: 'EXTRAORDINARIO', label: 'Extraordinario' },
  { value: 'GUARDIA', label: 'Guardia' },
  { value: 'REFUERZO', label: 'Refuerzo' }
]

// Paleta de colores para bloques (misma que usa el horario general)
const presetColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1', '#14b8a6', '#a855f7'
]

// Helper para convertir HH:MM a minutos
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Detectar conflictos con horarios existentes del MISMO TIPO
// Esto permite tener horarios de diferente tipo (NORMAL, EXAMENES, etc.) sin conflictos
const conflicts = computed(() => {
  const result: Array<{
    day: string
    hour: string
    existingSchedule: any
    existingBlock: any
    newBlock: any
  }> = []

  // Solo verificar si tenemos horarios existentes y bloques nuevos
  if (!existingSchedules.value.length || !form.blocks.length) return result

  // Filtrar solo horarios activos y validados o pendientes (no rechazados) del MISMO TIPO
  const activeSchedules = existingSchedules.value.filter((s: any) => 
    s.isActive && 
    (s.validationStatus === 'VALIDADO' || s.validationStatus === 'PENDIENTE') &&
    s.type === form.type // Solo comparar contra horarios del mismo tipo
  )

  for (const newBlock of form.blocks) {
    if (newBlock.isBreak) continue // No verificar recreos

    const newStart = timeToMinutes(newBlock.startTime)
    const newEnd = timeToMinutes(newBlock.endTime)

    for (const schedule of activeSchedules) {
      for (const existingBlock of (schedule.blocks || [])) {
        if (existingBlock.dayOfWeek !== newBlock.dayOfWeek) continue
        if (existingBlock.isBreak) continue

        const existingStart = timeToMinutes(existingBlock.startTime)
        const existingEnd = timeToMinutes(existingBlock.endTime)

        // Verificar solapamiento
        if (newStart < existingEnd && newEnd > existingStart) {
          result.push({
            day: newBlock.dayOfWeek,
            hour: newBlock.startTime,
            existingSchedule: schedule,
            existingBlock,
            newBlock
          })
        }
      }
    }
  }

  return result
})

// Verificar si un slot específico tiene conflicto
const getConflictForCell = (day: string, hour: string) => {
  return conflicts.value.find(c => c.day === day && c.hour === hour)
}

// Seleccionar template
const selectTemplate = (template: any) => {
  selectedTemplate.value = template
  form.name = `${template.name} - ${user.value?.firstName || 'Mi horario'}`
  form.color = template.color || '#3b82f6'
  
  // Copiar bloques del template, inicializando color si no viene
  form.blocks = template.blocks.map((block: any) => ({
    dayOfWeek: block.dayOfWeek,
    startTime: block.startTime,
    endTime: block.endTime,
    subject: block.subject || '',
    room: block.room || '',
    isBreak: block.isBreak || false,
    color: block.color || null // null = usar color por defecto del horario
  }))
  
  step.value = 'fill-schedule'
  
  // Mostrar warning si hay conflictos detectados
  if (conflicts.value.length > 0) {
    toast.warning(`Detectados ${conflicts.value.length} conflictos con tus horarios existentes`, {
      description: 'Revisa los slots marcados en rojo',
      duration: 5000
    })
  }
}

// Obtener color efectivo de un bloque (el suyo propio o el del horario general)
const getBlockColor = (block: any) => {
  if (!block) return form.color
  return block.color || form.color
}

// Volver a selección de template
const goBackToTemplates = () => {
  step.value = 'select-template'
  selectedTemplate.value = null
  form.blocks = []
}

// Obtener bloque para una celda específica
const getBlockForCell = (day: string, hour: string) => {
  return form.blocks.find(block => 
    block.dayOfWeek === day && block.startTime === hour
  )
}

// Verificar si hay un slot de template en esta celda
const hasTemplateSlot = (day: string, hour: string) => {
  return !!getBlockForCell(day, hour)
}

// Abrir diálogo para editar bloque
const openBlockDialog = (day: string, hour: string) => {
  const block = getBlockForCell(day, hour)
  if (!block) return
  
  if (block.isBreak) {
    toast.info('Los recreos están definidos en la plantilla por administración')
    return
  }
  
  editingBlock.value = { 
    ...block,
    color: block.color || form.color // Si no tiene color, preseleccionar el del horario
  }
  showDialog.value = true
}

// Guardar cambios en el bloque
const saveBlock = () => {
  if (!editingBlock.value) return
  
  if (!editingBlock.value.subject?.trim()) {
    toast.error('Debes indicar la asignatura')
    return
  }

  const index = form.blocks.findIndex(b => 
    b.dayOfWeek === editingBlock.value.dayOfWeek && 
    b.startTime === editingBlock.value.startTime
  )

  if (index >= 0) {
    form.blocks[index] = {
      ...form.blocks[index],
      subject: editingBlock.value.subject,
      room: editingBlock.value.room,
      color: editingBlock.value.color // Guardar el color elegido
    }
  }

  showDialog.value = false
  editingBlock.value = null
}

// Limpiar asignatura
const clearBlock = () => {
  const index = form.blocks.findIndex(b => 
    b.dayOfWeek === editingBlock.value?.dayOfWeek && 
    b.startTime === editingBlock.value?.startTime
  )
  
  if (index >= 0) {
    form.blocks[index].subject = ''
    form.blocks[index].room = ''
    form.blocks[index].color = null // Resetear color
  }
  
  showDialog.value = false
  editingBlock.value = null
}

// Contadores para el resumen
const totalBlocks = computed(() => form.blocks.filter(b => !b.isBreak).length)
const filledBlocks = computed(() => 
  form.blocks.filter(b => !b.isBreak && b.subject?.trim()).length
)
const pendingBlocks = computed(() => totalBlocks.value - filledBlocks.value)

// Enviar formulario
const onSubmit = async () => {
  if (!form.name) {
    toast.error('El nombre es obligatorio')
    return
  }
  
  const emptyBlocks = form.blocks.filter(b => !b.isBreak && !b.subject.trim())
  if (emptyBlocks.length > 0) {
    toast.error(`Faltan ${emptyBlocks.length} asignatura(s) por asignar`)
    return
  }

  // Verificar conflictos antes de enviar
  if (conflicts.value.length > 0) {
    const conflictDetails = conflicts.value.map(c => 
      `${c.day} ${c.existingBlock.startTime}-${c.existingBlock.endTime} (${c.existingSchedule.name})`
    ).join(', ')
    
    toast.error(`No se puede crear el horario: conflictos detectados`, {
      description: conflictDetails,
      duration: 8000
    })
    return
  }

  submitting.value = true
  try {
    const payload = {
      name: form.name,
      type: form.type,
      color: form.color,
      isTemplate: false,
      userId: user.value?.id,
      validFrom: undefined,
      validUntil: undefined,
      blocks: form.blocks.map(b => ({
        ...b,
        subject: b.subject || 'Sin asignatura'
      }))
    }

    const { data: newSchedule, error } = await useFetch('/api/schedules', {
      method: 'POST',
      body: payload
    })

    if (error.value) {
      // Mejorar mensaje de error si es de solapamiento
      const errorMsg = error.value.message || ''
      if (errorMsg.includes('Solapamiento')) {
        throw new Error(`${errorMsg}. Ve a "Mis Horarios" para ver tus horarios existentes.`)
      }
      throw error.value
    }

    if (requestValidation.value && newSchedule.value?.scheduleId) {
      await useFetch(`/api/schedules/${newSchedule.value.scheduleId}/request-validation`, {
        method: 'POST',
        body: { notes: validationNotes.value }
      })
      toast.success('Horario creado y enviado para validación')
    } else {
      toast.success('Horario creado correctamente')
    }

    await navigateTo('/usuario/horarios')
  } catch (err: any) {
    toast.error(err.message || 'Error al crear el horario')
  } finally {
    submitting.value = false
  }
}

const onCancel = () => navigateTo('/usuario/horarios')

// Helpers para mostrar horarios existentes
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'BORRADOR': 'bg-gray-100 text-gray-800',
    'PENDIENTE': 'bg-yellow-100 text-yellow-800',
    'VALIDADO': 'bg-green-100 text-green-800',
    'RECHAZADO': 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'BORRADOR': 'Borrador',
    'PENDIENTE': 'Pendiente',
    'VALIDADO': 'Validado',
    'RECHAZADO': 'Rechazado'
  }
  return labels[status] || status
}
</script>

<template>
  <div class="min-h-screen bg-background p-4">
    <div class="mx-auto max-w-7xl">
      <!-- PASO 1: Seleccionar Template -->
      <template v-if="step === 'select-template'">
        <div class="mb-6">
          <h1 class="text-xl font-semibold tracking-tight text-foreground">
            Crear Horario
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            Selecciona una plantilla base creada por administración
          </p>
        </div>

        <!-- Horarios existentes del MISMO TIPO -->
        <Card v-if="existingSchedules.filter((s: any) => s.type === form.type).length > 0 && !loadingExisting" class="mb-6 border-amber-200 dark:border-amber-800">
          <CardHeader class="bg-amber-50 dark:bg-amber-950/30">
            <div class="flex items-center gap-2">
              <Icon name="lucide:alert-triangle" class="h-5 w-5 text-amber-600" />
              <CardTitle class="text-sm font-medium text-amber-900 dark:text-amber-100">
                Ya tienes {{ existingSchedules.filter((s: any) => s.type === form.type).length }} horario(s) de tipo "{{ getTypeLabel(form.type) }}"
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent class="p-4">
            <p class="text-sm text-muted-foreground mb-3">
              <strong>No puedes tener dos horarios del mismo tipo que se solapen.</strong> Puedes crear horarios de <strong>otro tipo</strong> (Exámenes, Guardias, etc.) sin problemas.
            </p>
            <div class="space-y-2">
              <div 
                v-for="schedule in existingSchedules.filter((s: any) => s.type === form.type)" 
                :key="schedule.id"
                class="flex items-center justify-between p-2 rounded-md bg-muted/50"
              >
                <div class="flex items-center gap-2">
                  <div 
                    class="h-3 w-3 rounded-full" 
                    :style="{ backgroundColor: schedule.color || '#3b82f6' }"
                  />
                  <span class="text-sm font-medium">{{ schedule.name }}</span>
                  <Badge :class="getStatusColor(schedule.validationStatus)" class="text-xs">
                    {{ getStatusLabel(schedule.validationStatus) }}
                  </Badge>
                </div>
                <span class="text-xs text-muted-foreground">
                  {{ schedule.blocks?.length || 0 }} bloques
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Sección de Plantillas -->
        <div class="mt-6">
          <h2 class="text-lg font-medium mb-4">Plantillas disponibles</h2>
          
          <div v-if="loadingTemplates" class="flex items-center justify-center py-12">
            <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin text-muted-foreground" />
          </div>

          <div v-else-if="templates.length === 0" class="flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted rounded-lg">
            <Icon name="lucide:layout-template" class="h-12 w-12 text-muted-foreground opacity-50" />
            <p class="mt-4 text-muted-foreground">No hay plantillas disponibles</p>
            <p class="text-sm text-muted-foreground mt-1">Contacta con administración para que creen plantillas.</p>
          </div>

          <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card 
              v-for="template in templates" 
              :key="template.id"
              class="cursor-pointer hover:border-primary transition-colors hover:shadow-md !p-0 !gap-0 overflow-hidden"
              @click="selectTemplate(template)"
            >
              <CardHeader class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <div 
                    class="h-3 w-3 rounded-full" 
                    :style="{ backgroundColor: template.color || '#3b82f6' }"
                  />
                  <CardTitle class="text-base">{{ template.name }}</CardTitle>
                </div>
                <CardDescription class="text-xs">
                  {{ template.blocks?.length || 0 }} slots predefinidos
                </CardDescription>
              </CardHeader>
              
              <CardContent class="pt-0">
                <p v-if="template.description" class="text-xs text-muted-foreground line-clamp-2">
                  {{ template.description }}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div class="mt-6">
          <Button variant="outline" @click="onCancel">
            Cancelar
          </Button>
        </div>
      </template>

      <!-- PASO 2: Rellenar Horario -->
      <template v-else>
        <!-- Cabecera -->
        <div class="mb-6 flex items-start justify-between">
          <div>
            <Button variant="ghost" size="sm" @click="goBackToTemplates" class="mb-2 -ml-2">
              <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
              Cambiar plantilla
            </Button>
            <h1 class="text-xl font-semibold tracking-tight text-foreground">
              Completar Horario
            </h1>
            <p class="text-sm text-muted-foreground mt-1">
              Plantilla: <span class="font-medium text-foreground">{{ selectedTemplate?.name }}</span>
            </p>
          </div>
          <div class="flex gap-2">
            <Button variant="outline" @click="onCancel">
              Cancelar
            </Button>
            <Button 
              @click="onSubmit" 
              :disabled="submitting || pendingBlocks > 0 || conflicts.length > 0"
            >
              <Icon v-if="submitting" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
              <Icon v-else name="lucide:save" class="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </div>
        </div>

        <!-- Alerta de conflictos detectados -->
        <div 
          v-if="conflicts.length > 0" 
          class="mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div class="flex items-start gap-3">
            <div class="bg-red-100 dark:bg-red-900 p-2 rounded-full">
              <Icon name="lucide:alert-octagon" class="h-5 w-5 text-red-700 dark:text-red-300" />
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-red-900 dark:text-red-100">
                Conflicto con tu horario de "{{ getTypeLabel(form.type) }}"
              </h3>
              <p class="text-sm text-red-700 dark:text-red-300 mt-1">
                Ya tienes un horario de tipo "{{ getTypeLabel(form.type) }}" que se solapa con este. 
                <strong>Cambia el tipo de horario</strong> (a Exámenes, Guardias, etc.) o selecciona otra plantilla.
              </p>
              <div class="mt-2 space-y-1">
                <div 
                  v-for="(conflict, idx) in conflicts.slice(0, 3)" 
                  :key="idx"
                  class="text-xs text-red-600 dark:text-red-400"
                >
                  • {{ conflict.day }} {{ conflict.existingBlock.startTime }}-{{ conflict.existingBlock.endTime }} 
                  (en "{{ conflict.existingSchedule.name }}")
                </div>
                <div v-if="conflicts.length > 3" class="text-xs text-red-600 dark:text-red-400">
                  ... y {{ conflicts.length - 3 }} más
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-4">
          <!-- Panel lateral configuración -->
          <div class="space-y-6 lg:col-span-1">
            <Card class="!p-0 !gap-0 overflow-hidden">
              <CardHeader class="px-4 py-3">
                <CardTitle class="text-sm font-medium">Configuración</CardTitle>
              </CardHeader>
              <CardContent class="space-y-4 px-4 pb-4">
                <div class="space-y-2">
                  <Label>Nombre</Label>
                  <Input v-model="form.name" />
                </div>

                <div class="space-y-2">
                  <Label>Tipo</Label>
                  <Select v-model="form.type">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem 
                        v-for="type in scheduleTypes" 
                        :key="type.value" 
                        :value="type.value"
                      >
                        {{ type.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="space-y-2">
                  <Label>Color por defecto</Label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="color in presetColors.slice(0, 8)"
                      :key="color"
                      type="button"
                      :class="[
                        'h-6 w-6 rounded-full border-2 transition-all',
                        form.color === color ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                      ]"
                      :style="{ backgroundColor: color }"
                      @click="form.color = color"
                    />
                  </div>
                  <p class="text-xs text-muted-foreground mt-1">
                    Se usará si no se especifica color en el bloque
                  </p>
                </div>
              </CardContent>
            </Card>

            <!-- Progreso -->
            <Card class="!p-0 !gap-0 overflow-hidden">
              <CardHeader class="px-4 py-3">
                <CardTitle class="text-sm font-medium">Progreso</CardTitle>
              </CardHeader>
              <CardContent class="space-y-3 px-4 pb-4">
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Asignaturas:</span>
                  <Badge variant="secondary">{{ filledBlocks }}/{{ totalBlocks }}</Badge>
                </div>
                
                <div v-if="pendingBlocks > 0" class="pt-2">
                  <div class="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md border border-amber-200 dark:border-amber-800">
                    <Icon name="lucide:alert-circle" class="h-4 w-4 shrink-0" />
                    <span>Faltan {{ pendingBlocks }} por completar</span>
                  </div>
                </div>
                
                <div v-else-if="conflicts.length === 0" class="pt-2">
                  <div class="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-950/30 p-2 rounded-md border border-green-200 dark:border-green-800">
                    <Icon name="lucide:check-circle" class="h-4 w-4 shrink-0" />
                    <span>Todo completado</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Validación -->
            <Card class="!p-0 !gap-0 overflow-hidden">
              <CardHeader class="px-4 py-3">
                <CardTitle class="text-sm font-medium">Validación</CardTitle>
              </CardHeader>
              <CardContent class="space-y-4 px-4 pb-4">
                <div class="flex items-center justify-between">
                  <div class="space-y-0.5">
                    <Label class="text-sm">Enviar a validación</Label>
                    <p class="text-xs text-muted-foreground">
                      Revisión por administración
                    </p>
                  </div>
                  <Switch v-model="requestValidation" />
                </div>
                
                <div v-if="requestValidation" class="space-y-2">
                  <Label class="text-xs">Notas</Label>
                  <Textarea 
                    v-model="validationNotes" 
                    placeholder="Comentarios para el revisor..."
                    class="min-h-[80px] text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <!-- Horarios existentes del MISMO TIPO -->
            <Card v-if="existingSchedules.filter((s: any) => s.type === form.type).length > 0" class="!p-0 !gap-0 overflow-hidden border-amber-200">
              <CardHeader class="px-4 py-3 bg-amber-50/50">
                <CardTitle class="text-sm font-medium text-amber-900">Mismo tipo ({{ getTypeLabel(form.type) }})</CardTitle>
              </CardHeader>
              <CardContent class="space-y-2 px-4 pb-4">
                <div 
                  v-for="schedule in existingSchedules.filter((s: any) => s.type === form.type).slice(0, 3)" 
                  :key="schedule.id"
                  class="flex items-center gap-2 text-xs"
                >
                  <div 
                    class="h-2 w-2 rounded-full" 
                    :style="{ backgroundColor: schedule.color || '#3b82f6' }"
                  />
                  <span class="truncate flex-1">{{ schedule.name }}</span>
                  <Badge :class="getStatusColor(schedule.validationStatus)" class="text-[10px]">
                    {{ getStatusLabel(schedule.validationStatus) }}
                  </Badge>
                </div>
                <div v-if="existingSchedules.filter((s: any) => s.type === form.type).length > 3" class="text-xs text-muted-foreground text-center">
                  +{{ existingSchedules.filter((s: any) => s.type === form.type).length - 3 }} más
                </div>
                <p class="text-[10px] text-muted-foreground mt-2">
                  Solo puedes tener un horario de cada tipo.
                </p>
              </CardContent>
            </Card>
          </div>

          <!-- GRID DE HORARIO -->
          <div class="lg:col-span-3">
            <Card class="overflow-hidden !p-0 !gap-0">
              <CardHeader class="border-b bg-muted/30 py-2 px-4 !pb-2">
  <div class="flex items-center justify-between">
    <p class="text-[11px] text-muted-foreground leading-tight">
      Haz clic en los slots para asignar
    </p>
    <div class="flex gap-2 text-[10px]">
      <div class="flex items-center gap-1">
        <div class="w-2 h-2 rounded-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 border-dashed"></div>
        <span class="text-muted-foreground">Pendiente</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-2 h-2 rounded-sm bg-primary/10 border border-primary/30"></div>
        <span class="text-muted-foreground">Asignado</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-2 h-2 rounded-sm bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600"></div>
        <span class="text-red-600 dark:text-red-400 font-medium">Conflicto</span>
      </div>
    </div>
  </div>
</CardHeader>
              
              <CardContent class="p-0">
                <div class="overflow-x-auto">
                  <div class="min-w-[600px]">
                    <!-- Header días -->
                    <div class="grid grid-cols-[60px_repeat(5,1fr)] border-b border-border bg-muted/20">
                      <div class="p-2 text-xs font-semibold text-muted-foreground border-r border-border flex items-center justify-center bg-muted/30">
                        Hora
                      </div>
                      <div 
                        v-for="day in days" 
                        :key="day"
                        class="p-3 text-xs font-semibold text-center text-muted-foreground border-r border-border last:border-r-0 uppercase tracking-wide"
                      >
                        {{ day.slice(0, 3) }}
                      </div>
                    </div>

                    <!-- Grid dinámico -->
                    <div class="divide-y divide-border">
                      <div 
                        v-for="hour in hours" 
                        :key="hour"
                        class="grid grid-cols-[60px_repeat(5,1fr)] min-h-[70px]"
                      >
                        <!-- Columna hora -->
                        <div class="p-2 text-xs font-medium text-muted-foreground border-r border-border bg-muted/5 flex items-center justify-center">
                          <span class="font-mono text-[11px]">{{ hour }}</span>
                        </div>

                        <!-- Celdas de días -->
                        <div 
                          v-for="day in days" 
                          :key="`${day}-${hour}`"
                          class="relative border-r border-border last:border-r-0 p-1"
                          :class="[
                            hasTemplateSlot(day, hour) 
                              ? getConflictForCell(day, hour)
                                ? 'bg-red-50 dark:bg-red-950/30 cursor-not-allowed' 
                                : 'bg-white dark:bg-background cursor-pointer hover:bg-slate-50 dark:hover:bg-muted/50 transition-colors'
                              : 'bg-slate-50/50 dark:bg-muted/10'
                          ]"
                          @click="!getConflictForCell(day, hour) && hasTemplateSlot(day, hour) && openBlockDialog(day, hour)"
                        >
                          <template v-if="hasTemplateSlot(day, hour)">
                            <div 
                              class="rounded-md p-2 text-xs h-full flex flex-col justify-center gap-1 border-2 transition-all h-[62px]"
                              :class="[
                                getConflictForCell(day, hour)
                                  ? 'bg-red-100 dark:bg-red-900/50 border-red-400 dark:border-red-600 text-red-800 dark:text-red-200'
                                  : getBlockForCell(day, hour)?.isBreak 
                                    ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed' 
                                    : getBlockForCell(day, hour)?.subject 
                                      ? 'shadow-sm' 
                                      : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50 border-dashed text-amber-700 dark:text-amber-400 hover:border-amber-400 dark:hover:border-amber-600'
                              ]"
                              :style="(!getConflictForCell(day, hour) && getBlockForCell(day, hour)?.subject && !getBlockForCell(day, hour)?.isBreak) ? {
                                backgroundColor: `${getBlockColor(getBlockForCell(day, hour))}15`,
                                borderColor: `${getBlockColor(getBlockForCell(day, hour))}40`,
                                color: getBlockColor(getBlockForCell(day, hour))
                              } : {}"
                            >
                              <div class="font-semibold truncate flex items-center gap-1.5">
                                <template v-if="getConflictForCell(day, hour)">
                                  <Icon name="lucide:alert-octagon" class="h-3.5 w-3.5" />
                                  <span>Conflicto</span>
                                </template>
                                <template v-else-if="getBlockForCell(day, hour)?.isBreak">
                                  <Icon name="lucide:coffee" class="h-3.5 w-3.5" />
                                  <span>Recreo</span>
                                </template>
                                <template v-else-if="getBlockForCell(day, hour)?.subject">
                                  <Icon name="lucide:book-open" class="h-3.5 w-3.5 shrink-0" />
                                  <span class="truncate">{{ getBlockForCell(day, hour).subject }}</span>
                                </template>
                                <template v-else>
                                  <Icon name="lucide:plus" class="h-3.5 w-3.5 shrink-0" />
                                  <span class="text-xs">Asignar</span>
                                </template>
                              </div>
                              
                              <div 
                                v-if="getConflictForCell(day, hour)" 
                                class="text-[10px] opacity-75 truncate"
                              >
                                {{ getConflictForCell(day, hour)?.existingSchedule.name }}
                              </div>
                              
                              <div 
                                v-else-if="getBlockForCell(day, hour)?.room && !getBlockForCell(day, hour)?.isBreak" 
                                class="text-[10px] opacity-75 truncate flex items-center gap-1"
                              >
                                <Icon name="lucide:map-pin" class="h-3 w-3 shrink-0" />
                                {{ getBlockForCell(day, hour).room }}
                              </div>
                              
                              <div class="text-[10px] opacity-40 font-mono mt-auto pt-0.5 flex justify-between">
                                <span>{{ getBlockForCell(day, hour)?.startTime }}</span>
                                <span>{{ getBlockForCell(day, hour)?.endTime }}</span>
                              </div>
                            </div>
                          </template>
                          
                          <!-- Celda vacía -->
                          <div v-else class="h-full flex items-center justify-center">
                            <span class="text-[10px] text-slate-300 dark:text-slate-600">—</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </template>
    </div>

    <!-- Diálogo de Edición con selector de color -->
    <Dialog :open="showDialog" @update:open="showDialog = $event">
      <DialogContent class="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle class="text-foreground">Asignar Asignatura</DialogTitle>
          <DialogDescription class="flex items-center gap-2 pt-1">
            <Badge variant="secondary" class="text-xs border-border">
              {{ editingBlock?.dayOfWeek }}
            </Badge>
            <span class="text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground border border-border">
              {{ editingBlock?.startTime }} - {{ editingBlock?.endTime }}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div v-if="editingBlock" class="space-y-4 py-4">
          <!-- Info de horario fijo -->
          <div class="rounded-lg bg-muted p-3 space-y-2 text-sm border border-border">
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground text-xs uppercase tracking-wide">Horario fijo</span>
              <span class="font-medium font-mono text-xs text-foreground bg-background px-2 py-0.5 rounded border border-border">
                {{ editingBlock.startTime }} - {{ editingBlock.endTime }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground text-xs uppercase tracking-wide">Día</span>
              <span class="font-medium text-foreground">{{ editingBlock.dayOfWeek }}</span>
            </div>
          </div>

          <!-- Asignatura -->
          <div class="space-y-2">
            <Label class="text-sm font-medium text-foreground">
              Asignatura <span class="text-destructive">*</span>
            </Label>
            <Input 
              v-model="editingBlock.subject" 
              placeholder="Ej: Programación, Base de Datos..."
              class="h-10 bg-background text-foreground border-input"
            />
          </div>

          <!-- Aula -->
          <div class="space-y-2">
            <Label class="text-sm font-medium text-foreground">Aula o ubicación</Label>
            <Input 
              v-model="editingBlock.room" 
              placeholder="Ej: Aula 101, Laboratorio..."
              class="h-10 bg-background text-foreground border-input"
            />
          </div>

          <!-- Selector de color para el bloque -->
          <div class="space-y-3 pt-2 border-t border-border">
            <div class="flex items-center justify-between">
              <Label class="text-sm font-medium text-foreground">Color identificativo</Label>
              <div 
                class="w-6 h-6 rounded-full border-2 border-border shadow-sm"
                :style="{ backgroundColor: editingBlock.color }"
              />
            </div>
            <p class="text-xs text-muted-foreground">
              Este color se mostrará en el calendario para este bloque específico
            </p>
            <div class="flex flex-wrap gap-2 pt-1">
              <button
                v-for="color in presetColors"
                :key="color"
                type="button"
                :class="[
                  'h-8 w-8 rounded-full border-2 transition-all',
                  editingBlock.color === color 
                    ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-offset-background ring-foreground' 
                    : 'border-transparent hover:scale-105 hover:border-muted-foreground'
                ]"
                :style="{ backgroundColor: color }"
                @click="editingBlock.color = color"
                :title="color"
              />
            </div>
          </div>
        </div>

        <DialogFooter class="flex justify-between gap-2 border-t border-border pt-4">
          <Button 
            v-if="editingBlock?.subject"
            variant="ghost" 
            size="sm"
            class="text-destructive hover:text-destructive hover:bg-destructive/10"
            @click="clearBlock"
          >
            <Icon name="lucide:trash-2" class="mr-2 h-4 w-4" />
            Limpiar
          </Button>
          <div class="flex gap-2">
            <Button variant="outline" @click="showDialog = false">
              Cancelar
            </Button>
            <Button @click="saveBlock">
              <Icon name="lucide:check" class="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
