<script setup lang="ts">
import { toast } from 'vue-sonner'
import { useScheduleAdmin } from '~/composables/useScheduleAdmin'
import type { ScheduleTemplate, ScheduleFormData } from '~/composables/useScheduleAdmin'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

// Composable
const { 
  templates, 
  loading, 
  scheduleTypes, 
  presetColors,
  fetchTemplates, 
  createTemplate, 
  deleteTemplate,
  cloneTemplate,
  createBaseBlocks,
  createAfternoonBlocks,
  sortBlocks,
  hasOverlap
} = useScheduleAdmin()

// Cargar datos iniciales
await fetchTemplates()

// Estados de modales
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showPreviewModal = ref(false)
const selectedTemplate = ref<ScheduleTemplate | null>(null)
const isSubmitting = ref(false)

// Formulario
const form = reactive<ScheduleFormData>({
  name: '',
  type: 'NORMAL',
  description: '',
  color: '#3b82f6',
  isActive: true,
  validFrom: '',
  validUntil: '',
  blocks: []
})

// Resetear formulario
const resetForm = () => {
  form.name = ''
  form.type = 'NORMAL'
  form.description = ''
  form.color = '#3b82f6'
  form.isActive = true
  form.validFrom = ''
  form.validUntil = ''
  form.blocks = []
}

// Abrir modal de creación
const openCreateModal = () => {
  resetForm()
  showCreateModal.value = true
}

// Abrir modal de edición
const openEditModal = (template: ScheduleTemplate) => {
  selectedTemplate.value = template
  form.name = template.name
  form.type = template.type
  form.description = template.description || ''
  form.color = template.color || '#3b82f6'
  form.isActive = template.isActive
  form.validFrom = template.validFrom ? template.validFrom.split('T')[0] : ''
  form.validUntil = template.validUntil ? template.validUntil.split('T')[0] : ''
  form.blocks = template.blocks.map(b => ({
    dayOfWeek: b.dayOfWeek,
    startTime: b.startTime,
    endTime: b.endTime,
    subject: b.subject || '',
    room: b.room || '',
    isBreak: b.isBreak
  }))
  showEditModal.value = true
}

// Abrir modal de preview
const openPreviewModal = (template: ScheduleTemplate) => {
  selectedTemplate.value = template
  showPreviewModal.value = true
}

// Abrir modal de eliminación
const openDeleteModal = (template: ScheduleTemplate) => {
  selectedTemplate.value = template
  showDeleteModal.value = true
}

// Crear template base mañanas
const loadBaseMorningTemplate = () => {
  form.name = 'Horario Base Mañanas'
  form.type = 'NORMAL'
  form.blocks = createBaseBlocks()
  showCreateModal.value = true
}

// Crear template base tardes
const loadBaseAfternoonTemplate = () => {
  form.name = 'Horario Base Tardes'
  form.type = 'NORMAL'
  form.blocks = createAfternoonBlocks()
  showCreateModal.value = true
}

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
const sortFormBlocks = () => {
  form.blocks = sortBlocks(form.blocks)
  toast.success('Bloques ordenados')
}

// Validar y guardar
const handleCreate = async () => {
  if (!form.name.trim()) {
    toast.error('El nombre es obligatorio')
    return
  }

  if (form.blocks.length === 0) {
    toast.error('Debes agregar al menos un bloque')
    return
  }

  // Validar solapamientos
  const overlap = hasOverlap(form.blocks)
  if (overlap.hasOverlap) {
    toast.error('Hay solapamientos en los bloques', {
      description: overlap.conflicts[0]
    })
    return
  }

  isSubmitting.value = true
  try {
    await createTemplate(form)
    showCreateModal.value = false
    resetForm()
  } finally {
    isSubmitting.value = false
  }
}

// Actualizar template
const handleUpdate = async () => {
  if (!selectedTemplate.value) return
  
  if (!form.name.trim()) {
    toast.error('El nombre es obligatorio')
    return
  }

  if (form.blocks.length === 0) {
    toast.error('Debes agregar al menos un bloque')
    return
  }

  // Validar solapamientos
  const overlap = hasOverlap(form.blocks)
  if (overlap.hasOverlap) {
    toast.error('Hay solapamientos en los bloques', {
      description: overlap.conflicts[0]
    })
    return
  }

  isSubmitting.value = true
  try {
    await updateTemplate(selectedTemplate.value.id, { ...form })
    showEditModal.value = false
    resetForm()
  } finally {
    isSubmitting.value = false
  }
}

