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

          <div v-else-if="!items?.length" class="text-center py-12">
            <Inbox class="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 class="text-lg font-medium text-foreground mb-1">No tienes solicitudes ni tareas</h3>
            <p class="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Cuando crees una solicitud o te asignen una tarea, aparecerán aquí. 
              También puedes crear una solicitud desde el menú correspondiente.
            </p>
          </div>

          <Table v-else>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Creado por</TableHead>
                <TableHead>Fecha creación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Tu rol</TableHead>
                <TableHead>Finalización</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="item in items" :key="`${item.type}-${item.id}`" class="cursor-pointer hover:bg-muted/50" @click="navigateToItem(item)">
                <TableCell>
                  <div class="flex flex-col gap-0.5">
                    <Badge :variant="item.type === 'Solicitud' ? 'default' : 'secondary'" class="w-fit">
                      {{ item.type }}
                    </Badge>
                    <span class="text-xs text-muted-foreground">{{ formatSubType(item.subType) }}</span>
                  </div>
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
                  <span class="text-sm">{{ item.role }}</span>
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
import { ClipboardList, Loader2, RefreshCw, AlertCircle, Inbox } from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

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
