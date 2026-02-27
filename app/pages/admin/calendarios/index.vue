<!-- pages/admin/calendarios/index.vue -->
<template>
  <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold">Gestión de Calendarios</h1>
        <p class="text-muted-foreground text-sm">
          Administra los calendarios escolares y eventos
        </p>
      </div>
      
      <div class="flex gap-2">
        <Button variant="outline" @click="showTemplateModal = true">
          <Icon name="lucide:copy" class="h-4 w-4 mr-2" />
          Desde Plantilla
        </Button>
        <Button @click="showCreateModal = true">
          <Icon name="lucide:plus" class="h-4 w-4 mr-2" />
          Nuevo Calendario
        </Button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="flex gap-4">
      <Select v-model="filters.type">
        <SelectTrigger class="w-[200px]">
          <SelectValue placeholder="Todos los tipos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="SCHOOL_YEAR">Calendario Escolar</SelectItem>
          <SelectItem value="EVALUATION">Evaluaciones</SelectItem>
          <SelectItem value="FREE_DISPOSITION">Libre Disposición</SelectItem>
          <SelectItem value="MEETINGS">Reuniones</SelectItem>
          <SelectItem value="TEMPLATE">Plantillas</SelectItem>
          <SelectItem value="OTHER">Otros</SelectItem>
        </SelectContent>
      </Select>
      
      <Select v-model="filters.academicYear">
        <SelectTrigger class="w-[180px]">
          <SelectValue placeholder="Año académico" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="year in academicYears" :key="year" :value="year">
            {{ year }}
          </SelectItem>
        </SelectContent>
      </Select>
      
      <Select v-model="filters.isActive">
        <SelectTrigger class="w-[150px]">
          <SelectValue placeholder="Todos los estados" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Activos</SelectItem>
          <SelectItem value="false">Inactivos</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      <span class="ml-2 text-muted-foreground">Cargando...</span>
    </div>

    <!-- Tabla de calendarios -->
    <Card v-else>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="text-left">Nombre</TableHead>
            <TableHead class="text-left">Tipo</TableHead>
            <TableHead class="text-left">Año</TableHead>
            <TableHead class="text-center">Eventos</TableHead>
            <TableHead class="text-left">Creado por</TableHead>
            <TableHead class="text-center">Activar/Desactivar</TableHead>
            <TableHead class="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="calendar in calendars" :key="calendar.id">
            <TableCell>
              <div class="font-medium">{{ calendar.name }}</div>
              <div class="text-xs text-muted-foreground truncate max-w-[200px]">
                {{ calendar.description || 'Sin descripción' }}
              </div>
            </TableCell>
            <TableCell>
              <Badge :variant="getTypeVariant(calendar.type)" class="text-xs">
                {{ getTypeLabel(calendar.type) }}
              </Badge>
            </TableCell>
            <TableCell>{{ calendar.academicYear }}</TableCell>
            <TableCell class="text-center">{{ calendar._count?.events || 0 }}</TableCell>
            <TableCell>
              <div class="text-sm">
                {{ calendar.createdBy?.firstName }} {{ calendar.createdBy?.lastName }}
              </div>
            </TableCell>
            <TableCell class="text-center">
              <!-- Toggle activo/inactivo con Switch -->
              <Switch
                :model-value="calendar.isActive"
                @update:model-value="() => toggleActive(calendar)"
                :disabled="toggling === calendar.id"
                class="data-[state=checked]:bg-amber-400 data-[state=unchecked]:bg-gray-200"
              />
            </TableCell>
            <TableCell class="text-right">
              <div class="flex items-center justify-end gap-2">
                <Button 
                  v-if="calendar.type === 'TEMPLATE'"
                  variant="ghost" 
                  size="sm"
                  @click="cloneFromTemplate(calendar)"
                  title="Clonar esta plantilla"
                >
                  <Icon name="lucide:copy" class="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  @click="editCalendar(calendar)"
                  title="Editar calendario"
                >
                  <Icon name="lucide:pencil" class="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  title="Gestionar días y eventos"
                  as-child
                >
                  <NuxtLink :to="`/admin/calendarios/${calendar.id}/dias`">
                    <Icon name="lucide:calendar-days" class="h-4 w-4" />
                  </NuxtLink>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  class="text-destructive"
                  @click="openDeleteModal(calendar)"
                  title="Eliminar calendario"
                >
                  <Icon name="lucide:trash-2" class="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>

    <!-- Modal de creación/edición -->
    <Dialog v-model:open="showCreateModal">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ editingCalendar ? 'Editar Calendario' : 'Nuevo Calendario' }}</DialogTitle>
          <DialogDescription>
            {{ editingCalendar ? 'Modifica los datos del calendario' : 'Crea un nuevo calendario para el curso' }}
          </DialogDescription>
        </DialogHeader>
        
        <form @submit.prevent="saveCalendar" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="name">Nombre</Label>
              <Input 
                id="name" 
                v-model="form.name" 
                placeholder="Calendario Escolar 2024-25"
                required
              />
            </div>
            
            <div class="space-y-2">
              <Label for="type">Tipo</Label>
              <Select v-model="form.type">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHOOL_YEAR">Calendario Escolar</SelectItem>
                  <SelectItem value="EVALUATION">Evaluaciones</SelectItem>
                  <SelectItem value="FREE_DISPOSITION">Libre Disposición</SelectItem>
                  <SelectItem value="MEETINGS">Reuniones</SelectItem>
                  <SelectItem value="TEMPLATE">Plantilla</SelectItem>
                  <SelectItem value="OTHER">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div class="space-y-2">
            <Label for="description">Descripción</Label>
            <Textarea 
              id="description" 
              v-model="form.description" 
              placeholder="Descripción del calendario..."
              rows="2"
            />
          </div>
          
          <div class="grid grid-cols-3 gap-4">
            <div class="space-y-2">
              <Label for="academicYear">Año Académico</Label>
              <Input 
                id="academicYear" 
                v-model="form.academicYear" 
                placeholder="2024-2025"
                pattern="\d{4}-\d{4}"
                required
              />
            </div>
            
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
              <Label for="endDate">Fecha fin</Label>
              <Input 
                id="endDate" 
                v-model="form.endDate" 
                type="date"
                required
              />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="maxEventsPerUser">Máx. eventos por usuario</Label>
              <Input 
                id="maxEventsPerUser" 
                v-model="form.maxEventsPerUser" 
                type="number"
                min="1"
                placeholder="4"
              />
              <p class="text-xs text-muted-foreground">
                Para calendarios de libre disposición
              </p>
            </div>
          </div>
          
          <div class="flex gap-4">
            <div class="flex items-center gap-2">
              <Switch id="isPublic" v-model="form.isPublic" />
              <Label for="isPublic" class="cursor-pointer">Público</Label>
            </div>
            
            <div class="flex items-center gap-2">
              <Switch id="allowDragDrop" v-model="form.allowDragDrop" />
              <Label for="allowDragDrop" class="cursor-pointer">Permitir drag-drop</Label>
            </div>
            
            <div class="flex items-center gap-2">
              <Switch id="isActive" v-model="form.isActive" />
              <Label for="isActive" class="cursor-pointer">Activo</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" @click="showCreateModal = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="saving">
              <Loader2 v-if="saving" class="h-4 w-4 mr-2 animate-spin" />
              {{ editingCalendar ? 'Guardar Cambios' : 'Crear Calendario' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal: Crear desde plantilla -->
    <Dialog v-model:open="showTemplateModal">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Calendario desde Plantilla</DialogTitle>
          <DialogDescription>
            Selecciona una plantilla y configura el nuevo calendario
          </DialogDescription>
        </DialogHeader>
        
        <div v-if="templatesLoading" class="flex items-center justify-center py-8">
          <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
          <span class="ml-2 text-muted-foreground">Cargando plantillas...</span>
        </div>
        
        <form v-else @submit.prevent="saveFromTemplate" class="space-y-4">
          <!-- Selección de plantilla -->
          <div class="space-y-2">
            <Label>Plantilla</Label>
            <Select v-model="templateForm.templateId" required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una plantilla" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem 
                  v-for="template in templates" 
                  :key="template.id" 
                  :value="template.id"
                >
                  {{ template.name }} ({{ template.academicYear }})
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="templates.length === 0" class="text-sm text-muted-foreground">
              No hay plantillas disponibles. Crea una plantilla primero.
            </p>
          </div>

          <!-- Información de la plantilla seleccionada -->
          <div v-if="selectedTemplate" class="bg-muted p-3 rounded-lg text-sm space-y-1">
            <p><strong>Descripción:</strong> {{ selectedTemplate.description || 'Sin descripción' }}</p>
            <p><strong>Año de la plantilla:</strong> {{ selectedTemplate.academicYear }}</p>
            <p><strong>Eventos incluidos:</strong> {{ selectedTemplate._count?.events || 0 }}</p>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="templateName">Nombre del nuevo calendario</Label>
              <Input 
                id="templateName" 
                v-model="templateForm.name" 
                placeholder="Calendario Escolar 2027-2028"
                required
              />
            </div>
            
            <div class="space-y-2">
              <Label for="templateType">Tipo</Label>
              <Select v-model="templateForm.type">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHOOL_YEAR">Calendario Escolar</SelectItem>
                  <SelectItem value="EVALUATION">Evaluaciones</SelectItem>
                  <SelectItem value="FREE_DISPOSITION">Libre Disposición</SelectItem>
                  <SelectItem value="MEETINGS">Reuniones</SelectItem>
                  <SelectItem value="OTHER">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div class="space-y-2">
            <Label for="templateDescription">Descripción</Label>
            <Textarea 
              id="templateDescription" 
              v-model="templateForm.description" 
              placeholder="Descripción del calendario..."
              rows="2"
            />
          </div>
          
          <div class="grid grid-cols-3 gap-4">
            <div class="space-y-2">
              <Label for="templateAcademicYear">Año Académico</Label>
              <Input 
                id="templateAcademicYear" 
                v-model="templateForm.academicYear" 
                placeholder="2027-2028"
                pattern="\d{4}-\d{4}"
                required
              />
              <p class="text-xs text-muted-foreground">
                Las fechas de los eventos se ajustarán automáticamente
              </p>
            </div>
            
            <div class="space-y-2">
              <Label for="templateStartDate">Fecha inicio</Label>
              <Input 
                id="templateStartDate" 
                v-model="templateForm.startDate" 
                type="date"
                required
              />
            </div>
            
            <div class="space-y-2">
              <Label for="templateEndDate">Fecha fin</Label>
              <Input 
                id="templateEndDate" 
                v-model="templateForm.endDate" 
                type="date"
                required
              />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="templateMaxEvents">Máx. eventos por usuario</Label>
              <Input 
                id="templateMaxEvents" 
                v-model="templateForm.maxEventsPerUser" 
                type="number"
                min="1"
                placeholder="4"
              />
              <p class="text-xs text-muted-foreground">
                Para calendarios de libre disposición
              </p>
            </div>
          </div>
          
          <div class="flex gap-4">
            <div class="flex items-center gap-2">
              <Switch id="templateIsPublic" v-model="templateForm.isPublic" />
              <Label for="templateIsPublic" class="cursor-pointer">Público</Label>
            </div>
            
            <div class="flex items-center gap-2">
              <Switch id="templateAllowDragDrop" v-model="templateForm.allowDragDrop" />
              <Label for="templateAllowDragDrop" class="cursor-pointer">Permitir drag-drop</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" @click="showTemplateModal = false">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              :disabled="cloning || !templateForm.templateId || templates.length === 0"
            >
              <Loader2 v-if="cloning" class="h-4 w-4 mr-2 animate-spin" />
              Crear desde Plantilla
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal: Confirmar eliminar calendario -->
    <ConfirmDialog
      v-model:open="showDeleteModal"
      title="Eliminar calendario"
      icon="lucide:trash-2"
      icon-class="text-destructive"
      confirm-text="Eliminar"
      confirm-variant="destructive"
      :loading="saving"
      @confirm="confirmDeleteCalendar"
    >
      <template #description>
        ¿Estás seguro de que deseas eliminar el calendario <strong>"{{ calendarToDelete?.name }}"</strong>?
        <br><br>
        Esta acción eliminará también todos los eventos asociados y no se puede deshacer.
      </template>
    </ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useCalendarsList, useCalendarCrud, useCalendarTemplates } from '~/composables/useCalendarApi'
import ConfirmDialog from '~/components/calendar/dialogs/ConfirmDialog.vue'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
  roles: ['ADMIN', 'ROOT'],
})

