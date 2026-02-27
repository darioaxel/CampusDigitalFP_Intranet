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
        <Button @click="openCreateModal">
          <Icon name="lucide:plus" class="h-4 w-4 mr-2" />
          Nuevo Calendario
        </Button>
      </div>
    </div>

    <!-- DataTable con TanStack Table -->
    <Card>
      <CardHeader class="pb-4">
        <!-- Toolbar con filtros -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <div class="flex flex-1 items-center gap-2">
              <!-- Filtro de búsqueda -->
              <Input
                placeholder="Buscar por nombre..."
                class="h-8 w-[200px] lg:w-[300px]"
                :model-value="(table?.getColumn('name')?.getFilterValue() as string) ?? ''"
                @update:model-value="table?.getColumn('name')?.setFilterValue($event)"
              />

              <!-- Filtro por tipo -->
              <Select
                :model-value="(table?.getColumn('type')?.getFilterValue() as string[]) ?? []"
                @update:model-value="table?.getColumn('type')?.setFilterValue($event?.length ? $event : undefined)"
              >
                <SelectTrigger class="h-8 w-[150px]">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHOOL_YEAR">Escolar</SelectItem>
                  <SelectItem value="EVALUATION">Evaluaciones</SelectItem>
                  <SelectItem value="FREE_DISPOSITION">Libre Disp.</SelectItem>
                  <SelectItem value="MEETINGS">Reuniones</SelectItem>
                  <SelectItem value="TEMPLATE">Plantillas</SelectItem>
                  <SelectItem value="OTHER">Otros</SelectItem>
                </SelectContent>
              </Select>

              <!-- Filtro por año -->
              <Select
                :model-value="(table?.getColumn('academicYear')?.getFilterValue() as string) ?? ''"
                @update:model-value="table?.getColumn('academicYear')?.setFilterValue($event)"
              >
                <SelectTrigger class="h-8 w-[140px]">
                  <SelectValue placeholder="Año académico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="year in academicYears"
                    :key="year"
                    :value="year"
                  >
                    {{ year }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <!-- Botón limpiar filtros -->
              <Button
                v-if="table?.getState().columnFilters.length > 0"
                variant="ghost"
                size="sm"
                class="h-8 px-2"
                @click="table?.resetColumnFilters()"
              >
                <Icon name="lucide:x" class="mr-1 h-4 w-4" />
                Limpiar
              </Button>
            </div>

            <!-- Selector de columnas -->
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="outline"
                  size="sm"
                  class="ml-auto hidden h-8 lg:flex"
                >
                  <Icon name="lucide:sliders-horizontal" class="mr-2 h-4 w-4" />
                  Ver
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-[180px]">
                <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  v-for="column in table?.getAllColumns().filter((col) => col.getCanHide())"
                  :key="column.id"
                  class="capitalize"
                  :model-value="column.getIsVisible()"
                  @update:model-value="(value) => column.toggleVisibility(!!value)"
                >
                  {{ columnNames[column.id] || column.id }}
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>


        </div>
      </CardHeader>

      <CardContent>
        <!-- Loading -->
        <div v-if="pending" class="flex items-center justify-center py-12">
          <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
          <span class="ml-2 text-muted-foreground">Cargando...</span>
        </div>

        <!-- Tabla TanStack -->
        <DataTable
          v-else
          ref="dataTableRef"
          :columns="columns"
          :data="calendars || []"
        />
      </CardContent>
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
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useCalendarsList, useCalendarCrud, useCalendarTemplates } from '~/composables/useCalendarApi'
import ConfirmDialog from '~/components/calendar/dialogs/ConfirmDialog.vue'
import DataTable from '~/components/data-table/DataTable.vue'
import { columns, columnNames, type CalendarWithRelations } from '~/components/calendars/columns'
import type { Table } from '@tanstack/vue-table'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
  roles: ['ADMIN', 'ROOT'],
})

// Estado de la tabla
const dataTableRef = ref<{ table: Table<CalendarWithRelations> } | null>(null)
const table = computed(() => dataTableRef.value?.table)

// Estado de modales
const showCreateModal = ref(false)
const showTemplateModal = ref(false)
const showDeleteModal = ref(false)
const editingCalendar = ref<CalendarWithRelations | null>(null)
const calendarToDelete = ref<CalendarWithRelations | null>(null)

// Formularios
const form = reactive({
  name: '',
  description: '',
  type: 'SCHOOL_YEAR' as const,
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
  type: 'SCHOOL_YEAR' as const,
  academicYear: '',
  startDate: '',
  endDate: '',
  isPublic: true,
  allowDragDrop: false,
  maxEventsPerUser: null as number | null,
})

// Composables
const { calendars, pending, refresh } = useCalendarsList({
  isActive: ref('true'),
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

// Estados computados
const saving = computed(() => crudLoading.value)
const cloning = computed(() => templateLoading.value)

// Años académicos
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

// Funciones de ayuda
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

function openCreateModal() {
  editingCalendar.value = null
  resetForm()
  showCreateModal.value = true
}

function editCalendar(calendar: CalendarWithRelations) {
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

function cloneFromTemplate(calendar: CalendarWithRelations) {
  resetTemplateForm()
  templateForm.templateId = calendar.id
  templateForm.name = calendar.name.replace(/\d{4}-\d{4}/, templateForm.academicYear)
  templateForm.description = calendar.description || ''
  templateForm.type = calendar.type === 'TEMPLATE' ? 'SCHOOL_YEAR' : calendar.type
  showTemplateModal.value = true
  refreshTemplates()
}

function openDeleteModal(calendar: CalendarWithRelations) {
  calendarToDelete.value = calendar
  showDeleteModal.value = true
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
      Object.assign(payload, { isActive: form.isActive })
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

async function toggleActive(calendar: CalendarWithRelations) {
  try {
    await toggleCalendarActive(calendar.id, !calendar.isActive)
    await refresh()
    toast.success(calendar.isActive ? 'Calendario desactivado' : 'Calendario activado')
  } catch (error: any) {
    toast.error(error.data?.message || 'Error al cambiar el estado')
  }
}

// Event listeners para acciones de la tabla
function handleEdit(event: CustomEvent<CalendarWithRelations>) {
  editCalendar(event.detail)
}

function handleDelete(event: CustomEvent<CalendarWithRelations>) {
  openDeleteModal(event.detail)
}

function handleClone(event: CustomEvent<CalendarWithRelations>) {
  cloneFromTemplate(event.detail)
}

function handleToggleActive(event: CustomEvent<CalendarWithRelations>) {
  toggleActive(event.detail)
}

onMounted(() => {
  document.addEventListener('calendar:edit', handleEdit as EventListener)
  document.addEventListener('calendar:delete', handleDelete as EventListener)
  document.addEventListener('calendar:clone', handleClone as EventListener)
  document.addEventListener('calendar:toggle-active', handleToggleActive as EventListener)
  resetForm()
})

onUnmounted(() => {
  document.removeEventListener('calendar:edit', handleEdit as EventListener)
  document.removeEventListener('calendar:delete', handleDelete as EventListener)
  document.removeEventListener('calendar:clone', handleClone as EventListener)
  document.removeEventListener('calendar:toggle-active', handleToggleActive as EventListener)
})

// Cargar plantillas cuando se abre el modal
watch(showTemplateModal, (isOpen) => {
  if (isOpen) {
    refreshTemplates()
  }
})
</script>
