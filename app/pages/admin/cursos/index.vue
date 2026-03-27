<script setup lang="ts">
import { toast } from 'vue-sonner'
import { useAcademicYears } from '~/composables/useAcademicYears'
import type { AcademicYear } from '~/composables/useAcademicYears'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ConfirmDialog from '@/components/calendar/dialogs/ConfirmDialog.vue'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
  roles: ['ADMIN', 'ROOT']
})

const { 
  academicYears, 
  currentYear,
  loading,
  fetchAcademicYears, 
  fetchCurrentYear,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  rolloverSchedules,
  getStatusLabel,
  getStatusColor
} = useAcademicYears()

// Cargar datos
await fetchAcademicYears()
await fetchCurrentYear()

// Estados de modales
const showCreateModal = ref(false)
const showRolloverModal = ref(false)
const showDeleteModal = ref(false)
const selectedYear = ref<AcademicYear | null>(null)
const isSubmitting = ref(false)

// Formulario
const form = reactive({
  name: '',
  startDate: '',
  endDate: '',
  description: '',
  setAsActive: false
})

// Rollover
const rolloverTarget = ref('')
const isRollovering = ref(false)

// Resetear formulario
const resetForm = () => {
  form.name = ''
  form.startDate = ''
  form.endDate = ''
  form.description = ''
  form.setAsActive = false
}

// Sugerir fechas por defecto (1 sept - 31 julio)
const suggestDates = () => {
  const currentYear = new Date().getFullYear()
  form.startDate = `${currentYear}-09-01`
  form.endDate = `${currentYear + 1}-07-31`
  form.name = `${currentYear}-${currentYear + 1}`
}

// Abrir modal de creación
const openCreateModal = () => {
  resetForm()
  suggestDates()
  showCreateModal.value = true
}

// Abrir modal de rollover
const openRolloverModal = (year: AcademicYear) => {
  selectedYear.value = year
  rolloverTarget.value = ''
  showRolloverModal.value = true
}

// Abrir modal de eliminación
const openDeleteModal = (year: AcademicYear) => {
  selectedYear.value = year
  showDeleteModal.value = true
}

// Crear curso
const handleCreate = async () => {
  if (!form.name || !form.startDate || !form.endDate) {
    toast.error('Nombre y fechas son obligatorios')
    return
  }

  if (new Date(form.startDate) >= new Date(form.endDate)) {
    toast.error('La fecha de inicio debe ser anterior a la de fin')
    return
  }

  isSubmitting.value = true
  try {
    await createAcademicYear({
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description,
      setAsActive: form.setAsActive
    })
    showCreateModal.value = false
    resetForm()
  } finally {
    isSubmitting.value = false
  }
}

// Activar curso
const handleActivate = async (id: string) => {
  try {
    await updateAcademicYear(id, { isActive: true })
  } catch (err) {
    // Error ya mostrado en el composable
  }
}

// Cerrar curso
const handleClose = async (id: string) => {
  try {
    await updateAcademicYear(id, { isClosed: true, isActive: false })
    toast.success('Curso cerrado correctamente')
  } catch (err) {
    // Error ya mostrado
  }
}

// Ejecutar rollover
const handleRollover = async () => {
  if (!selectedYear.value || !rolloverTarget.value) return
  
  isRollovering.value = true
  try {
    await rolloverSchedules(selectedYear.value.id, rolloverTarget.value, { copyAll: true })
    showRolloverModal.value = false
    selectedYear.value = null
  } finally {
    isRollovering.value = false
  }
}

// Eliminar curso
const handleDelete = async () => {
  if (!selectedYear.value) return
  
  isSubmitting.value = true
  try {
    await deleteAcademicYear(selectedYear.value.id)
    showDeleteModal.value = false
    selectedYear.value = null
  } finally {
    isSubmitting.value = false
  }
}