// Estado
const showCreateModal = ref(false)
const showTemplateModal = ref(false)
const showDeleteModal = ref(false)
const editingCalendar = ref<any>(null)
const calendarToDelete = ref<any>(null)
const toggling = ref<string | null>(null)

const filters = reactive({
  type: undefined as string | undefined,
  academicYear: undefined as string | undefined,
  isActive: 'true' as string | undefined,
})

const form = reactive({
  name: '',
  description: '',
  type: 'SCHOOL_YEAR',
  academicYear: '',
  startDate: '',
  endDate: '',
  isPublic: true,
  allowDragDrop: false,
  isActive: true,
  maxEventsPerUser: null as number | null,
})

const templateForm = reactive({
  templateId: '',
  name: '',
  description: '',
  type: 'SCHOOL_YEAR',
  academicYear: '',
  startDate: '',
  endDate: '',
  isPublic: true,
  allowDragDrop: false,
  maxEventsPerUser: null as number | null,
})

// Composables
const { calendars, pending, refresh } = useCalendarsList({
  type: toRef(filters, 'type'),
  academicYear: toRef(filters, 'academicYear'),
  isActive: toRef(filters, 'isActive')
})

const { 
  createCalendar, 
  updateCalendar, 
  deleteCalendar: deleteCalendarApi, 
  toggleCalendarActive,
  isLoading: crudLoading 
} = useCalendarCrud()

