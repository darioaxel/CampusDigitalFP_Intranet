<!-- pages/admin/index.vue -->
<template>
  <div class="min-h-screen">
    <!-- Header compacto -->
    <div class="relative bg-cover bg-center bg-no-repeat py-2 px-6" style="background-image: url('/images/old-page/socios.jpg');">
      <div class="absolute inset-0 bg-black/40"></div>
      <div class="relative z-10 flex items-center gap-2 text-sm">
        <span class="font-semibold text-white drop-shadow-lg">¡Hola {{ userName }}! 👋</span>
        <span class="text-white/90 drop-shadow-md">Bienvenido al panel de administración.</span>
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

      <!-- Tabs para Admin -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="flex items-center gap-2">
                <ClipboardList class="h-5 w-5" />
                Gestión de Solicitudes y Tareas
              </CardTitle>
              <CardDescription>
                Administra solicitudes y tareas del sistema
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <!-- Tabs Navigation -->
          <div class="border-b mb-3">
            <nav class="flex gap-4" aria-label="Tabs">
              <button
                @click="switchTab('active')"
                :class="[
                  'py-2 px-4 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'active' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                ]"
              >
                <span class="flex items-center gap-2">
                  <Inbox class="h-4 w-4" />
                  Activas / Pendientes
                  <Badge v-if="currentItems.length > 0 && activeTab === 'active'" variant="secondary" class="ml-1">
                    {{ table?.getFilteredRowModel().rows.length ?? currentItems.length }}
                  </Badge>
                </span>
              </button>
              <button
                @click="switchTab('history')"
                :class="[
                  'py-2 px-4 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'history' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                ]"
              >
                <span class="flex items-center gap-2">
                  <History class="h-4 w-4" />
                  Mi Historial
                  <Badge v-if="currentItems.length > 0 && activeTab === 'history'" variant="outline" class="ml-1">
                    {{ table?.getFilteredRowModel().rows.length ?? currentItems.length }}
                  </Badge>
                </span>
              </button>
            </nav>
          </div>

          <!-- Toolbar con filtros -->
          <div class="flex flex-row flex-wrap items-end gap-3 mb-3">
            <!-- Filtro por tipo específico -->
            <div class="flex flex-col gap-1">
              <Label class="text-xs font-medium">Tipo</Label>
              <Select
                :model-value="(table?.getColumn('subType')?.getFilterValue() as string[]) ?? []"
                @update:model-value="handleSubTypeFilterChange"
              >
                <SelectTrigger class="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="FREE_DAY">Día libre</SelectItem>
                  <SelectItem value="SICK_LEAVE">Comunicación baja</SelectItem>
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

            <!-- Filtro por solicitante -->
            <div class="flex flex-col gap-1">
              <Label class="text-xs font-medium">Solicitante</Label>
              <Select
                :model-value="(table?.getColumn('createdBy')?.getFilterValue() as string[]) ?? []"
                @update:model-value="handleCreatorFilterChange"
              >
                <SelectTrigger class="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem v-for="creator in uniqueCreators" :key="creator" :value="creator">
                    {{ creator }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Filtro por estado -->
            <div class="flex flex-col gap-1">
              <Label class="text-xs font-medium">Estado</Label>
              <Select
                :model-value="(table?.getColumn('status')?.getFilterValue() as string[]) ?? []"
                @update:model-value="handleStatusFilterChange"
              >
                <SelectTrigger class="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="En progreso">En progreso</SelectItem>
                  <SelectItem value="Aprobada">Aprobada</SelectItem>
                  <SelectItem value="Completada">Completada</SelectItem>
                  <SelectItem value="Rechazada">Rechazada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Botón limpiar filtros -->
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
                  {{ adminColumnNames[column.id] || column.id }}
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <!-- Loading State -->
          <div v-if="pending && !items.length" class="flex items-center justify-center py-8">
            <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
            <span class="ml-2 text-muted-foreground">Cargando...</span>
          </div>

          <!-- Error State -->
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

          <!-- Contenido: Tabla o Empty State -->
          <template v-else>
            <DataTable
              v-if="currentItems.length > 0"
              ref="dataTableRef"
              :key="activeTab"
              :columns="columns"
              :data="currentItems"
              @row-click="navigateToItem"
            />

            <!-- Empty State -->
            <div v-else class="text-center py-10">
              <Inbox v-if="activeTab === 'active'" class="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <History v-else class="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 class="text-lg font-medium text-foreground mb-1">
                {{ activeTab === 'active' ? 'No hay tareas pendientes' : 'No hay registros en tu historial' }}
              </h3>
              <p class="text-sm text-muted-foreground max-w-md mx-auto">
                {{ hasActiveFilters 
                  ? 'No se encontraron resultados con los filtros aplicados.' 
                  : activeTab === 'active' 
                    ? 'No tienes solicitudes ni tareas pendientes de gestionar.' 
                    : 'Aún no has gestionado ninguna solicitud o tarea.' }}
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
          </template>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ClipboardList, Loader2, RefreshCw, AlertCircle, Inbox, History, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import type { Table } from '@tanstack/vue-table'
import DataTable from '~/components/data-table/DataTable.vue'
import { getAdminColumns, adminColumnNames, type WorkflowItem } from '~/components/workflow/adminColumns'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

// Tab activo
const activeTab = ref<'active' | 'history'>('active')

// Estados
const dataTableRef = ref<{ table: Table<WorkflowItem> } | null>(null)
const table = computed(() => dataTableRef.value?.table)

// Función para generar URLs de items (con links en el título)
function getItemUrl(item: WorkflowItem): string | null {
  if (item.type === 'Solicitud') {
    return `/admin/solicitudes/${item.id}`
  }
  // Tareas - TODO: crear rutas
  return null
}

// Columnas según el tab activo
const columns = computed(() => getAdminColumns(activeTab.value === 'history', getItemUrl))

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

// Lista única de solicitantes para el filtro
const uniqueCreators = computed(() => {
  const creators = new Set(items.value.map(item => item.createdBy))
  return Array.from(creators).sort()
})

// Filtrar items activos (pendientes/en proceso)
const activeItems = computed(() => {
  const result = items.value.filter(item => {
    // Estados que consideramos "activos" o pendientes
    const activeStatuses = ['Pendiente', 'Por hacer', 'En progreso', 'En revisión', 'Pendiente de gestionar', 'Pendiente de Validación']
    const isActive = activeStatuses.includes(item.status) || !item.completedAt
    console.log(`[Admin] Filter active: ${item.title.substring(0, 20)} | status: ${item.status} | completedAt: ${item.completedAt} | isActive: ${isActive}`)
    return isActive
  })
  return result
})

// Filtrar items del historial (completados por el admin)
const historyItems = computed(() => {
  const result = items.value.filter(item => {
    // Estados finales completados
    const completedStatuses = ['Aprobado', 'Aprobada', 'Completada', 'Completado', 'Validada', 'Rechazado', 'Rechazada', 'Cancelado', 'Cancelada']
    const isHistory = completedStatuses.includes(item.status) || item.completedAt
    console.log(`[Admin] Filter history: ${item.title.substring(0, 20)} | status: ${item.status} | completedAt: ${item.completedAt} | isHistory: ${isHistory}`)
    return isHistory
  })
  return result
})

// Items a mostrar según la pestaña activa
const currentItems = computed(() => {
  const items = activeTab.value === 'active' ? activeItems.value : historyItems.value
  console.log(`[Admin] currentItems para ${activeTab.value}:`, items.length, 'items')
  return items
})

// Limpiar filtros cuando la tabla se inicializa
onMounted(() => {
  nextTick(() => {
    console.log('[Admin] Limpiando filtros al montar')
    clearFilters()
  })
})

// Computed para saber si hay filtros activos
const hasActiveFilters = computed(() => {
  if (!table.value) return false
  return table.value.getState().columnFilters.length > 0
})

// Cambiar de tab
function switchTab(tab: 'active' | 'history') {
  activeTab.value = tab
  // Limpiar filtros al cambiar de tab
  clearFilters()
}

// Handlers de filtros
function handleSubTypeFilterChange(value: string | string[]) {
  if (value === 'ALL' || (Array.isArray(value) && value.length === 0)) {
    table.value?.getColumn('subType')?.setFilterValue(undefined)
  } else if (Array.isArray(value)) {
    table.value?.getColumn('subType')?.setFilterValue(value)
  } else {
    table.value?.getColumn('subType')?.setFilterValue([value])
  }
}

function handleCreatorFilterChange(value: string | string[]) {
  if (value === 'ALL' || (Array.isArray(value) && value.length === 0)) {
    table.value?.getColumn('createdBy')?.setFilterValue(undefined)
  } else if (Array.isArray(value)) {
    table.value?.getColumn('createdBy')?.setFilterValue(value)
  } else {
    table.value?.getColumn('createdBy')?.setFilterValue([value])
  }
}

function handleStatusFilterChange(value: string | string[]) {
  if (value === 'ALL' || (Array.isArray(value) && value.length === 0)) {
    table.value?.getColumn('status')?.setFilterValue(undefined)
  } else if (Array.isArray(value)) {
    table.value?.getColumn('status')?.setFilterValue(value)
  } else {
    table.value?.getColumn('status')?.setFilterValue([value])
  }
}

function clearFilters() {
  table.value?.resetColumnFilters()
}

const refreshData = async () => {
  await refresh()
}

const navigateToItem = (item: WorkflowItem) => {
  const url = getItemUrl(item)
  if (url) {
    navigateTo(url)
  } else if (item.type === 'Tarea') {
    toast.info('Detalle de tareas en desarrollo. ID: ' + item.id)
  }
}
</script>