// Formatear fecha
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Cursos disponibles para rollover (que no son el seleccionado y no están cerrados)
const availableTargets = computed(() => {
  if (!selectedYear.value) return []
  return academicYears.value.filter(y => 
    y.id !== selectedYear.value?.id && !y.isClosed
  )
})
</script>

<template>
  <div class="min-h-screen bg-background p-4 md:p-6">
    <div class="mx-auto max-w-7xl space-y-6">
      <!-- Header -->
      <LayoutPageHeader
        title="Cursos Académicos"
        description="Gestiona los cursos escolares y la reutilización de horarios"
      >
        <template #actions>
          <Button @click="openCreateModal">
            <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
            Nuevo Curso
          </Button>
        </template>
      </LayoutPageHeader>

      <!-- Curso Actual -->
      <Card v-if="currentYear" class="border-green-200 bg-green-50/30 py-2">
        <CardHeader class="pb-1">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Icon name="lucide:calendar-check" class="h-5 w-5 text-green-600" />
              <CardTitle class="text-base">Curso Activo</CardTitle>
            </div>
            <Badge class="bg-green-100 text-green-800">
              Activo
            </Badge>
          </div>
        </CardHeader>
        <CardContent class="py-0">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-2xl font-bold">{{ currentYear.name }}</p>
              <p class="text-sm text-muted-foreground">
                {{ formatDate(currentYear.startDate) }} - {{ formatDate(currentYear.endDate) }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-3xl font-bold">{{ currentYear._count?.schedules || 0 }}</p>
              <p class="text-sm text-muted-foreground">horarios</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card v-else class="border-amber-200 bg-amber-50/30">
        <CardContent class="py-6">
          <div class="flex items-center gap-3">
            <Icon name="lucide:alert-triangle" class="h-5 w-5 text-amber-600" />
            <p class="text-sm text-amber-800">
              No hay ningún curso académico activo. Crea uno nuevo o activa uno existente.
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- Lista de Cursos -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Todos los Cursos</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="flex items-center justify-center py-12">
            <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin text-muted-foreground" />
          </div>

          <div v-else-if="academicYears.length === 0" class="text-center py-12">
            <Icon name="lucide:calendar-x" class="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <p class="text-muted-foreground">No hay cursos académicos creados</p>
          </div>

          <div v-else class="space-y-3">
            <div 
              v-for="year in academicYears" 
              :key="year.id"
              class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              :class="year.isActive ? 'border-green-200 bg-green-50/10' : ''"
            >
              <div class="flex items-center gap-4">
                <div 
                  class="w-2 h-2 rounded-full"
                  :class="year.isActive ? 'bg-green-500' : year.isClosed ? 'bg-gray-400' : 'bg-amber-400'"
                />
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ year.name }}</span>
                    <Badge :class="getStatusColor(year)" class="text-xs">
                      {{ getStatusLabel(year) }}
                    </Badge>
                  </div>
                  <p class="text-sm text-muted-foreground">
                    {{ formatDate(year.startDate) }} - {{ formatDate(year.endDate) }}
                  </p>
                  <p class="text-xs text-muted-foreground mt-1">
                    {{ year._count?.schedules || 0 }} horarios asociados
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <!-- Activar -->
                <Button 
                  v-if="!year.isActive && !year.isClosed"
                  variant="outline" 
                  size="sm"
                  @click="handleActivate(year.id)"
                >
                  <Icon name="lucide:play" class="h-4 w-4 mr-1" />
                  Activar
                </Button>

                <!-- Rollover -->
                <Button 
                  v-if="!year.isActive && year._count && year._count.schedules > 0"
                  variant="outline" 
                  size="sm"
                  @click="openRolloverModal(year)"
                >
                  <Icon name="lucide:copy" class="h-4 w-4 mr-1" />
                  Reutilizar horarios
                </Button>

                <!-- Cerrar -->
                <Button 
                  v-if="year.isActive"
                  variant="outline" 
                  size="sm"
                  class="text-amber-600 border-amber-300"
                  @click="handleClose(year.id)"
                >
                  <Icon name="lucide:lock" class="h-4 w-4 mr-1" />
                  Cerrar curso
                </Button>

                <!-- Eliminar -->
                <Button 
                  v-if="!year.isActive && (year._count?.schedules || 0) === 0"
                  variant="ghost" 
                  size="icon"
                  class="text-destructive hover:text-destructive"
                  @click="openDeleteModal(year)"
                >
                  <Icon name="lucide:trash-2" class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Modal de Creación -->
      <Dialog v-model:open="showCreateModal">
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Curso Académico</DialogTitle>
            <DialogDescription>
              Define el período del curso escolar
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <Label for="name">Nombre del curso</Label>
              <Input 
                id="name" 
                v-model="form.name" 
                placeholder="ej: 2025-2026"
              />
              <p class="text-xs text-muted-foreground">Formato recomendado: AAAA-AAAA</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="startDate">Fecha inicio</Label>
                <Input 
                  id="startDate" 
                  v-model="form.startDate" 
                  type="date"
                />
              </div>
              <div class="space-y-2">
                <Label for="endDate">Fecha fin</Label>
                <Input 
                  id="endDate" 
                  v-model="form.endDate" 
                  type="date"
                />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="description">Descripción (opcional)</Label>
              <Input 
                id="description" 
                v-model="form.description" 
                placeholder="Notas sobre el curso..."
              />
            </div>

            <div class="flex items-center gap-2">
              <input 
                id="setAsActive" 
                v-model="form.setAsActive" 
                type="checkbox"
                class="rounded border-gray-300"
              />
              <Label for="setAsActive" class="text-sm cursor-pointer">
                Establecer como curso activo
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="showCreateModal = false">
              Cancelar
            </Button>
            <Button 
              @click="handleCreate" 
              :disabled="isSubmitting"
            >
              <Icon v-if="isSubmitting" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
              Crear Curso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Modal de Rollover -->
      <Dialog v-model:open="showRolloverModal">
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reutilizar Horarios</DialogTitle>
            <DialogDescription>
              Copia los horarios de {{ selectedYear?.name }} a otro curso
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-4 py-4">
            <div class="p-3 bg-muted rounded-md">
              <p class="text-sm font-medium">Curso origen: {{ selectedYear?.name }}</p>
              <p class="text-xs text-muted-foreground">
                {{ selectedYear?._count?.schedules || 0 }} horarios serán copiados
              </p>
            </div>

            <div class="space-y-2">
              <Label>Curso destino</Label>
              <Select v-model="rolloverTarget">
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un curso..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem 
                    v-for="year in availableTargets" 
                    :key="year.id" 
                    :value="year.id"
                  >
                    {{ year.name }}
                    <span v-if="year.isActive" class="text-green-600 ml-2">(Activo)</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p class="text-xs text-muted-foreground">
                Los horarios se copiarán como "Borrador" y podrán ser modificados.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="showRolloverModal = false">
              Cancelar
            </Button>
            <Button 
              @click="handleRollover" 
              :disabled="!rolloverTarget || isRollovering"
            >
              <Icon v-if="isRollovering" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
              <Icon v-else name="lucide:copy" class="mr-2 h-4 w-4" />
              Copiar Horarios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Modal de Confirmar Eliminación -->
      <ConfirmDialog
        v-model:open="showDeleteModal"
        :title="`Eliminar curso '${selectedYear?.name}'`"
        icon="lucide:trash-2"
        icon-class="text-destructive"
        confirm-variant="destructive"
        :loading="isSubmitting"
        @confirm="handleDelete"
      >
        <p>¿Estás seguro de que deseas eliminar este curso académico?</p>
        <p class="text-sm text-muted-foreground mt-2">
          Esta acción no se puede deshacer. Solo se pueden eliminar cursos sin horarios asociados.
        </p>
      </ConfirmDialog>
    </div>
  </div>
</template>