const { 
  templates, 
  pending: templatesLoading, 
  refresh: refreshTemplates, 
  cloneTemplate,
  isLoading: templateLoading 
} = useCalendarTemplates()

// Estados de carga computados
const saving = computed(() => crudLoading.value)
const cloning = computed(() => templateLoading.value)

// Año académico actual
const now = new Date()
const currentYear = now.getFullYear()
const academicYearStart = now.getMonth() >= 8 ? currentYear : currentYear - 1

const academicYears = computed(() => {
  const years = []
  for (let i = -2; i <= 2; i++) {
    const start = academicYearStart + i
    const end = start + 1
    years.push(`${start}-${end}`)
  }
  return years
})

// Templates computado


const selectedTemplate = computed(() => {
  return templates.value.find((t: any) => t.id === templateForm.templateId)
})

// Watch para actualizar fechas cuando cambia el año académico en template
watch(() => templateForm.academicYear, (newYear) => {
  if (newYear && newYear.match(/^\d{4}-\d{4}$/)) {
    const startYear = newYear.split('-')[0]
    templateForm.startDate = `${startYear}-09-01`
    templateForm.endDate = `${parseInt(startYear) + 1}-06-30`
  }
})

// Helpers
function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    'SCHOOL_YEAR': 'Escolar',
    'EVALUATION': 'Evaluaciones',
    'FREE_DISPOSITION': 'Libre Disp.',
    'MEETINGS': 'Reuniones',
    'TEMPLATE': 'Plantilla',
    'OTHER': 'Otros',
  }
  return labels[type] || type
}