// Confirmar eliminación
const handleDelete = async () => {
  if (!selectedTemplate.value) return
  
  isSubmitting.value = true
  try {
    await deleteTemplate(selectedTemplate.value.id)
    showDeleteModal.value = false
    selectedTemplate.value = null
  } finally {
    isSubmitting.value = false
  }
}

// Clonar template
const handleClone = async (template: ScheduleTemplate) => {
  await cloneTemplate(template.id)
}

// Estadísticas
const stats = computed(() => {
  const total = templates.value.length
  const active = templates.value.filter(t => t.isActive).length
  const inactive = total - active
  const totalBlocks = templates.value.reduce((sum, t) => sum + (t.blocks?.length || 0), 0)
  
  return { total, active, inactive, totalBlocks }
})

// Helpers
const getTypeLabel = (type: string) => {
  return scheduleTypes.find(t => t.value === type)?.label || type
}

const getDaysCount = (blocks: any[]) => {
  const days = new Set(blocks.map(b => b.dayOfWeek))
  return days.size
}

const getTimeRange = (blocks: any[]) => {
  if (!blocks.length) return '-'
  const times = blocks.map(b => b.startTime).sort()
  const endTimes = blocks.map(b => b.endTime).sort()
  return `${times[0]} - ${endTimes[endTimes.length - 1]}`
}
</script>

