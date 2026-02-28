<template>
  <div class="min-h-screen bg-muted/30">
    <!-- Header -->
    <div class="bg-card border-b">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <NuxtLink 
              to="/usuario" 
              class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft class="h-4 w-4" />
              Volver
            </NuxtLink>
            <div class="h-4 w-px bg-border" />
            <div>
              <h1 class="text-xl font-semibold">Detalle de Solicitud</h1>
              <p class="text-sm text-muted-foreground">{{ request?.title || 'Cargando...' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Badge :variant="getStatusVariant(request?.currentState?.name)">
              {{ request?.currentState?.name || 'Desconocido' }}
            </Badge>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-6">
      <div v-if="pending" class="flex items-center justify-center py-12">
        <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        <span class="ml-2 text-muted-foreground">Cargando solicitud...</span>
      </div>

      <div v-else-if="error" class="text-center py-12">
        <AlertCircle class="h-12 w-12 mx-auto text-destructive mb-4" />
        <h2 class="text-lg font-medium mb-2">Error al cargar la solicitud</h2>
        <p class="text-sm text-muted-foreground mb-4">{{ error.message }}</p>
        <button 
          @click="refresh"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw class="h-4 w-4" />
          Reintentar
        </button>
      </div>

      <div v-else-if="!request" class="text-center py-12">
        <FileX class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 class="text-lg font-medium">Solicitud no encontrada</h2>
        <p class="text-sm text-muted-foreground">La solicitud que buscas no existe o ha sido eliminada.</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Columna principal: Información de la solicitud -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Tarjeta de información general -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <FileText class="h-5 w-5" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <!-- Datos básicos -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-xs text-muted-foreground">Tipo de solicitud</label>
                  <p class="font-medium">{{ formatRequestType(requestType) }}</p>
                </div>
                <div>
                  <label class="text-xs text-muted-foreground">Fecha de creación</label>
                  <p class="font-medium">{{ formatDate(request.createdAt) }}</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-xs text-muted-foreground">Solicitante</label>
                  <p class="font-medium">{{ requesterName }}</p>
                  <p class="text-sm text-muted-foreground">{{ request.requester?.email }}</p>
                </div>
                <div v-if="isAdmin">
                  <label class="text-xs text-muted-foreground">Gestor asignado</label>
                  <p class="font-medium">{{ request.admin ? `${request.admin.firstName} ${request.admin.lastName}` : 'Sin asignar' }}</p>
                </div>
              </div>

              <!-- Descripción -->
              <div>
                <label class="text-xs text-muted-foreground">Descripción</label>
                <p class="text-sm mt-1 whitespace-pre-wrap">{{ request.description || 'Sin descripción' }}</p>
              </div>

              <!-- Datos específicos según tipo -->
              <RequestTypeDetails 
                v-if="false"
                :type="requestType" 
                :context="requestContext"
                :request="request"
              />

              <!-- Datos específicos NEW_USER -->
              <template v-if="requestType === 'NEW_USER'">
                <div class="border-t pt-4 mt-4">
                  <h4 class="font-medium mb-3">Datos del Referente</h4>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="text-xs text-muted-foreground">Nombre del referente</label>
                      <p class="font-medium">{{ request.requesterInfo?.name || 'N/A' }}</p>
                    </div>
                    <div>
                      <label class="text-xs text-muted-foreground">Email del referente</label>
                      <p class="font-medium">{{ request.requesterInfo?.email || 'N/A' }}</p>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Datos específicos FREE_DAY -->
              <template v-if="requestType === 'FREE_DAY'">
                <div class="border-t pt-4 mt-4">
                  <h4 class="font-medium mb-3">Detalles del Día Libre</h4>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="text-xs text-muted-foreground">Fecha solicitada</label>
                      <p class="font-medium">{{ formatDate(request.requestedDate) }}</p>
                    </div>
                    <div>
                      <label class="text-xs text-muted-foreground">Motivo</label>
                      <p class="font-medium">{{ requestContext.motivo || 'No especificado' }}</p>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Datos específicos SICK_LEAVE -->
              <template v-if="requestType === 'SICK_LEAVE'">
                <div class="border-t pt-4 mt-4">
                  <h4 class="font-medium mb-3">Detalles de la Baja</h4>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="text-xs text-muted-foreground">Tipo de baja</label>
                      <p class="font-medium">{{ formatSickLeaveSubType(requestContext.subType) }}</p>
                    </div>
                    <div>
                      <label class="text-xs text-muted-foreground">Estado del workflow</label>
                      <p class="font-medium">{{ request.currentState?.name }}</p>
                    </div>
                    <div v-if="request.startDate">
                      <label class="text-xs text-muted-foreground">Fecha inicio</label>
                      <p class="font-medium">{{ formatDate(request.startDate) }}</p>
                    </div>
                    <div v-if="request.endDate && request.endDate !== request.startDate">
                      <label class="text-xs text-muted-foreground">Fecha fin</label>
                      <p class="font-medium">{{ formatDate(request.endDate) }}</p>
                    </div>
                    <div v-if="requestContext.dates?.length > 0" class="col-span-2">
                      <label class="text-xs text-muted-foreground">Días afectados</label>
                      <div class="flex flex-wrap gap-2 mt-1">
                        <Badge v-for="date in requestContext.dates" :key="date" variant="outline">
                          {{ new Date(date).toLocaleDateString('es-ES') }}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Datos específicos MEDICAL -->
              <template v-if="requestType === 'MEDICAL_APPOINTMENT'">
                <div class="border-t pt-4 mt-4">
                  <h4 class="font-medium mb-3">Detalles de la Visita Médica</h4>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="text-xs text-muted-foreground">Fecha</label>
                      <p class="font-medium">{{ formatDate(request.requestedDate) }}</p>
                    </div>
                    <div>
                      <label class="text-xs text-muted-foreground">Hora</label>
                      <p class="font-medium">{{ requestContext.hora || 'No especificada' }}</p>
                    </div>
                    <div v-if="requestContext.especialidad">
                      <label class="text-xs text-muted-foreground">Especialidad</label>
                      <p class="font-medium">{{ requestContext.especialidad }}</p>
                    </div>
                    <div v-if="requestContext.centro">
                      <label class="text-xs text-muted-foreground">Centro</label>
                      <p class="font-medium">{{ requestContext.centro }}</p>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Datos específicos LEAVE/TRAINING -->
              <template v-if="['LEAVE', 'TRAINING'].includes(requestType)">
                <div class="border-t pt-4 mt-4">
                  <h4 class="font-medium mb-3">Período</h4>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="text-xs text-muted-foreground">Fecha inicio</label>
                      <p class="font-medium">{{ formatDate(request.startDate) }}</p>
                    </div>
                    <div>
                      <label class="text-xs text-muted-foreground">Fecha fin</label>
                      <p class="font-medium">{{ formatDate(request.endDate) }}</p>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Notas del admin -->
              <div v-if="request.adminNotes" class="border-t pt-4 mt-4">
                <label class="text-xs text-muted-foreground">Notas de gestión</label>
                <p class="text-sm mt-1 p-3 bg-muted rounded-lg">{{ request.adminNotes }}</p>
              </div>
            </CardContent>
          </Card>

          <!-- Documentos adjuntos -->
          <Card v-if="request.documents?.length > 0 || canUploadDocuments">
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Paperclip class="h-5 w-5" />
                Documentos Adjuntos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div v-if="request.documents?.length === 0" class="text-center py-4 text-muted-foreground">
                No hay documentos adjuntos
              </div>
              <div v-else class="space-y-2">
                <div 
                  v-for="doc in request.documents" 
                  :key="doc.id"
                  class="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div class="flex items-center gap-3">
                    <FileIcon class="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p class="font-medium text-sm">{{ doc.file?.name }}</p>
                      <p class="text-xs text-muted-foreground">
                        Subido por {{ doc.uploadedBy?.firstName }} {{ doc.uploadedBy?.lastName }} • 
                        {{ formatDate(doc.createdAt) }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <Badge :variant="getDocumentStatusVariant(doc.status)">
                      {{ formatDocumentStatus(doc.status) }}
                    </Badge>
                    <!-- Botón validar solo para admin -->
                    <button 
                      v-if="isAdmin && canValidateDocument(doc)"
                      @click="validateDocument(doc.id, true)"
                      class="p-1.5 text-green-600 hover:bg-green-100 rounded"
                      title="Validar documento"
                    >
                      <CheckCircle class="h-4 w-4" />
                    </button>
                    <button 
                      v-if="isAdmin && canValidateDocument(doc)"
                      @click="validateDocument(doc.id, false)"
                      class="p-1.5 text-red-600 hover:bg-red-100 rounded"
                      title="Rechazar documento"
                    >
                      <XCircle class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Subir documento (solo para requester) -->
              <div v-if="canUploadDocuments" class="mt-4 pt-4 border-t">
                <button 
                  @click="showUploadModal = true"
                  class="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Upload class="h-4 w-4" />
                  Adjuntar documento
                </button>
              </div>
            </CardContent>
          </Card>

          <!-- Historial de estados -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <History class="h-5 w-5" />
                Historial de Estados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div v-if="!request.stateHistory?.length" class="text-center py-4 text-muted-foreground">
                No hay historial disponible
              </div>
              <div v-else class="space-y-4">
                <div 
                  v-for="(entry, index) in request.stateHistory" 
                  :key="entry.id"
                  class="flex gap-4"
                >
                  <div class="flex flex-col items-center">
                    <div class="w-2 h-2 rounded-full bg-primary" />
                    <div v-if="index < request.stateHistory.length - 1" class="w-px h-full bg-border mt-1" />
                  </div>
                  <div class="pb-4">
                    <p class="font-medium text-sm">
                      Cambió a <Badge variant="outline">{{ entry.toState?.name }}</Badge>
                    </p>
                    <p class="text-xs text-muted-foreground">
                      Por {{ entry.actor?.firstName }} {{ entry.actor?.lastName }} • 
                      {{ formatDate(entry.createdAt) }}
                    </p>
                    <p v-if="entry.comment" class="text-sm mt-1 text-muted-foreground">
                      "{{ entry.comment }}"
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Columna lateral: Acciones -->
        <div class="space-y-6">
          <!-- Acciones de workflow -->
          <Card v-if="isAdmin && availableTransitions.length > 0">
            <CardHeader>
              <CardTitle class="text-base">Acciones</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <p class="text-sm text-muted-foreground mb-3">
                Selecciona la acción para esta solicitud:
              </p>
              <button
                v-for="transition in availableTransitions"
                :key="transition.id"
                @click="executeTransition(transition)"
                :disabled="executingTransition"
                class="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                :class="getTransitionButtonClass(transition.toState?.code)"
              >
                <span class="font-medium">{{ getTransitionLabel(transition.toState?.code) }}</span>
                <ChevronRight class="h-4 w-4" />
              </button>
            </CardContent>
          </Card>

          <!-- Información para no-admin -->
          <Card v-else-if="!isAdmin">
            <CardHeader>
              <CardTitle class="text-base">Estado de la solicitud</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-sm text-muted-foreground">
                Tu solicitud está actualmente en estado 
                <strong>{{ request.currentState?.name }}</strong>.
              </p>
              <p v-if="request.adminNotes" class="text-sm mt-3 p-3 bg-muted rounded-lg">
                <strong>Notas del gestor:</strong><br />
                {{ request.adminNotes }}
              </p>
            </CardContent>
          </Card>

          <!-- Info de solicitud NEW_USER -->
          <Card v-if="requestType === 'NEW_USER' && request.newUserData">
            <CardHeader>
              <CardTitle class="text-base flex items-center gap-2">
                <User class="h-4 w-4" />
                Datos del Nuevo Usuario
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div>
                <label class="text-xs text-muted-foreground">Nombre completo</label>
                <p class="font-medium">{{ request.newUserData.firstName }} {{ request.newUserData.lastName }}</p>
              </div>
              <div>
                <label class="text-xs text-muted-foreground">Email institucional</label>
                <p class="font-medium">{{ request.newUserData.email }}</p>
              </div>
              <div>
                <label class="text-xs text-muted-foreground">DNI</label>
                <p class="font-medium">{{ request.newUserData.dni }}</p>
              </div>
              <div v-if="request.additionalInfo?.department">
                <label class="text-xs text-muted-foreground">Departamento</label>
                <p class="font-medium">{{ request.additionalInfo.department }}</p>
              </div>
              <div v-if="request.additionalInfo?.specialty">
                <label class="text-xs text-muted-foreground">Especialidad</label>
                <p class="font-medium">{{ request.additionalInfo.specialty }}</p>
              </div>

              <!-- Info de usuario creado -->
              <div v-if="request.currentState?.code === 'approved'" class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p class="text-sm text-green-800">
                  <CheckCircle class="h-4 w-4 inline mr-1" />
                  <strong>Usuario validado</strong><br />
                  El usuario ha sido dado de alta en el sistema con el rol asignado.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- Modal para ejecutar transición -->
    <Dialog :open="showTransitionModal" @update:open="showTransitionModal = $event">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ getTransitionLabel(selectedTransition?.toState?.code) }}</DialogTitle>
          <DialogDescription>
            {{ selectedTransition?.requiresComment ? 'Esta acción requiere un comentario.' : 'Añade un comentario opcional.' }}
            <span v-if="isApprovingNewUser" class="block mt-1 text-amber-600">
              Al validar se creará automáticamente el usuario en el sistema.
            </span>
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <!-- Selector de rol para NEW_USER al aprobar -->
          <div v-if="isApprovingNewUser">
            <label class="text-sm font-medium">Rol del nuevo usuario *</label>
            <select
              v-model="selectedRole"
              class="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="PROFESOR">Profesor</option>
              <option value="EXPERTO">Experto/Colaborador</option>
              <option value="JEFE_DEPT">Jefe de Departamento</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">
              Comentario {{ selectedTransition?.requiresComment ? '*' : '(opcional)' }}
            </label>
            <textarea
              v-model="transitionComment"
              placeholder="Escribe un comentario..."
              class="mt-2 w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <button 
            @click="showTransitionModal = false"
            class="px-4 py-2 text-sm font-medium rounded-md border border-input hover:bg-accent"
          >
            Cancelar
          </button>
          <button 
            @click="confirmTransition"
            :disabled="executingTransition || (selectedTransition?.requiresComment && !transitionComment) || (isApprovingNewUser && !selectedRole)"
            class="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {{ executingTransition ? 'Procesando...' : 'Confirmar' }}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Loader2, RefreshCw, AlertCircle, FileX, FileText, 
         Paperclip, File as FileIcon, CheckCircle, XCircle, Upload,
         History, ChevronRight, User, UserPlus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const route = useRoute()
const requestId = route.params.id as string

// Estado
const { user } = await useUserSession()
const isAdmin = computed(() => ['ADMIN', 'ROOT'].includes(user.value?.role || ''))

const { data: requestData, pending, error, refresh } = await useFetch(`/api/requests/${requestId}`)
const request = computed(() => requestData.value?.data)

const { data: transitionsData, refresh: refreshTransitions } = await useFetch(`/api/requests/${requestId}/transitions`)
const availableTransitions = computed(() => transitionsData.value?.data || [])

// Computed
const requestType = computed(() => {
  if (!request.value?.context) return 'OTHER'
  try {
    return JSON.parse(request.value.context)?.type || 'OTHER'
  } catch {
    return 'OTHER'
  }
})

const requestContext = computed(() => {
  if (!request.value?.context) return {}
  try {
    return JSON.parse(request.value.context)
  } catch {
    return {}
  }
})

const requesterName = computed(() => {
  if (requestType.value === 'NEW_USER' && request.value?.requesterInfo) {
    return request.value.requesterInfo.name
  }
  const r = request.value?.requester
  return r ? `${r.firstName} ${r.lastName}` : 'Desconocido'
})

const canUploadDocuments = computed(() => {
  if (!request.value) return false
  const allowedStates = ['pending', 'communicated', 'pending_docs']
  return request.value.requesterId === user.value?.id && 
         allowedStates.includes(request.value.currentState?.code)
})

// Estados para modales
const showTransitionModal = ref(false)
const selectedTransition = ref<any>(null)
const transitionComment = ref('')
const selectedRole = ref('PROFESOR')
const executingTransition = ref(false)
const showUploadModal = ref(false)

// Computed para saber si estamos aprobando una solicitud NEW_USER
const isApprovingNewUser = computed(() => {
  return requestType.value === 'NEW_USER' && 
         selectedTransition.value?.toState?.code === 'approved'
})

// Métodos
const formatDate = (date: string | null | undefined) => {
  if (!date) return 'No especificado'
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatRequestType = (type: string) => {
  const types: Record<string, string> = {
    'FREE_DAY': 'Día de libre disposición',
    'MEDICAL_APPOINTMENT': 'Visita médica',
    'LEAVE': 'Permiso',
    'TRAINING': 'Formación',
    'OTHER': 'Otro',
    'NEW_USER': 'Alta de nuevo usuario',
    'SCHEDULE_VALIDATION': 'Validación de horario',
    'SICK_LEAVE': 'Comunicación de baja'
  }
  return types[type] || type
}

// Formatear subtipo de baja
const formatSickLeaveSubType = (subType: string) => {
  const types: Record<string, string> = {
    'BAJA_MEDICA': 'Baja Médica',
    'BAJA_MATERNIDAD': 'Baja por Maternidad/Paternidad',
    'BAJA_RIESGO_EMBARAZO': 'Baja por Riesgo en el Embarazo',
    'BAJA_ACCIDENTE_TRABAJO': 'Accidente de Trabajo',
    'PERMISO_FUERZA_MAYOR': 'Permiso por Fuerza Mayor',
    'OTRA': 'Otra'
  }
  return types[subType] || subType
}

const getStatusVariant = (status?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Pendiente': 'secondary',
    'Aprobado': 'default',
    'Aprobada': 'default',
    'Rechazado': 'destructive',
    'Rechazada': 'destructive',
    'En revisión': 'outline',
    'Completada': 'default',
    'Validada': 'default'
  }
  return variants[status || ''] || 'outline'
}

const formatDocumentStatus = (status: string) => {
  const statuses: Record<string, string> = {
    'PENDING': 'Pendiente',
    'SUBMITTED': 'Entregado',
    'VALID': 'Validado',
    'INVALID': 'Inválido',
    'REPLACED': 'Reemplazado'
  }
  return statuses[status] || status
}

const getDocumentStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'PENDING': 'secondary',
    'SUBMITTED': 'outline',
    'VALID': 'default',
    'INVALID': 'destructive',
    'REPLACED': 'outline'
  }
  return variants[status] || 'outline'
}

