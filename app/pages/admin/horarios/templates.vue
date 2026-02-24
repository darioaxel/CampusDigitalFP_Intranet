<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

// Estados
const showCreateModal = ref(false)
const creating = ref(false)

// Datos del formulario de template
const form = reactive({
  name: '',
  type: 'NORMAL',
  color: '#3b82f6',
  description: '',
  blocks: [] as any[]
})

// Colores predefinidos
const presetColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
]

// Tipos de horario
const scheduleTypes = [
  { value: 'NORMAL', label: 'Horario Normal' },
  { value: 'EXAMENES', label: 'Exámenes' },
  { value: 'EXTRAORDINARIO', label: 'Extraordinario' },
  { value: 'GUARDIA', label: 'Guardia' },
  { value: 'REFUERZO', label: 'Refuerzo' }
]

// Cargar templates
const { data: templatesResponse, pending, refresh } = await useFetch('/api/schedules/templates')
const templates = computed(() => templatesResponse.value?.data || [])

// Agregar bloque
const addBlock = () => {
  form.blocks.push({
    dayOfWeek: 'LUNES',
    startTime: '08:00',
    endTime: '09:00',
    subject: '',
    room: '',
    isBreak: false
  })
}

// Eliminar bloque
const removeBlock = (index: number) => {
  form.blocks.splice(index, 1)
}

// Ordenar bloques
const sortBlocks = () => {
  const dayOrder = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
  form.blocks.sort((a, b) => {
    const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek)
    if (dayDiff !== 0) return dayDiff
    return a.startTime.localeCompare(b.startTime)
  })
}

// Crear template
const createTemplate = async () => {
  if (!form.name) {
    toast.error('El nombre es obligatorio')
    return
  }
  if (form.blocks.length === 0) {
    toast.error('Debes agregar al menos un bloque')
    return
  }

  creating.value = true
  try {
    const payload = {
      name: form.name,
      type: form.type,
      color: form.color,
      description: form.description,
      isTemplate: true,
      blocks: form.blocks
    }

    const { error } = await useFetch('/api/schedules', {
      method: 'POST',
      body: payload
    })

    if (error.value) throw error.value

    toast.success('Template creado correctamente')
    showCreateModal.value = false
    resetForm()
    refresh()
  } catch (err: any) {
    toast.error(err.message || 'Error al crear el template')
  } finally {
    creating.value = false
  }
}

// Resetear formulario
const resetForm = () => {
  form.name = ''
  form.type = 'NORMAL'
  form.color = '#3b82f6'
  form.description = ''
  form.blocks = []
}

// Eliminar template
const deleteTemplate = async (template: any) => {
  if (!confirm(`¿Eliminar el template "${template.name}"?`)) return

  try {
    const { error } = await useFetch(`/api/schedules/${template.id}`, {
      method: 'DELETE'
    })

    if (error.value) throw error.value

    toast.success('Template eliminado')
    refresh()
  } catch (err: any) {
    toast.error(err.message || 'Error al eliminar')
  }
}

// Crear template base con horario típico
const createBaseTemplate = () => {
  form.name = 'Horario Base Mañanas'
  form.blocks = [
    // Lunes a Viernes: 8:00-14:00 con recreo 10:00-10:30
    ...['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'].flatMap(day => [
      { dayOfWeek: day, startTime: '08:00', endTime: '09:00', subject: '', room: '', isBreak: false },
      { dayOfWeek: day, startTime: '09:00', endTime: '10:00', subject: '', room: '', isBreak: false },
      { dayOfWeek: day, startTime: '10:00', endTime: '10:30', subject: 'Recreo', room: '', isBreak: true },
      { dayOfWeek: day, startTime: '10:30', endTime: '11:30', subject: '', room: '', isBreak: false },
      { dayOfWeek: day, startTime: '11:30', endTime: '12:30', subject: '', room: '', isBreak: false },
      { dayOfWeek: day, startTime: '12:30', endTime: '13:30', subject: '', room: '', isBreak: false },
      { dayOfWeek: day, startTime: '13:30', endTime: '14:30', subject: '', room: '', isBreak: false },
    ])
  ]
  showCreateModal.value = true
}
</script>