<template>
  <div class="min-h-screen bg-background p-4 md:p-6">
    <div class="mx-auto max-w-7xl space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-foreground">
            Gestionar Horarios
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            Crea y administra plantillas de horarios para los profesores
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline">
                <Icon name="lucide:copy" class="mr-2 h-4 w-4" />
                Templates Base
                <Icon name="lucide:chevron-down" class="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="loadBaseMorningTemplate">
                <Icon name="lucide:sun" class="mr-2 h-4 w-4" />
                Horario Mañanas (8:00-14:30)
              </DropdownMenuItem>
              <DropdownMenuItem @click="loadBaseAfternoonTemplate">
                <Icon name="lucide:sunset" class="mr-2 h-4 w-4" />
                Horario Tardes (15:00-20:30)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button @click="openCreateModal">
            <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
            Nueva Plantilla
          </Button>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader class="pb-2">
            <CardDescription>Total Plantillas</CardDescription>
            <CardTitle class="text-3xl">{{ stats.total }}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader class="pb-2">
            <CardDescription>Activas</CardDescription>
            <CardTitle class="text-3xl text-green-600">{{ stats.active }}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader class="pb-2">
            <CardDescription>Inactivas</CardDescription>
            <CardTitle class="text-3xl text-muted-foreground">{{ stats.inactive }}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader class="pb-2">
            <CardDescription>Total Bloques</CardDescription>
            <CardTitle class="text-3xl">{{ stats.totalBlocks }}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin text-muted-foreground" />
      </div>

      <!-- Grid de Templates -->
      <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card 
          v-for="template in templates" 
          :key="template.id"
          :class="[
            'transition-all hover:shadow-md',
            !template.isActive && 'opacity-60'
          ]"
        >
          <CardHeader class="pb-3">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2 min-w-0">
                <div 
                  class="h-3 w-3 rounded-full shrink-0" 
                  :style="{ backgroundColor: template.color || '#3b82f6' }"
                />
                <CardTitle class="text-base truncate">{{ template.name }}</CardTitle>
              </div>
              <div class="flex gap-1 shrink-0">
                <Button 
                  variant="ghost" 
                  size="icon"
                  class="h-8 w-8"
                  @click="openPreviewModal(template)"
                  title="Ver detalle"
                >
                  <Icon name="lucide:eye" class="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  class="h-8 w-8"
                  @click="handleClone(template)"
                  title="Clonar"
                >
                  <Icon name="lucide:copy" class="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  class="h-8 w-8 text-destructive hover:text-destructive"
                  @click="openDeleteModal(template)"
                  title="Eliminar"
                >
                  <Icon name="lucide:trash-2" class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription v-if="template.description" class="text-xs mt-1 line-clamp-2">
              {{ template.description }}
            </CardDescription>
          </CardHeader>
          
          <CardContent class="pt-0">
            <div class="space-y-2 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Tipo:</span>
                <Badge variant="outline" class="text-xs">{{ getTypeLabel(template.type) }}</Badge>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Bloques:</span>
                <Badge variant="secondary">{{ template.blocks?.length || 0 }}</Badge>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Días:</span>
                <span class="text-xs">{{ getDaysCount(template.blocks) }} días</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Horario:</span>
                <span class="text-xs font-mono">{{ getTimeRange(template.blocks) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Estado:</span>
                <Badge 
                  :variant="template.isActive ? 'default' : 'secondary'"
                  class="text-xs"
                >
                  {{ template.isActive ? 'Activa' : 'Inactiva' }}
                </Badge>
              </div>
            </div>

            <!-- Preview miniatura -->
            <div class="mt-4 pt-3 border-t">
              <div class="grid grid-cols-5 gap-1">
                <div 
                  v-for="day in ['L', 'M', 'X', 'J', 'V']" 
                  :key="day"
                  class="text-center text-[10px] text-muted-foreground font-medium"
                >
                  {{ day }}
                </div>
              </div>
              <div class="grid grid-cols-5 gap-1 mt-1">
                <div 
                  v-for="day in ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']" 
                  :key="day"
                  class="aspect-square rounded-sm flex items-center justify-center"
                  :class="template.blocks?.some((b: any) => b.dayOfWeek === day) 
                    ? 'bg-primary/20' 
                    : 'bg-muted'"
                >
                  <div 
                    v-if="template.blocks?.some((b: any) => b.dayOfWeek === day)"
                    class="w-1.5 h-1.5 rounded-full bg-primary"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter class="pt-0">
            <Button 
              variant="ghost" 
              size="sm" 
              class="w-full text-xs"
              @click="openEditModal(template)"
            >
              <Icon name="lucide:pencil" class="mr-2 h-3 w-3" />
              Editar Plantilla
            </Button>
          </CardFooter>
        </Card>
      </div>

      <!-- Empty state -->
      <div v-if="!loading && templates.length === 0" class="flex flex-col items-center justify-center py-16">
        <div class="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon name="lucide:layout-template" class="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 class="text-lg font-medium">No hay plantillas creadas</h3>
        <p class="text-muted-foreground text-sm mt-1 mb-4">
          Crea plantillas para que los profesores puedan usarlas como base
        </p>
        <div class="flex gap-2">
          <Button variant="outline" @click="loadBaseMorningTemplate">
            <Icon name="lucide:copy" class="mr-2 h-4 w-4" />
            Usar Template Base
          </Button>
          <Button @click="openCreateModal">
            <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
            Crear desde cero
          </Button>
        </div>
      </div>
    </div>

    <!-- Modal de Creación -->
    <ScheduleTemplateFormDialog
      v-model:open="showCreateModal"
      title="Nueva Plantilla de Horario"
      description="Define las franjas horarias que los profesores podrán usar como base"
      v-model:form="form"
      :is-submitting="isSubmitting"
      @submit="handleCreate"
      @add-block="addBlock"
      @remove-block="removeBlock"
      @sort-blocks="sortFormBlocks"
    />

    <!-- Modal de Edición -->
    <ScheduleTemplateFormDialog
      v-model:open="showEditModal"
      title="Editar Plantilla"
      description="Modifica la configuración de la plantilla"
      v-model:form="form"
      :is-submitting="isSubmitting"
      @submit="handleUpdate"
      @add-block="addBlock"
      @remove-block="removeBlock"
      @sort-blocks="sortFormBlocks"
    />

    <!-- Modal de Preview -->
    <ScheduleTemplatePreviewDialog
      v-model:open="showPreviewModal"
      :template="selectedTemplate"
      @edit="openEditModal(selectedTemplate!)"
      @clone="handleClone(selectedTemplate!)"
    />

    <!-- Modal de Confirmar Eliminación -->
    <ConfirmDialog
      v-model:open="showDeleteModal"
      :title="`Eliminar '${selectedTemplate?.name}'`"
      icon="lucide:trash-2"
      icon-class="text-destructive"
      confirm-variant="destructive"
      :loading="isSubmitting"
      @confirm="handleDelete"
    >
      <template #description>
        <p>¿Estás seguro de que deseas eliminar esta plantilla?</p>
        <p class="text-sm text-muted-foreground mt-2">
          Esta acción no se puede deshacer. Los profesores que hayan usado esta plantilla 
          conservarán sus horarios, pero no podrán crear nuevos desde esta plantilla.
        </p>
        <div v-if="selectedTemplate?.blocks?.length" class="mt-3 p-3 bg-muted rounded-md">
          <p class="text-xs text-muted-foreground">
            Contiene {{ selectedTemplate.blocks.length }} bloques definidos
          </p>
        </div>
      </template>
    </ConfirmDialog>
  </div>
</template>
