<!-- pages/usuario/index.vue -->
<template>
  <div class="min-h-screen">
    <!-- Header compacto -->
    <div class="relative bg-cover bg-center bg-no-repeat py-2 px-6" style="background-image: url('/images/old-page/socios.jpg');">
      <div class="absolute inset-0 bg-black/40"></div>
      <div class="relative z-10 flex items-center gap-2 text-sm">
        <span class="font-semibold text-white drop-shadow-lg">¡Hola {{ userName }}! 👋</span>
        <span class="text-white/90 drop-shadow-md">Bienvenido a tu portal de Campus Digital FP.</span>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <!-- Resumen -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4 text-sm text-muted-foreground">
          <Badge variant="secondary">Total: {{ counts?.total || 0 }}</Badge>
          <Badge variant="outline" class="border-amber-500 text-amber-600">Pendientes: {{ counts?.pending || 0 }}</Badge>
          <Badge variant="outline" class="border-green-500 text-green-600">Completadas: {{ counts?.completed || 0 }}</Badge>
        </div>
        <button 
          @click="refreshData"
          :disabled="pending"
          class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': pending }" />
          {{ pending ? 'Cargando...' : 'Recargar' }}
        </button>
      </div>

      <!-- Tabla de Solicitudes y Tareas -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <ClipboardList class="h-5 w-5" />
            Mis Solicitudes y Tareas
          </CardTitle>
          <CardDescription>
            Listado de solicitudes y tareas en las que participas como creador, asignado o validador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <!-- Filtros compactos -->
          <div class="flex flex-wrap items-end gap-3 mb-4 py-2 px-3 bg-muted/50 rounded-lg">
            <div class="flex flex-col gap-1">
              <Label class="text-xs font-medium">Tipo</Label>
              <Select v-model="filterType">
                <SelectTrigger class="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="FREE_DAY">Día libre</SelectItem>
                  <SelectItem value="MEDICAL_APPOINTMENT">Médica</SelectItem>
                  <SelectItem value="LEAVE">Permiso</SelectItem>
                  <SelectItem value="TRAINING">Formación</SelectItem>
                  <SelectItem value="OTHER">Otro</SelectItem>
                  <SelectItem value="NEW_USER">Nuevo usuario</SelectItem>
                  <SelectItem value="SCHEDULE_VALIDATION">Validación horario</SelectItem>
                  <SelectItem value="SYLLABUS_CREATION">Programación</SelectItem>
                  <SelectItem value="MEETING">Reunión</SelectItem>
                  <SelectItem value="VOTE">Votación</SelectItem>
                  <SelectItem value="REVIEW">Revisión</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="flex flex-col gap-1">
              <Label class="text-xs font-medium">Desde</Label>
              <Input 
                type="date" 
                v-model="filterDateFrom" 
                class="w-[130px] h-8 text-xs"
              />
            </div>
            <div class="flex flex-col gap-1">
              <Label class="text-xs font-medium">Hasta</Label>
              <Input 
                type="date" 
                v-model="filterDateTo" 
                class="w-[130px] h-8 text-xs"
              />
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              @click="clearFilters"
              class="h-8 px-2"
              :disabled="!hasActiveFilters"
            >
              <X class="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          </div>

          <div v-if="pending" class="flex items-center justify-center py-8">
            <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
            <span class="ml-2 text-muted-foreground">Cargando...</span>
          </div>

          <div v-else-if="error" class="text-center py-8">
            <div class="text-red-500 mb-2">
              <AlertCircle class="h-8 w-8 mx-auto mb-2" />
              Error al cargar los datos
            </div>
            <p class="text-sm text-muted-foreground">{{ error.message || 'Intenta recargar la página' }}</p>
            <button 
              @click="refreshData"
              class="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw class="h-4 w-4" />
              Reintentar
            </button>
          </div>

          <div v-else-if="filteredItems.length === 0" class="text-center py-12">
            <Inbox class="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 class="text-lg font-medium text-foreground mb-1">
              {{ hasActiveFilters ? 'No se encontraron resultados' : 'No tienes solicitudes ni tareas' }}
            </h3>
            <p class="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              {{ hasActiveFilters 
                ? 'No hay solicitudes ni tareas que coincidan con los filtros aplicados.' 
                : 'Cuando crees una solicitud o te asignen una tarea, aparecerán aquí.' }}
            </p>
            <Button 
              v-if="hasActiveFilters"
              variant="outline" 
              size="sm" 
              @click="clearFilters"
              class="mt-4"
            >
              <X class="h-4 w-4 mr-1" />
              Limpiar filtros
            </Button>
          </div>

          <Table v-else>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Creado por</TableHead>
                <TableHead>Fecha creación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Finalización</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="item in filteredItems" :key="`${item.type}-${item.id}`" class="cursor-pointer hover:bg-muted/50" @click="navigateToItem(item)">
                <TableCell>
                  <Badge :style="{ backgroundColor: getSubTypeColor(item.subType), color: '#fff' }" class="w-fit">
                    {{ formatSubType(item.subType) }}
                  </Badge>
                </TableCell>
                <TableCell class="font-medium max-w-[200px] truncate" :title="item.title">
                  {{ item.title }}
                </TableCell>
                <TableCell class="text-sm">{{ item.createdBy }}</TableCell>
                <TableCell class="text-sm text-muted-foreground">{{ item.createdAt }}</TableCell>
                <TableCell>
                  <Badge :variant="getStatusVariant(item.status)" class="w-fit">
                    {{ item.status }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span v-if="item.completedAt !== '-'" class="text-sm text-green-600">
                    {{ item.completedAt }}
                  </span>
                  <span v-else class="text-sm text-muted-foreground">-</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ClipboardList, Loader2, RefreshCw, AlertCircle, Inbox, X } from 'lucide-vue-next'
