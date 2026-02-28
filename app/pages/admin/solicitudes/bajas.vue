<script setup lang="ts">
import { 
  FileText, 
  Loader2, 
  Eye,
  Search,
  Filter,
  History,
  User,
  Calendar,
  Clock,
  ChevronRight,
  Download
} from 'lucide-vue-next'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useSickLeaveRequests, type SickLeaveRequest } from '~/composables/useSickLeaveRequests'

// Importar componentes explícitamente para SSR
import TransitionDialog from '~/components/requests/TransitionDialog.vue'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
  roles: ['ADMIN', 'ROOT']
})

// Composables
const { 
  pending, loadingTransitions, availableTransitions,
  fetchAllRequests, fetchTransitions, executeTransition, downloadDocument,
  formatEstado, getEstadoColor, formatTipoBaja, parseAPIDate
} = useSickLeaveRequests()

// Estado
const requests = ref<SickLeaveRequest[]>([])
const filterState = ref('all')
const searchQuery = ref('')
const selectedRequest = ref<SickLeaveRequest | null>(null)
const showDetailModal = ref(false)
const showTransitionModal = ref(false)
const transitionComment = ref('')
const selectedTransition = ref<any>(null)
const executingTransition = ref(false)

// Cargar solicitudes
const loadRequests = async () => {
  requests.value = await fetchAllRequests()
}

await loadRequests()