function getTypeVariant(type: string): any {
  const variants: Record<string, any> = {
    'SCHOOL_YEAR': 'default',
    'EVALUATION': 'secondary',
    'FREE_DISPOSITION': 'outline',
    'MEETINGS': 'destructive',
    'TEMPLATE': 'warning',
    'OTHER': 'secondary',
  }
  return variants[type] || 'default'
}

function resetForm() {
  form.name = ''
  form.description = ''
  form.type = 'SCHOOL_YEAR'
  form.academicYear = `${academicYearStart}-${academicYearStart + 1}`
  form.startDate = ''
  form.endDate = ''
  form.isPublic = true
  form.allowDragDrop = false
  form.isActive = true
  form.maxEventsPerUser = null
}

function resetTemplateForm() {
  templateForm.templateId = ''
  templateForm.name = ''
  templateForm.description = ''
  templateForm.type = 'SCHOOL_YEAR'
  templateForm.academicYear = `${academicYearStart + 1}-${academicYearStart + 2}`
  templateForm.startDate = ''
  templateForm.endDate = ''
  templateForm.isPublic = true
  templateForm.allowDragDrop = false
  templateForm.maxEventsPerUser = null
}

function editCalendar(calendar: any) {
  editingCalendar.value = calendar
  form.name = calendar.name
  form.description = calendar.description || ''
  form.type = calendar.type
  form.academicYear = calendar.academicYear
  form.startDate = calendar.startDate.split('T')[0]
  form.endDate = calendar.endDate.split('T')[0]
  form.isPublic = calendar.isPublic
  form.allowDragDrop = calendar.allowDragDrop
  form.isActive = calendar.isActive
  form.maxEventsPerUser = calendar.maxEventsPerUser
  showCreateModal.value = true
}