import { ref, computed } from 'vue'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

// Filtros - usar 'ALL' en lugar de string vacío
const filterType = ref('ALL')
const filterDateFrom = ref('')
const filterDateTo = ref('')

const hasActiveFilters = computed(() => {
  return filterType.value !== 'ALL' || filterDateFrom.value || filterDateTo.value
})

const clearFilters = () => {
  filterType.value = 'ALL'
  filterDateFrom.value = ''
  filterDateTo.value = ''
}

/* ----------  usuario  ---------- */
const { user } = await useUserSession()
const userName = computed(() => {
  if (!user.value) return 'Usuario'
  return `${user.value.firstName || ''} ${user.value.lastName || ''}`.trim() || user.value.email
})

/* ----------  datos workflow  ---------- */
const { data: workflowData, pending, error, refresh } = await useFetch('/api/user/workflow-items', {
  key: 'workflow-items',
  server: true,
  default: () => ({ data: [], counts: { total: 0, pending: 0, completed: 0 } })
})

const items = computed(() => workflowData.value?.data || [])
const counts = computed(() => workflowData.value?.counts)

// Items filtrados
const filteredItems = computed(() => {
  let result = items.value

  // Filtrar por tipo
  if (filterType.value && filterType.value !== 'ALL') {
    result = result.filter(item => item.subType === filterType.value)
  }

  // Filtrar por fecha desde
  if (filterDateFrom.value) {
    const fromDate = new Date(filterDateFrom.value)
    result = result.filter(item => {
      const itemDate = parseDate(item.createdAt)
      return itemDate >= fromDate
    })
  }

  // Filtrar por fecha hasta
  if (filterDateTo.value) {
    const toDate = new Date(filterDateTo.value)
    toDate.setHours(23, 59, 59, 999)
    result = result.filter(item => {
      const itemDate = parseDate(item.createdAt)
      return itemDate <= toDate
    })
  }

  return result
})

const refreshData = async () => {
  await refresh()
}

const navigateToItem = (item: any) => {
  if (item.type === 'Solicitud') {
    navigateTo(`/admin/solicitudes/${item.id}`)
  } else {
    navigateTo(`/admin/tareas/${item.id}`)
  }
}

/* ----------  helpers  ---------- */
function parseDate(dateStr: string): Date {
  // Parsear formato DD/MM/YYYY o similar
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number)
    return new Date(year, month - 1, day)
  }
  // Fallback: intentar parseo directo
  return new Date(dateStr)
}

function formatSubType(subType: string): string {
  const types: Record<string, string> = {
    // Request types
    FREE_DAY: 'Día libre',
    MEDICAL_APPOINTMENT: 'Médica',
    LEAVE: 'Permiso',
    TRAINING: 'Formación',
    OTHER: 'Otro',
    NEW_USER: 'Nuevo usuario',
    SCHEDULE_VALIDATION: 'Validación horario',
    // Task types
    SYLLABUS_CREATION: 'Programación',
    MEETING: 'Reunión',
    VOTE: 'Votación',
    REVIEW: 'Revisión',
  }
  return types[subType] || subType
}

function getSubTypeColor(subType: string): string {
  const colors: Record<string, string> = {
    // Request types - tonos azules/verdes
    FREE_DAY: '#3b82f6',
    MEDICAL_APPOINTMENT: '#06b6d4',
    LEAVE: '#8b5cf6',
    TRAINING: '#10b981',
    OTHER: '#6b7280',
    NEW_USER: '#f59e0b',
    SCHEDULE_VALIDATION: '#ec4899',
    // Task types - tonos naranjas/rojos
    SYLLABUS_CREATION: '#ef4444',
    MEETING: '#6366f1',
    VOTE: '#14b8a6',
    REVIEW: '#f97316',
  }
  return colors[subType] || '#6b7280'
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    // Estados comunes de workflow
    'Pendiente': 'secondary',
    'Por hacer': 'secondary',
    'En progreso': 'outline',
    'En revisión': 'outline',
    // Estados finales positivos
    'Aprobado': 'default',
    'Aprobada': 'default',
    'Completada': 'default',
    'Completado': 'default',
    'Validada': 'default',
    // Estados finales negativos
    'Rechazado': 'destructive',
    'Rechazada': 'destructive',
    'Cancelado': 'destructive',
    'Cancelada': 'destructive',
  }
  return variants[status] || 'outline'
}
</script>
