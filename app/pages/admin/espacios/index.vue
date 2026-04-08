<script setup lang="ts">
import { toast } from 'vue-sonner'
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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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

// Tipos
interface Espacio {
  id: string
  nombre: string
  planta: number
  observaciones: string | null
  scheduleId: string | null
  schedule: {
    id: string
    name: string
    type: string
  } | null
  createdAt: string
  updatedAt: string
}

interface HorarioDisponible {
  id: string
  name: string
  type: string
  description: string | null
  user: {
    firstName: string
    lastName: string
  } | null
  academicYear: {
    name: string
  } | null
  _count: {
    blocks: number
  }
}

// Estados
const espacios = ref<Espacio[]>([])
const horariosDisponibles = ref<HorarioDisponible[]>([])
const loading = ref(false)
const isSubmitting = ref(false)

// Modales
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedEspacio = ref<Espacio | null>(null)

// Formulario
const form = reactive({
  nombre: '',
  planta: 0,
  observaciones: '',
  scheduleId: null as string | null
})

// Cargar datos
const fetchEspacios = async () => {
  loading.value = true
  try {
    const { data } = await $fetch<{ success: boolean; data: Espacio[] }>('/api/espacios')
    espacios.value = data
  } catch (error: any) {
    toast.error('Error al cargar los espacios')
  } finally {
    loading.value = false
  }
}

const fetchHorariosDisponibles = async (excludeEspacioId?: string) => {
  try {
    const params = excludeEspacioId ? `?excludeEspacioId=${excludeEspacioId}` : ''
    const { data } = await $fetch<{ success: boolean; data: HorarioDisponible[] }>(`/api/espacios/horarios-disponibles${params}`)
    horariosDisponibles.value = data
  } catch (error: any) {
    toast.error('Error al cargar los horarios disponibles')
  }
}

// Resetear formulario
const resetForm = () => {
  form.nombre = ''
  form.planta = 0
  form.observaciones = ''
  form.scheduleId = null
}

// Abrir modal de creación
const openCreateModal = async () => {
  resetForm()
  await fetchHorariosDisponibles()
  showCreateModal.value = true
}

// Abrir modal de edición
const openEditModal = async (espacio: Espacio) => {
  selectedEspacio.value = espacio
  form.nombre = espacio.nombre
  form.planta = espacio.planta
  form.observaciones = espacio.observaciones || ''
  form.scheduleId = espacio.scheduleId
  await fetchHorariosDisponibles(espacio.id)
  showEditModal.value = true
}

// Abrir modal de eliminación
const openDeleteModal = (espacio: Espacio) => {
  selectedEspacio.value = espacio
  showDeleteModal.value = true
}

// Crear espacio
const handleCreate = async () => {
  if (!form.nombre.trim()) {
    toast.error('El nombre del espacio es obligatorio')
    return
  }

  isSubmitting.value = true
  try {
    await $fetch('/api/espacios', {
      method: 'POST',
      body: {
        nombre: form.nombre.trim(),
        planta: form.planta,
        observaciones: form.observaciones.trim() || undefined,
        scheduleId: form.scheduleId || undefined
      }
    })
    toast.success('Espacio creado correctamente')
    showCreateModal.value = false
    resetForm()
    await fetchEspacios()
  } catch (error: any) {
    toast.error(error.statusMessage || 'Error al crear el espacio')
  } finally {
    isSubmitting.value = false
  }
}

// Actualizar espacio
const handleUpdate = async () => {
  if (!selectedEspacio.value) return
  if (!form.nombre.trim()) {
    toast.error('El nombre del espacio es obligatorio')
    return
  }

  isSubmitting.value = true
  try {
    await $fetch(`/api/espacios/${selectedEspacio.value.id}`, {
      method: 'PUT',
      body: {
        nombre: form.nombre.trim(),
        planta: form.planta,
        observaciones: form.observaciones.trim() || null,
        scheduleId: form.scheduleId
      }
    })
    toast.success('Espacio actualizado correctamente')
    showEditModal.value = false
    selectedEspacio.value = null
    resetForm()
    await fetchEspacios()
  } catch (error: any) {
    toast.error(error.statusMessage || 'Error al actualizar el espacio')
  } finally {
    isSubmitting.value = false
  }
}