const canValidateDocument = (doc: any) => {
  return ['SUBMITTED', 'PENDING'].includes(doc.status)
}

const getTransitionLabel = (code?: string) => {
  const labels: Record<string, string> = {
    'approved': 'Validar',
    'rejected': 'Rechazar',
    'notified': 'Aceptar Notificación',
    'pending_docs': 'Solicitar Documentación',
    'pending_validation': 'Enviar a Validación',
    'validated': 'Validar Solicitud',
    'pending_notification': 'Marcar como Pendiente'
  }
  return labels[code || ''] || code || 'Continuar'
}

const getTransitionButtonClass = (code?: string) => {
  if (code === 'approved') return 'border-green-500 text-green-700 hover:bg-green-50'
  if (code === 'rejected') return 'border-red-500 text-red-700 hover:bg-red-50'
  return ''
}

const executeTransition = (transition: any) => {
  selectedTransition.value = transition
  transitionComment.value = ''
  selectedRole.value = request.value?.newUserData?.role || 'PROFESOR'
  showTransitionModal.value = true
}

const confirmTransition = async () => {
  if (!selectedTransition.value) return
  
  executingTransition.value = true
  try {
    const body: any = {
      toState: selectedTransition.value.toState.code,
      comment: transitionComment.value
    }
    
    // Si es aprobación de NEW_USER, incluir el rol seleccionado
    if (isApprovingNewUser.value) {
      body.metadata = { role: selectedRole.value }
    }
    
    const { error } = await useFetch(`/api/requests/${requestId}/transition`, {
      method: 'POST',
      body
    })
    
    if (error.value) throw error.value
    
    toast.success('Estado actualizado correctamente')
    showTransitionModal.value = false
    await refresh()
    await refreshTransitions()
  } catch (err: any) {
    toast.error(err.message || 'Error al actualizar el estado')
  } finally {
    executingTransition.value = false
  }
}

const validateDocument = async (documentId: string, valid: boolean) => {
  try {
    const { error } = await useFetch(`/api/documents/${documentId}/validate`, {
      method: 'PUT',
      body: { valid, notes: valid ? 'Documento validado' : 'Documento rechazado' }
    })
    
    if (error.value) throw error.value
    
    toast.success(valid ? 'Documento validado' : 'Documento marcado como inválido')
    await refresh()
  } catch (err: any) {
    toast.error(err.message || 'Error al validar el documento')
  }
}

const createUserFromRequest = async () => {
  if (!request.value?.newUserData) return
  
  creatingUser.value = true
  try {
    const userData = request.value.newUserData
    const { error } = await useFetch('/api/users', {
      method: 'POST',
      body: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        dni: userData.dni,
        phone: userData.phone,
        role: userData.role || 'PROFESOR',
        password: userData.password || Math.random().toString(36).slice(-8),
        department: request.value.additionalInfo?.department,
        isActive: true
      }
    })
    
    if (error.value) throw error.value
    
    toast.success('Usuario creado correctamente')
    await refresh()
  } catch (err: any) {
    toast.error(err.message || 'Error al crear el usuario')
  } finally {
    creatingUser.value = false
  }
}

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard'
})
</script>
