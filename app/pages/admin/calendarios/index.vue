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
      
      <Button @click="showCreateModal = true">
        <Icon name="lucide:plus" class="h-4 w-4 mr-2" />
        Nuevo Calendario
      </Button>
    </div>

    <!-- Filtros -->
    <div class="flex gap-4">
      <Select v-model="filters.type">
        <SelectTrigger class="w-[200px]">
          <SelectValue placeholder="Tipo de calendario" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos</SelectItem>
          <SelectItem value="SCHOOL_YEAR">Calendario Escolar</SelectItem>
          <SelectItem value="EVALUATION">Evaluaciones</SelectItem>
          <SelectItem value="FREE_DISPOSITION">Libre Disposición</SelectItem>
          <SelectItem value="MEETINGS">Reuniones</SelectItem>
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
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos</SelectItem>
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
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Año</TableHead>
            <TableHead>Eventos</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Creado por</TableHead>
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
            <TableCell>{{ calendar._count?.events || 0 }}</TableCell>
            <TableCell>
              <Badge :variant="calendar.isActive ? 'default' : 'secondary'" class="text-xs">
                {{ calendar.isActive ? 'Activo' : 'Inactivo' }}
              </Badge>
            </TableCell>
            <TableCell>
              <div class="text-sm">
                {{ calendar.createdBy?.firstName }} {{ calendar.createdBy?.lastName }}
              </div>
            </TableCell>
            <TableCell class="text-right">
              <div class="flex items-center justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  @click="editCalendar(calendar)"
                >
                  <Icon name="lucide:pencil" class="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  @click="manageEvents(calendar)"
                >
                  <Icon name="lucide:calendar-days" class="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  class="text-destructive"
                  @click="deleteCalendar(calendar)"
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
                pattern="\\d{4}-\\d{4}"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

// Estado
const showCreateModal = ref(false)
const editingCalendar = ref<any>(null)
const saving = ref(false)

const filters = reactive({
  type: '',
  academicYear: '',
  isActive: 'true',
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

// Fetch calendarios
const { data: response, pending, refresh } = useFetch(() => {
  const params = new URLSearchParams()
  if (filters.type) params.append('type', filters.type)
  if (filters.academicYear) params.append('academicYear', filters.academicYear)
  if (filters.isActive) params.append('isActive', filters.isActive)
  return `/api/calendars?${params.toString()}`
}, {
  watch: [filters],
})

// Extraer calendarios de la respuesta
const calendars = computed(() => response.value?.data || [])

// Helpers
function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    'SCHOOL_YEAR': 'Escolar',
    'EVALUATION': 'Evaluaciones',
    'FREE_DISPOSITION': 'Libre Disp.',
    'MEETINGS': 'Reuniones',
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

async function saveCalendar() {
  saving.value = true
  
  try {
    // Enviar fechas en formato YYYY-MM-DD directamente
    const payload = {
      name: form.name,
      description: form.description,
      type: form.type,
      academicYear: form.academicYear,
      startDate: form.startDate, // formato: YYYY-MM-DD
      endDate: form.endDate, // formato: YYYY-MM-DD
      isPublic: form.isPublic,
      allowDragDrop: form.allowDragDrop,
      isActive: form.isActive,
      maxEventsPerUser: form.maxEventsPerUser,
    }
    
    if (editingCalendar.value) {
      await $fetch(`/api/calendars/${editingCalendar.value.id}`, {
        method: 'PUT',
        body: payload,
      })
    } else {
      await $fetch('/api/calendars', {
        method: 'POST',
        body: payload,
      })
    }
    
    await refresh()
    showCreateModal.value = false
    editingCalendar.value = null
    resetForm()
    toast.success(editingCalendar.value ? 'Calendario actualizado' : 'Calendario creado')
  } catch (error: any) {
    toast.error(error.data?.message || 'Error al guardar')
  } finally {
    saving.value = false
  }
}

async function deleteCalendar(calendar: any) {
  if (!confirm(`¿Eliminar el calendario "${calendar.name}"?`)) return
  
  try {
    await $fetch(`/api/calendars/${calendar.id}`, {
      method: 'DELETE',
    })
    await refresh()
    toast.success('Calendario eliminado')
  } catch (error: any) {
    toast.error(error.data?.message || 'Error al eliminar')
  }
}

function manageEvents(calendar: any) {
  navigateTo(`/admin/calendarios/${calendar.id}/eventos`)
}

// Inicializar año académico
resetForm()
</script>