function cloneFromTemplate(template: any) {
  resetTemplateForm()
  templateForm.templateId = template.id
  templateForm.name = template.name.replace(/\d{4}-\d{4}/, templateForm.academicYear)
  templateForm.description = template.description || ''
  templateForm.type = template.type === 'TEMPLATE' ? 'SCHOOL_YEAR' : template.type
  showTemplateModal.value = true
  refreshTemplates()
}

async function saveCalendar() {
  try {
    const payload = {
      name: form.name,
      description: form.description,
      type: form.type,
      academicYear: form.academicYear,
      startDate: form.startDate,
      endDate: form.endDate,
      isPublic: form.isPublic,
      allowDragDrop: form.allowDragDrop,
      maxEventsPerUser: form.maxEventsPerUser,
    }
    
    // Solo incluir isActive al crear, no al editar (se maneja con toggle)
    if (!editingCalendar.value) {
      payload.isActive = form.isActive
    }
    
    if (editingCalendar.value) {
      await updateCalendar(editingCalendar.value.id, payload)
      toast.success('Calendario actualizado')
    } else {
      await createCalendar(payload)
      toast.success('Calendario creado')
    }
    
    await refresh()
    showCreateModal.value = false
    editingCalendar.value = null
    resetForm()
  } catch (error: any) {
    toast.error(error.data?.message || 'Error al guardar')
  }
}

async function saveFromTemplate() {
  try {
    const payload = {
      name: templateForm.name,
      description: templateForm.description,
      academicYear: templateForm.academicYear,
      startDate: templateForm.startDate,
      endDate: templateForm.endDate,
      type: templateForm.type,
      isPublic: templateForm.isPublic,
      allowDragDrop: templateForm.allowDragDrop,
      maxEventsPerUser: templateForm.maxEventsPerUser,
    }
    
    await cloneTemplate(templateForm.templateId, payload)
    
    await refresh()
    showTemplateModal.value = false
    resetTemplateForm()
    toast.success('Calendario creado desde plantilla')
  } catch (error: any) {
    toast.error(error.data?.message || 'Error al clonar la plantilla')
  }
}

function openDeleteModal(calendar: any) {
  calendarToDelete.value = calendar
  showDeleteModal.value = true
}

async function confirmDeleteCalendar() {
  if (!calendarToDelete.value) return
  
  try {
    await deleteCalendarApi(calendarToDelete.value.id)
    await refresh()
    toast.success('Calendario eliminado')
  } catch (error: any) {
    toast.error(error.data?.message || 'Error al eliminar')
  } finally {
    showDeleteModal.value = false
    calendarToDelete.value = null
  }
}



async function toggleActive(calendar: any) {
  toggling.value = calendar.id
  
  try {
    await toggleCalendarActive(calendar.id, !calendar.isActive)
    await refresh()
    toast.success(calendar.isActive ? 'Calendario desactivado' : 'Calendario activado')
  } catch (error: any) {
    toast.error(error.data?.message || 'Error al cambiar el estado')
  } finally {
    toggling.value = null
  }
}

// Cargar plantillas cuando se abre el modal
watch(showTemplateModal, (isOpen) => {
  if (isOpen) {
    refreshTemplates()
  }
})

// Inicializar
resetForm()
</script>
