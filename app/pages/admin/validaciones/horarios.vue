<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
  roles: ['ADMIN', 'ROOT']
})

const { user } = await useUserSession()
const router = useRouter()

// Filtros
const statusFilter = ref<'ALL' | 'PENDIENTE' | 'VALIDADO' | 'RECHAZADO' | 'BORRADOR'>('PENDIENTE')

// Cargar todos los horarios de todos los usuarios
const { data: schedulesResponse, pending, error, refresh } = await useFetch('/api/schedules', {
  key: 'all-schedules',
  default: () => ({ data: [] })
})

// Extraer horarios de la respuesta
const allSchedules = computed(() => {
  const response = schedulesResponse.value
  if (!response) return []
  return response.data || []
})

// Horarios filtrados
const filteredSchedules = computed(() => {
  if (statusFilter.value === 'ALL') return allSchedules.value
  return allSchedules.value.filter((s: any) => s.validationStatus === statusFilter.value)
})

// Estadísticas
const stats = computed(() => {
  return {
    total: allSchedules.value.length,
    pending: allSchedules.value.filter((s: any) => s.validationStatus === 'PENDIENTE').length,
    validated: allSchedules.value.filter((s: any) => s.validationStatus === 'VALIDADO').length,
    rejected: allSchedules.value.filter((s: any) => s.validationStatus === 'RECHAZADO').length,
    draft: allSchedules.value.filter((s: any) => s.validationStatus === 'BORRADOR').length,
  }
})

// Validar/Rechazar horario
const selectedSchedule = ref<any>(null)
const showValidateDialog = ref(false)
const validateAction = ref<'VALIDAR' | 'RECHAZAR'>('VALIDAR')
const validateNotes = ref('')
const validating = ref(false)

const openValidateDialog = (schedule: any, action: 'VALIDAR' | 'RECHAZAR') => {
  selectedSchedule.value = schedule
  validateAction.value = action
  validateNotes.value = ''
  showValidateDialog.value = true
}

const executeValidation = async () => {
  if (!selectedSchedule.value) return
  
  validating.value = true
  try {
    const { error: valError } = await useFetch(`/api/schedules/${selectedSchedule.value.id}/validate`, {
      method: 'POST',
      body: { 
        action: validateAction.value,
        notes: validateNotes.value
      }
    })

    if (valError.value) throw valError.value

    toast.success(validateAction.value === 'VALIDAR' 
      ? 'Horario validado correctamente' 
      : 'Horario rechazado'
    )
    
    showValidateDialog.value = false
    selectedSchedule.value = null
    refresh()
  } catch (err: any) {
    toast.error(err.message || 'Error al procesar la validación')
  } finally {
    validating.value = false
  }
}

// Ver detalle del horario
const viewSchedule = (schedule: any) => {
  navigateTo(`/usuario/horarios?view=${schedule.id}`)
}

// Helpers
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'BORRADOR': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    'PENDIENTE': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
    'VALIDADO': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
    'RECHAZADO': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
  }
  return colors[status] || ''
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

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'NORMAL': 'Horario Normal',
    'EXAMENES': 'Exámenes',
    'EXTRAORDINARIO': 'Extraordinario',
    'GUARDIA': 'Guardia',
    'REFUERZO': 'Refuerzo'
  }
  return labels[type] || type
}

if (error.value) {
  console.error('Error cargando horarios:', error.value)
}
</script>