<template>
  <div class="min-h-screen bg-background p-4">
    <div class="mx-auto max-w-7xl">
      <!-- Cabecera -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-foreground">
            Plantillas de Horario
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            Crea plantillas que los profesores usarán como base para sus horarios
          </p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" @click="createBaseTemplate">
            <Icon name="lucide:copy" class="mr-2 h-4 w-4" />
            Template Base
          </Button>
          <Button @click="showCreateModal = true">
            <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
            Nueva Plantilla
          </Button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="flex items-center justify-center py-12">
        <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin text-muted-foreground" />
      </div>

      <!-- Grid de Templates -->
      <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card v-for="template in templates" :key="template.id">
          <CardHeader class="pb-3">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <div 
                  class="h-3 w-3 rounded-full" 
                  :style="{ backgroundColor: template.color || '#3b82f6' }"
                />
                <CardTitle class="text-base">{{ template.name }}</CardTitle>
              </div>
              <div class="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  class="h-8 w-8 p-0 text-destructive"
                  @click="deleteTemplate(template)"
                >
                  <Icon name="lucide:trash-2" class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription v-if="template.description" class="text-xs mt-1">
              {{ template.description }}
            </CardDescription>
          </CardHeader>
          
          <CardContent class="pt-0">
            <div class="space-y-2 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Bloques:</span>
                <Badge variant="secondary">{{ template.blocks?.length || 0 }}</Badge>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Tipo:</span>
                <Badge variant="outline" class="text-xs">{{ template.type }}</Badge>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Creado:</span>
                <span class="text-xs">
                  {{ new Date(template.createdAt).toLocaleDateString('es-ES') }}
                </span>
              </div>
            </div>

            <!-- Preview de bloques -->
            <div class="mt-4 border-t pt-3">
              <p class="text-xs text-muted-foreground mb-2">Estructura:</p>
              <div class="space-y-1 max-h-32 overflow-y-auto">
                <div 
                  v-for="block in template.blocks?.slice(0, 8)" 
                  :key="block.id"
                  class="flex items-center gap-2 text-xs"
                >
                  <span class="text-muted-foreground w-8">{{ block.dayOfWeek.slice(0, 3) }}</span>
                  <span>{{ block.startTime }} - {{ block.endTime }}</span>
                  <Badge v-if="block.isBreak" variant="secondary" class="text-[10px]">Recreo</Badge>
                </div>
                <p v-if="(template.blocks?.length || 0) > 8" class="text-xs text-muted-foreground text-center">
                  +{{ template.blocks.length - 8 }} más...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Empty state -->
      <div v-if="!pending && templates.length === 0" class="flex flex-col items-center justify-center py-12">
        <Icon name="lucide:layout-template" class="h-12 w-12 text-muted-foreground opacity-50" />
        <p class="mt-4 text-muted-foreground">No hay plantillas creadas</p>
        <Button class="mt-4" @click="showCreateModal = true">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          Crear primera plantilla
        </Button>
      </div>
    </div>

    <!-- Modal de creación -->
    <Dialog v-model:open="showCreateModal">
      <DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Plantilla de Horario</DialogTitle>
          <DialogDescription>
            Define las franjas horarias que los profesores podrán usar como base
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-6">
          <!-- Configuración básica -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Nombre de la plantilla</Label>
              <Input 
                v-model="form.name" 
                placeholder="Ej: Horario Mañanas DAM"
              />
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
          </div>

          <div class="space-y-2">
            <Label>Color identificativo</Label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="color in presetColors"
                :key="color"
                type="button"
                :class="[
                  'h-6 w-6 rounded-full border-2 transition-all',
                  form.color === color ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                ]"
                :style="{ backgroundColor: color }"
                @click="form.color = color"
              />
              <input 
                v-model="form.color"
                type="color" 
                class="h-6 w-6 rounded-full border-0 p-0"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Textarea 
              v-model="form.description" 
              placeholder="Describe el horario..."
              rows="2"
            />
          </div>

          <!-- Bloques -->
          <div class="border rounded-lg p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-medium">Franjas horarias</h3>
              <div class="flex gap-2">
                <Button type="button" variant="outline" size="sm" @click="sortBlocks">
                  <Icon name="lucide:arrow-up-down" class="mr-1 h-4 w-4" />
                  Ordenar
                </Button>
                <Button type="button" variant="outline" size="sm" @click="addBlock">
                  <Icon name="lucide:plus" class="mr-1 h-4 w-4" />
                  Agregar
                </Button>
              </div>
            </div>

            <div v-if="form.blocks.length === 0" class="text-center py-8 text-muted-foreground">
              <Icon name="lucide:calendar-plus" class="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p class="text-sm">No hay franjas horarias</p>
              <p class="text-xs mt-1">Agrega bloques de tiempo para cada día</p>
            </div>

            <div v-else class="space-y-2 max-h-64 overflow-y-auto">
              <div 
                v-for="(block, index) in form.blocks" 
                :key="index"
                class="flex items-center gap-2 p-2 rounded border"
              >
                <Select v-model="block.dayOfWeek">
                  <SelectTrigger class="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LUNES">Lunes</SelectItem>
                    <SelectItem value="MARTES">Martes</SelectItem>
                    <SelectItem value="MIERCOLES">Miércoles</SelectItem>
                    <SelectItem value="JUEVES">Jueves</SelectItem>
                    <SelectItem value="VIERNES">Viernes</SelectItem>
                  </SelectContent>
                </Select>

                <Input 
                  v-model="block.startTime" 
                  type="time"
                  class="h-8 w-24 text-xs"
                />
                <span class="text-muted-foreground">-</span>
                <Input 
                  v-model="block.endTime" 
                  type="time"
                  class="h-8 w-24 text-xs"
                />

                <Checkbox 
                  :id="`break-${index}`" 
                  v-model:checked="block.isBreak"
                />
                <Label :for="`break-${index}`" class="text-xs whitespace-nowrap cursor-pointer">
                  Recreo
                </Label>

                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm"
                  class="h-8 w-8 p-0 text-destructive ml-auto"
                  @click="removeBlock(index)"
                >
                  <Icon name="lucide:trash-2" class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showCreateModal = false">
            Cancelar
          </Button>
          <Button @click="createTemplate" :disabled="creating">
            <Icon v-if="creating" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
            <Icon v-else name="lucide:save" class="mr-2 h-4 w-4" />
            Crear Plantilla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
