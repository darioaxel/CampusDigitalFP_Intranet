<script setup lang="ts">
import { Download, AlertTriangle, FileText } from 'lucide-vue-next'
import type { SickLeaveRequest } from '~/composables/useSickLeaveRequests'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import DocumentUploader from './DocumentUploader.vue'

interface Props {
  open: boolean
  request: SickLeaveRequest | null
  formatEstado: (code?: string) => string
  getEstadoColor: (code?: string) => string
  formatTipoBaja: (context?: string) => string
  parseAPIDate?: (dateStr?: string | null) => Date | null
}

const props = withDefaults(defineProps<Props>(), {
  parseAPIDate: (dateStr?: string | null) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? null : date
  }
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'uploaded': []
  'download': [documentId: string, fileName: string]
}>()

const canUploadDocuments = computed(() => {
  return props.request?.currentState?.code === 'pending_docs'
})

const formatDate = (date?: string | null) => {
  if (!date) return 'No especificada'
  const d = props.parseAPIDate(date)
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
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-2xl" v-if="request">
      <DialogHeader>
        <DialogTitle>Detalle de la Solicitud</DialogTitle>
        <DialogDescription>
          {{ formatTipoBaja(request.context) }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Estado actual -->
        <div class="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span class="text-sm font-medium">Estado actual:</span>
          <Badge :class="getEstadoColor(request.currentState?.code)">
            {{ formatEstado(request.currentState?.code) }}
          </Badge>
        </div>

        <!-- Fechas -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label class="text-muted-foreground">Fecha inicio</Label>
            <p>{{ formatDate(request.startDate) }}</p>
          </div>
          <div>
            <Label class="text-muted-foreground">Fecha fin</Label>
            <p>{{ formatDate(request.endDate) }}</p>
          </div>
        </div>

        <!-- Días afectados -->
        <div v-if="getDatesFromContext(request.context).length > 0">
          <Label class="text-muted-foreground">Días afectados</Label>
          <div class="flex flex-wrap gap-2 mt-1">
            <Badge 
              v-for="date in getDatesFromContext(request.context)" 
              :key="date" 
              variant="outline"
            >
              {{ new Date(date).toLocaleDateString('es-ES') }}
            </Badge>
          </div>
        </div>

        <!-- Observaciones -->
        <div v-if="request.description">
          <Label class="text-muted-foreground">Observaciones</Label>
          <p class="text-sm mt-1 p-3 bg-muted rounded-lg">{{ request.description }}</p>
        </div>

        <!-- Documentos -->
        <div v-if="request.documents && request.documents.length > 0">
          <Label class="text-muted-foreground">Documentos Adjuntos</Label>
          <div class="space-y-2 mt-2">
            <div 
              v-for="doc in request.documents" 
              :key="doc.id"
              class="flex items-center justify-between p-2 border rounded"
            >
              <div class="flex items-center gap-2">
                <FileText class="w-4 h-4 text-muted-foreground" />
                <span class="text-sm">{{ doc.file?.name }}</span>
              </div>
              <Button 
                size="sm" 
                variant="ghost"
                @click="emit('download', doc.id, doc.file?.name)"
              >
                <Download class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Subir documentos (solo en estado pending_docs) -->
        <div v-if="canUploadDocuments">
          <Label class="text-muted-foreground mb-2 block">Subir Documentos</Label>
          <DocumentUploader 
            :request-id="request.id"
            @uploaded="emit('uploaded')"
          />
        </div>
      </div>

      <DialogFooter>
        <Button @click="emit('update:open', false)">Cerrar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