// Eliminar espacio
const handleDelete = async () => {
  if (!selectedEspacio.value) return

  isSubmitting.value = true
  try {
    await $fetch(`/api/espacios/${selectedEspacio.value.id}`, {
      method: 'DELETE'
    })
    toast.success('Espacio eliminado correctamente')
    showDeleteModal.value = false
    selectedEspacio.value = null
    await fetchEspacios()
  } catch (error: any) {
    toast.error(error.statusMessage || 'Error al eliminar el espacio')
  } finally {
    isSubmitting.value = false
  }
}

// Helper para mostrar tipo de horario
const getScheduleTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'NORMAL': 'Normal',
    'EXPERTO': 'Experto',
    'EXAMENES': 'Exámenes',
    'EXTRAORDINARIO': 'Extraordinario',
    'GUARDIA': 'Guardia',
    'REFUERZO': 'Refuerzo'
  }
  return labels[type] || type
}

// Helper para color de badge según planta
const getPlantaBadgeColor = (planta: number) => {
  const colors: Record<number, string> = {
    0: 'bg-blue-100 text-blue-800',
    1: 'bg-green-100 text-green-800',
    2: 'bg-amber-100 text-amber-800',
    3: 'bg-purple-100 text-purple-800'
  }
  return colors[planta] || 'bg-gray-100 text-gray-800'
}

// Agrupar espacios por planta
const espaciosPorPlanta = computed(() => {
  const grouped: Record<number, Espacio[]> = {}
  espacios.value.forEach(espacio => {
    if (!grouped[espacio.planta]) {
      grouped[espacio.planta] = []
    }
    grouped[espacio.planta].push(espacio)
  })
  return grouped
})

// Plantas ordenadas
const plantasOrdenadas = computed(() => {
  return Object.keys(espaciosPorPlanta.value)
    .map(Number)
    .sort((a, b) => a - b)
})

// Cargar datos iniciales
await fetchEspacios()
</script>