// Computed
const filteredRequests = computed(() => {
  let result = requests.value
  
  if (filterState.value !== 'all') {
    result = result.filter((r: SickLeaveRequest) => r.currentState?.code === filterState.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter((r: SickLeaveRequest) => 
      r.title?.toLowerCase().includes(query) ||
      r.requester?.firstName?.toLowerCase().includes(query) ||
      r.requester?.lastName?.toLowerCase().includes(query) ||
      r.requester?.email?.toLowerCase().includes(query)
    )
  }
  
  return result
})

const stats = computed(() => {
  const all = requests.value
  return {
    pending: all.filter((r: SickLeaveRequest) => r.currentState?.code === 'pending_notification').length,
    notified: all.filter((r: SickLeaveRequest) => r.currentState?.code === 'notified').length,
    pendingDocs: all.filter((r: SickLeaveRequest) => r.currentState?.code === 'pending_docs').length,
    pendingValidation: all.filter((r: SickLeaveRequest) => r.currentState?.code === 'pending_validation').length,
    validated: all.filter((r: SickLeaveRequest) => r.currentState?.code === 'validated').length
  }
})

// Métodos
const viewDetail = async (request: SickLeaveRequest) => {
  selectedRequest.value = request
  showDetailModal.value = true
  await fetchTransitions(request.id)
}

const executeTransitionAction = (transition: any) => {
  selectedTransition.value = transition
  transitionComment.value = ''
  showTransitionModal.value = true
}

const confirmTransition = async () => {
  if (!selectedTransition.value || !selectedRequest.value) return
  
  executingTransition.value = true
  const success = await executeTransition(
    selectedRequest.value.id,
    selectedTransition.value.toState.code,
    transitionComment.value
  )
  
  if (success) {
    showTransitionModal.value = false
    showDetailModal.value = false
    await loadRequests()
  }
  executingTransition.value = false
}

const formatDate = (date?: string | null) => {
  if (!date) return 'No especificada'
  const d = parseAPIDate(date)
  return d ? d.toLocaleDateString('es-ES') : 'Fecha inválida'
}

const getDatesFromContext = (contextStr?: string): string[] => {
  if (!contextStr) return []
  try {
    const ctx = JSON.parse(contextStr)
    return ctx.dates || []
  } catch {
    return []
  }
}

const getTransitionLabel = (code?: string): string => {
  const labels: Record<string, string> = {
    'notified': 'Aceptar Notificación',
    'pending_docs': 'Solicitar Documentación',
    'validated': 'Validar Solicitud',
    'rejected': 'Rechazar Solicitud'
  }
  return labels[code || ''] || 'Cambiar a: ' + formatEstado(code)
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <FileText class="h-6 w-6" />
          Gestión de Bajas
        </h1>
        <p class="text-muted-foreground text-sm">
          Administra las comunicaciones de baja del profesorado
        </p>
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card v-for="(value, key) in stats" :key="key">
        <CardContent class="p-4">
          <p class="text-2xl font-bold">{{ value }}</p>
          <p class="text-xs text-muted-foreground capitalize">
            {{ key === 'pendingDocs' ? 'Esperando Docs' : 
               key === 'pendingValidation' ? 'Pend. Validación' : 
               key === 'pending' ? 'Pend. Notificación' : key }}
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Filtros -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Buscar por nombre, email..."
          class="pl-10"
        />
      </div>
      <Select v-model="filterState">
        <SelectTrigger class="w-[200px]">
          <Filter class="w-4 h-4 mr-2" />
          <SelectValue placeholder="Filtrar por estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="pending_notification">Pendiente de Notificación</SelectItem>
          <SelectItem value="notified">Notificado</SelectItem>
          <SelectItem value="pending_docs">Esperando Documentación</SelectItem>
          <SelectItem value="pending_validation">Esperando Validación</SelectItem>
          <SelectItem value="validated">Validado</SelectItem>
          <SelectItem value="rejected">Rechazado</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Lista de solicitudes -->
    <Card>
      <CardHeader>
        <CardTitle>Solicitudes de Baja</CardTitle>
        <CardDescription>
          {{ filteredRequests.length }} solicitudes encontradas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="pending" class="flex justify-center py-12">
          <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        
        <div v-else-if="filteredRequests.length === 0" class="text-center py-12">
          <FileText class="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p class="text-muted-foreground">No hay solicitudes que mostrar</p>
        </div>
        
        <div v-else class="divide-y">
          <div 
            v-for="request in filteredRequests" 
            :key="request.id"
            class="py-4 flex items-start justify-between hover:bg-muted/50 px-4 -mx-4 transition-colors"
          >
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <h3 class="font-medium">{{ formatTipoBaja(request.context) }}</h3>
                <Badge :class="getEstadoColor(request.currentState?.code)">
                  {{ formatEstado(request.currentState?.code) }}
                </Badge>
              </div>
              
              <div class="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span class="flex items-center gap-1">
                  <User class="w-3 h-3" />
                  {{ request.requester?.firstName }} {{ request.requester?.lastName }}
                </span>
                <span class="flex items-center gap-1">
                  <Calendar class="w-3 h-3" />
                  {{ formatDate(request.startDate) }}
                  <span v-if="request.endDate && request.endDate !== request.startDate">
                    - {{ formatDate(request.endDate) }}
                  </span>
                </span>
                <span class="flex items-center gap-1">
                  <Clock class="w-3 h-3" />
                  {{ format(new Date(request.createdAt), "d/M/yyyy HH:mm") }}
                </span>
              </div>
              
              <p v-if="request.description" class="text-sm mt-2">
                {{ request.description }}
              </p>
            </div>
            
            <Button size="sm" variant="outline" @click="viewDetail(request)">
              <Eye class="w-4 h-4 mr-1" />
              Ver
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Modal de detalle -->
    <Dialog :open="showDetailModal" @update:open="showDetailModal = $event">
      <DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de la Solicitud de Baja</DialogTitle>
          <DialogDescription>
            {{ selectedRequest ? formatTipoBaja(selectedRequest.context) : '' }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="selectedRequest" class="space-y-6">
          <!-- Información general -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label class="text-muted-foreground">Solicitante</Label>
              <p class="font-medium">
                {{ selectedRequest.requester?.firstName }} {{ selectedRequest.requester?.lastName }}
              </p>
              <p class="text-sm text-muted-foreground">{{ selectedRequest.requester?.email }}</p>
            </div>
            <div>
              <Label class="text-muted-foreground">Estado actual</Label>
              <Badge :class="getEstadoColor(selectedRequest.currentState?.code)" class="mt-1">
                {{ formatEstado(selectedRequest.currentState?.code) }}
              </Badge>
            </div>
            <div>
              <Label class="text-muted-foreground">Fecha inicio</Label>
              <p>{{ formatDate(selectedRequest.startDate) }}</p>
            </div>
            <div>
              <Label class="text-muted-foreground">Fecha fin</Label>
              <p>{{ formatDate(selectedRequest.endDate) }}</p>
            </div>
          </div>

          <!-- Días afectados -->
          <div v-if="getDatesFromContext(selectedRequest.context).length > 0">
            <Label class="text-muted-foreground">Días afectados</Label>
            <div class="flex flex-wrap gap-2 mt-1">
              <Badge 
                v-for="date in getDatesFromContext(selectedRequest.context)" 
                :key="date" 
                variant="outline"
              >
                {{ new Date(date).toLocaleDateString('es-ES') }}
              </Badge>
            </div>
          </div>

          <!-- Observaciones -->
          <div v-if="selectedRequest.description">
            <Label class="text-muted-foreground">Observaciones del solicitante</Label>
            <p class="text-sm mt-1 p-3 bg-muted rounded-lg">{{ selectedRequest.description }}</p>
          </div>

          <!-- Documentos -->
          <div v-if="selectedRequest.documents && selectedRequest.documents.length > 0">
            <Label class="text-muted-foreground">Documentos Adjuntos</Label>
            <div class="space-y-2 mt-2">
              <div 
                v-for="doc in selectedRequest.documents" 
                :key="doc.id"
                class="flex items-center justify-between p-3 border rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <FileText class="w-5 h-5 text-primary" />
                  <div>
                    <p class="font-medium text-sm">{{ doc.file?.name }}</p>
                    <p class="text-xs text-muted-foreground">
                      Subido el {{ format(new Date(doc.createdAt), "d/M/yyyy HH:mm") }}
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  @click="downloadDocument(doc.id, doc.file?.name)"
                >
                  <Download class="w-4 h-4 mr-1" />
                  Descargar
                </Button>
              </div>
            </div>
          </div>

          <!-- Historial -->
          <div v-if="selectedRequest.stateHistory && selectedRequest.stateHistory.length > 0">
            <Label class="text-muted-foreground flex items-center gap-2">
              <History class="w-4 h-4" />
              Historial de Estados
            </Label>
            <div class="space-y-3 mt-2">
              <div 
                v-for="entry in selectedRequest.stateHistory" 
                :key="entry.id"
                class="flex items-start gap-3 text-sm"
              >
                <div class="w-2 h-2 rounded-full bg-primary mt-1.5" />
                <div>
                  <p>
                    <strong>{{ formatEstado(entry.toState?.code) }}</strong>
                    <span class="text-muted-foreground">
                      - {{ format(new Date(entry.createdAt), "d/M/yyyy HH:mm") }}
                    </span>
                  </p>
                  <p v-if="entry.comment" class="text-muted-foreground">
                    "{{ entry.comment }}"
                  </p>
                  <p class="text-xs text-muted-foreground">
                    Por: {{ entry.actor?.firstName }} {{ entry.actor?.lastName }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Acciones disponibles -->
          <div v-if="loadingTransitions" class="border-t pt-4">
            <div class="flex items-center gap-2 text-muted-foreground">
              <Loader2 class="w-4 h-4 animate-spin" />
              <span class="text-sm">Cargando acciones disponibles...</span>
            </div>
          </div>
          <div v-else-if="availableTransitions.length > 0" class="border-t pt-4">
            <Label class="text-muted-foreground mb-2 block">Acciones disponibles</Label>
            <div class="space-y-2">
              <Button
                v-for="transition in availableTransitions"
                :key="transition.id"
                class="w-full justify-between"
                :variant="transition.toState?.code === 'validated' ? 'default' : 
                         transition.toState?.code === 'rejected' ? 'destructive' : 'outline'"
                @click="executeTransitionAction(transition)"
              >
                <span>{{ getTransitionLabel(transition.toState?.code) }}</span>
                <ChevronRight class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showDetailModal = false">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal de transición -->
    <TransitionDialog
      v-model:open="showTransitionModal"
      v-model:comment="transitionComment"
      :transition="selectedTransition"
      :executing="executingTransition"
      @confirm="confirmTransition"
    />
  </div>
</template>
