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
      <div class="flex items-center gap-4 text-sm text-muted-foreground">
        <Badge variant="secondary">Total: {{ counts?.total || 0 }}</Badge>
        <Badge variant="outline" class="border-amber-500 text-amber-600">Pendientes: {{ counts?.pending || 0 }}</Badge>
        <Badge variant="outline" class="border-green-500 text-green-600">Completadas: {{ counts?.completed || 0 }}</Badge>
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

          <div v-else-if="error" class="text-center py-8 text-red-500">
            Error al cargar los datos. Intenta recargar la página.
          </div>

          <div v-else-if="!items?.length" class="text-center py-8 text-muted-foreground">
            No tienes solicitudes ni tareas registradas.
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
              <TableRow v-for="item in items" :key="`${item.type}-${item.id}`">
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
                    {{ formatStatus(item.status) }}
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
import { ClipboardList, Loader2 } from 'lucide-vue-next'

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
const { data: workflowData, pending, error } = await useFetch('/api/user/workflow-items')

const items = computed(() => workflowData.value?.data || [])
const counts = computed(() => workflowData.value?.counts)

/* ----------  helpers  ---------- */
function formatSubType(subType: string): string {
  const types: Record<string, string> = {
    // Request types
    FREE_DAY: 'Día libre',
    MEDICAL_APPOINTMENT: 'Médica',
    LEAVE: 'Permiso',
    TRAINING: 'Formación',
    OTHER: 'Otro',
    // Task types
    SYLLABUS_CREATION: 'Programación',
    MEETING: 'Reunión',
    VOTE: 'Votación',
    REVIEW: 'Revisión',
  }
  return types[subType] || subType
}

function formatStatus(status: string): string {
  const statuses: Record<string, string> = {
    // Request statuses
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    COMMUNICATED: 'Comunicada',
    CLOSED: 'Cerrada',
    // Task statuses
    TODO: 'Por hacer',
    IN_PROGRESS: 'En progreso',
    DONE: 'Completada',
    CANCELLED: 'Cancelada',
  }
  return statuses[status] || status
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    // Request statuses
    PENDING: 'secondary',
    APPROVED: 'default',
    REJECTED: 'destructive',
    COMMUNICATED: 'outline',
    CLOSED: 'default',
    // Task statuses
    TODO: 'secondary',
    IN_PROGRESS: 'outline',
    DONE: 'default',
    CANCELLED: 'destructive',
  }
  return variants[status] || 'outline'
}
</script>