<template>
  <div class="min-h-screen bg-background p-4">
    <div class="mx-auto max-w-7xl">
      <!-- Cabecera -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-foreground">
            Validación de Horarios
          </h1>
          <p class="text-sm text-muted-foreground">
            Gestiona la validación de horarios de los profesores
          </p>
        </div>
        
        <div class="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            @click="refresh"
            :disabled="pending"
          >
            <Icon 
              name="lucide:refresh-cw" 
              class="mr-2 h-4 w-4"
              :class="{ 'animate-spin': pending }"
            />
            Actualizar
          </Button>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card class="cursor-pointer" @click="statusFilter = 'ALL'" :class="{ 'ring-2 ring-primary': statusFilter === 'ALL' }">
          <CardContent class="p-4">
            <div class="text-2xl font-bold">{{ stats.total }}</div>
            <div class="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card class="cursor-pointer" @click="statusFilter = 'PENDIENTE'" :class="{ 'ring-2 ring-primary': statusFilter === 'PENDIENTE' }">
          <CardContent class="p-4">
            <div class="text-2xl font-bold text-yellow-600">{{ stats.pending }}</div>
            <div class="text-xs text-muted-foreground">Pendientes</div>
          </CardContent>
        </Card>
        <Card class="cursor-pointer" @click="statusFilter = 'VALIDADO'" :class="{ 'ring-2 ring-primary': statusFilter === 'VALIDADO' }">
          <CardContent class="p-4">
            <div class="text-2xl font-bold text-green-600">{{ stats.validated }}</div>
            <div class="text-xs text-muted-foreground">Validados</div>
          </CardContent>
        </Card>
        <Card class="cursor-pointer" @click="statusFilter = 'RECHAZADO'" :class="{ 'ring-2 ring-primary': statusFilter === 'RECHAZADO' }">
          <CardContent class="p-4">
            <div class="text-2xl font-bold text-red-600">{{ stats.rejected }}</div>
            <div class="text-xs text-muted-foreground">Rechazados</div>
          </CardContent>
        </Card>
        <Card class="cursor-pointer" @click="statusFilter = 'BORRADOR'" :class="{ 'ring-2 ring-primary': statusFilter === 'BORRADOR' }">
          <CardContent class="p-4">
            <div class="text-2xl font-bold text-gray-600">{{ stats.draft }}</div>
            <div class="text-xs text-muted-foreground">Borradores</div>
          </CardContent>
        </Card>
      </div>

      <!-- Estados -->
      <div v-if="pending" class="h-64 rounded-lg border border-border bg-card animate-pulse" />
      
      <div v-else-if="error" class="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p class="text-sm text-destructive">Error al cargar los horarios</p>
      </div>

      <div v-else-if="!filteredSchedules?.length" class="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
        <Icon name="lucide:calendar-x" class="h-8 w-8 text-muted-foreground" />
        <p class="mt-2 text-sm text-muted-foreground">
          No hay horarios {{ statusFilter !== 'ALL' ? `en estado "${getStatusLabel(statusFilter)}"` : '' }}
        </p>
      </div>

      <!-- Tabla de horarios -->
      <Card v-else>
        <CardHeader>
          <CardTitle class="text-base">
            Horarios {{ statusFilter !== 'ALL' ? `- ${getStatusLabel(statusFilter)}` : '' }}
            <Badge variant="secondary" class="ml-2">{{ filteredSchedules.length }}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent class="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profesor</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Bloques</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead class="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="schedule in filteredSchedules" :key="schedule.id">
                <TableCell>
                  <div class="font-medium">{{ schedule.user?.firstName }} {{ schedule.user?.lastName }}</div>
                  <div class="text-xs text-muted-foreground">{{ schedule.user?.email }}</div>
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <div 
                      class="h-2 w-2 rounded-full" 
                      :style="{ backgroundColor: schedule.color || '#3b82f6' }"
                    />
                    {{ schedule.name }}
                  </div>
                </TableCell>
                <TableCell>{{ getTypeLabel(schedule.type) }}</TableCell>
                <TableCell>{{ schedule.blocks?.length || 0 }} bloques</TableCell>
                <TableCell>
                  <Badge :class="getStatusColor(schedule.validationStatus)">
                    {{ getStatusLabel(schedule.validationStatus) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div class="text-sm">{{ new Date(schedule.createdAt).toLocaleDateString('es-ES') }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ new Date(schedule.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) }}
                  </div>
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      @click="viewSchedule(schedule)"
                    >
                      <Icon name="lucide:eye" class="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <template v-if="schedule.validationStatus === 'PENDIENTE'">
                      <Button 
                        variant="default" 
                        size="sm"
                        class="bg-green-600 hover:bg-green-700"
                        @click="openValidateDialog(schedule, 'VALIDAR')"
                      >
                        <Icon name="lucide:check" class="h-4 w-4 mr-1" />
                        Validar
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        @click="openValidateDialog(schedule, 'RECHAZAR')"
                      >
                        <Icon name="lucide:x" class="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </template>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <!-- Diálogo de validación -->
      <Dialog v-model:open="showValidateDialog">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {{ validateAction === 'VALIDAR' ? 'Validar Horario' : 'Rechazar Horario' }}
            </DialogTitle>
            <DialogDescription>
              <template v-if="validateAction === 'VALIDAR'">
                ¿Estás seguro de que deseas validar este horario? Una vez validado, el profesor podrá utilizarlo.
              </template>
              <template v-else>
                ¿Estás seguro de que deseas rechazar este horario? El profesor deberá corregirlo y volver a enviarlo.
              </template>
            </DialogDescription>
          </DialogHeader>
          
          <div v-if="selectedSchedule" class="py-4">
            <div class="bg-muted p-3 rounded-md mb-4">
              <div class="text-sm font-medium">{{ selectedSchedule.name }}</div>
              <div class="text-xs text-muted-foreground">
                Profesor: {{ selectedSchedule.user?.firstName }} {{ selectedSchedule.user?.lastName }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ selectedSchedule.blocks?.length || 0 }} bloques configurados
              </div>
            </div>
            
            <div class="space-y-2">
              <Label for="notes">
                {{ validateAction === 'VALIDAR' ? 'Notas (opcional)' : 'Motivo del rechazo (obligatorio)' }}
              </Label>
              <Textarea 
                id="notes"
                v-model="validateNotes"
                :placeholder="validateAction === 'VALIDAR' 
                  ? 'Añade notas sobre la validación...' 
                  : 'Explica por qué se rechaza el horario...'"
                rows="3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              @click="showValidateDialog = false"
              :disabled="validating"
            >
              Cancelar
            </Button>
            <Button 
              :variant="validateAction === 'VALIDAR' ? 'default' : 'destructive'"
              :class="validateAction === 'VALIDAR' ? 'bg-green-600 hover:bg-green-700' : ''"
              @click="executeValidation"
              :disabled="validating || (validateAction === 'RECHAZAR' && !validateNotes.trim())"
            >
              <Icon 
                v-if="validating" 
                name="lucide:loader-2" 
                class="mr-2 h-4 w-4 animate-spin" 
              />
              {{ validateAction === 'VALIDAR' ? 'Validar' : 'Rechazar' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>
