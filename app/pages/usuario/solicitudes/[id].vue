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
              <h1 class="text-xl font-semibold">Mi Solicitud</h1>
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

              <div>
                <label class="text-xs text-muted-foreground">Solicitante</label>
                <p class="font-medium">{{ requesterName }}</p>
                <p class="text-sm text-muted-foreground">{{ request.requester?.email }}</p>
              </div>

              <!-- Descripción -->
              <div>
                <label class="text-xs text-muted-foreground">Descripción</label>
                <p class="text-sm mt-1 whitespace-pre-wrap">{{ request.description || 'Sin descripción' }}</p>
              </div>

              <!-- Datos específicos según tipo -->
              <!-- FREE_DAY -->
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

              <!-- SICK_LEAVE -->
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

              <!-- MEDICAL -->
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

              <!-- LEAVE/TRAINING -->
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
                        Subido el {{ formatDate(doc.createdAt) }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <Badge :variant="getDocumentStatusVariant(doc.status)">
                      {{ formatDocumentStatus(doc.status) }}
                    </Badge>
                  </div>
                </div>
              </div>

              <!-- Subir documento -->
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

        <!-- Columna lateral: Estado y acciones -->
        <div class="space-y-6">
          <!-- Estado actual -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base">Estado de tu solicitud</CardTitle>
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
              
              <!-- Información según estado -->
              <div class="mt-4 space-y-2">
                <div v-if="canUploadDocuments" class="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p class="text-sm text-amber-800">
                    <Info class="h-4 w-4 inline mr-1" />
                    <strong>Documentación requerida</strong><br />
                    Se requiere que adjuntes documentación para continuar con tu solicitud.
                  </p>
                </div>
                
                <div v-if="request.currentState?.isFinal" class="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p class="text-sm text-green-800">
                    <CheckCircle class="h-4 w-4 inline mr-1" />
                    <strong>Solicitud finalizada</strong><br />
                    Esta solicitud ha sido completada.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Acciones disponibles -->
          <Card v-if="canUploadDocuments">
            <CardHeader>
              <CardTitle class="text-base">Acciones disponibles</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <button
                @click="showUploadModal = true"
                class="w-full flex items-center justify-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
              >
                <Upload class="h-4 w-4" />
                <span class="font-medium">Subir documentación</span>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- Modal para subir documentos -->
    <Dialog :open="showUploadModal" @update:open="showUploadModal = $event">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjuntar documento</DialogTitle>
          <DialogDescription>
            Sube el documento requerido para tu solicitud.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div>
            <label class="text-sm font-medium">Archivo</label>
            <input
              type="file"
              @change="handleFileChange"
              class="mt-2 w-full text-sm"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <p class="text-xs text-muted-foreground mt-1">
              Formatos permitidos: PDF, JPG, PNG, DOC, DOCX
            </p>
          </div>
          <div>
            <label class="text-sm font-medium">Descripción (opcional)</label>
            <textarea
              v-model="documentDescription"
              placeholder="Describe el documento..."
              class="mt-2 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <button 
            @click="showUploadModal = false"
            class="px-4 py-2 text-sm font-medium rounded-md border border-input hover:bg-accent"
          >
            Cancelar
          </button>
          <button 
            @click="uploadDocument"
            :disabled="!selectedFile || uploadingDocument"
            class="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {{ uploadingDocument ? 'Subiendo...' : 'Subir' }}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Loader2, RefreshCw, AlertCircle, FileX, FileText, 
         Paperclip, File as FileIcon, CheckCircle, Upload, History, Info } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const route = useRoute()
const requestId = route.params.id as string

// Estado
const { user } = await useUserSession()

const { data: requestData, pending, error, refresh } = await useFetch(`/api/requests/${requestId}`)
const request = computed(() => requestData.value?.data)

// Verificar que el usuario es el creador de la solicitud
const isOwner = computed(() => {
  return request.value?.requesterId === user.value?.id
})

// Si no es el dueño, redirigir a admin (por si un admin intenta acceder a solicitud de otro)
watchEffect(() => {
  if (request.value && !isOwner.value && ['ADMIN', 'ROOT'].includes(user.value?.role || '')) {
    navigateTo(`/admin/solicitudes/${requestId}`)
  }
})

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
const showUploadModal = ref(false)
const selectedFile = ref<File | null>(null)
const documentDescription = ref('')
const uploadingDocument = ref(false)

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

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0]
  }
}

const uploadDocument = async () => {
  if (!selectedFile.value) return
  
  uploadingDocument.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('requestId', requestId)
    if (documentDescription.value) {
      formData.append('description', documentDescription.value)
    }
    
    const { error } = await useFetch('/api/documents/upload', {
      method: 'POST',
      body: formData
    })
    
    if (error.value) throw error.value
    
    toast.success('Documento subido correctamente')
    showUploadModal.value = false
    selectedFile.value = null
    documentDescription.value = ''
    await refresh()
  } catch (err: any) {
    toast.error(err.message || 'Error al subir el documento')
  } finally {
    uploadingDocument.value = false
  }
}

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard'
})
</script>