<template>
  <div>
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <LayoutPageHeader
        title="Gestión de Espacios"
        description="Gestiona las salas, cabinas y espacios del centro"
      >
        <template #actions>
          <Button @click="openCreateModal">
            <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
            Nuevo Espacio
          </Button>
        </template>
      </LayoutPageHeader>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin text-muted-foreground" />
      </div>

      <!-- Contenido por plantas -->
      <div v-else-if="espacios.length > 0" class="space-y-8">
        <div v-for="planta in plantasOrdenadas" :key="planta">
          <!-- Título de planta -->
          <div class="flex items-center gap-2 mb-4">
            <Icon name="lucide:building-2" class="h-5 w-5 text-muted-foreground" />
            <h2 class="text-lg font-semibold">
              Planta {{ planta }}
            </h2>
            <Badge :class="getPlantaBadgeColor(planta)" class="text-xs">
              {{ espaciosPorPlanta[planta].length }} espacios
            </Badge>
          </div>

          <!-- Grid de espacios -->
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card 
              v-for="espacio in espaciosPorPlanta[planta]"
              :key="espacio.id"
              class="hover:border-primary transition-colors"
            >
              <CardHeader class="pb-3">
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-2">
                    <div class="bg-primary/10 p-2 rounded-lg">
                      <Icon name="lucide:door-open" class="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle class="text-base">{{ espacio.nombre }}</CardTitle>
                      <CardDescription class="text-xs">
                        Planta {{ espacio.planta }}
                      </CardDescription>
                    </div>
                  </div>
                  <div class="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      class="h-8 w-8"
                      @click="openEditModal(espacio)"
                    >
                      <Icon name="lucide:pencil" class="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      class="h-8 w-8 text-destructive hover:text-destructive"
                      @click="openDeleteModal(espacio)"
                    >
                      <Icon name="lucide:trash-2" class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent class="pt-0 space-y-3">
                <!-- Observaciones -->
                <p v-if="espacio.observaciones" class="text-sm text-muted-foreground line-clamp-2">
                  {{ espacio.observaciones }}
                </p>
                
                <!-- Horario asignado -->
                <div class="flex items-center justify-between text-sm pt-2 border-t">
                  <span class="text-muted-foreground">Horario:</span>
                  <div v-if="espacio.schedule" class="flex items-center gap-1">
                    <Icon name="lucide:clock" class="h-3 w-3 text-primary" />
                    <span class="text-xs font-medium">{{ espacio.schedule.name }}</span>
                    <Badge variant="outline" class="text-xs ml-1">
                      {{ getScheduleTypeLabel(espacio.schedule.type) }}
                    </Badge>
                  </div>
                  <span v-else class="text-xs text-muted-foreground italic">
                    Sin horario asignado
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="flex flex-col items-center justify-center py-16">
        <div class="bg-muted/50 p-6 rounded-full">
          <Icon name="lucide:building" class="h-12 w-12 text-muted-foreground opacity-50" />
        </div>
        <p class="mt-4 text-lg font-medium">No hay espacios configurados</p>
        <p class="text-muted-foreground text-sm">Crea el primer espacio para empezar</p>
        <Button class="mt-4" @click="openCreateModal">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          Crear primer espacio
        </Button>
      </div>

      <!-- Modal de Creación -->
      <Dialog v-model:open="showCreateModal">
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Espacio</DialogTitle>
            <DialogDescription>
              Crea una nueva sala, cabina o espacio físico
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <Label for="nombre">Nombre del espacio</Label>
              <Input 
                id="nombre" 
                v-model="form.nombre" 
                placeholder="ej: Cabina 1, Sala de profesores..."
              />
            </div>

            <div class="space-y-2">
              <Label for="planta">Planta</Label>
              <Input 
                id="planta" 
                v-model.number="form.planta" 
                type="number"
                min="0"
                placeholder="0, 1, 2..."
              />
            </div>

            <div class="space-y-2">
              <Label for="observaciones">Observaciones</Label>
              <Textarea 
                id="observaciones" 
                v-model="form.observaciones" 
                placeholder="Notas adicionales sobre el espacio..."
                rows="3"
              />
            </div>

            <div class="space-y-2">
              <Label for="horario">Horario asignado</Label>
              <Select v-model="form.scheduleId">
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un horario..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="null">
                    Sin horario asignado
                  </SelectItem>
                  <SelectItem 
                    v-for="horario in horariosDisponibles" 
                    :key="horario.id" 
                    :value="horario.id"
                  >
                    {{ horario.name }}
                    <span v-if="horario.user" class="text-muted-foreground ml-1">
                      ({{ horario.user.firstName }} {{ horario.user.lastName }})
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p class="text-xs text-muted-foreground">
                Solo se muestran los horarios no asignados a otros espacios
              </p>
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
              Crear Espacio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Modal de Edición -->
      <Dialog v-model:open="showEditModal">
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Espacio</DialogTitle>
            <DialogDescription>
              Modifica los datos del espacio
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <Label for="edit-nombre">Nombre del espacio</Label>
              <Input 
                id="edit-nombre" 
                v-model="form.nombre" 
                placeholder="ej: Cabina 1, Sala de profesores..."
              />
            </div>

            <div class="space-y-2">
              <Label for="edit-planta">Planta</Label>
              <Input 
                id="edit-planta" 
                v-model.number="form.planta" 
                type="number"
                min="0"
                placeholder="0, 1, 2..."
              />
            </div>

            <div class="space-y-2">
              <Label for="edit-observaciones">Observaciones</Label>
              <Textarea 
                id="edit-observaciones" 
                v-model="form.observaciones" 
                placeholder="Notas adicionales sobre el espacio..."
                rows="3"
              />
            </div>

            <div class="space-y-2">
              <Label for="edit-horario">Horario asignado</Label>
              <Select v-model="form.scheduleId">
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un horario..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="null">
                    Sin horario asignado
                  </SelectItem>
                  <SelectItem 
                    v-for="horario in horariosDisponibles" 
                    :key="horario.id" 
                    :value="horario.id"
                  >
                    {{ horario.name }}
                    <span v-if="horario.user" class="text-muted-foreground ml-1">
                      ({{ horario.user.firstName }} {{ horario.user.lastName }})
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="showEditModal = false">
              Cancelar
            </Button>
            <Button 
              @click="handleUpdate" 
              :disabled="isSubmitting"
            >
              <Icon v-if="isSubmitting" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Modal de Confirmar Eliminación -->
      <ConfirmDialog
        v-model:open="showDeleteModal"
        :title="`Eliminar '${selectedEspacio?.nombre}'`"
        icon="lucide:trash-2"
        icon-class="text-destructive"
        confirm-variant="destructive"
        :loading="isSubmitting"
        @confirm="handleDelete"
      >
        <p>¿Estás seguro de que deseas eliminar este espacio?</p>
        <p class="text-sm text-muted-foreground mt-2">
          Esta acción no se puede deshacer.
        </p>
      </ConfirmDialog>
    </div>
  </div>
</template>
