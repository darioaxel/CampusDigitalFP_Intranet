<script setup lang="ts">
import { FileText, Loader2, Upload } from 'lucide-vue-next'
import type { SickLeaveRequest } from '~/composables/useSickLeaveRequests'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props {
  requests: SickLeaveRequest[]
  loading: boolean
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
  'select': [request: SickLeaveRequest]
}>()

const formatDate = (date?: string | null) => {
  if (!date) return ''
  const d = props.parseAPIDate(date)
  return d ? d.toLocaleDateString('es-ES') : ''
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">Mis Solicitudes</CardTitle>
      <CardDescription>
        Historial de tus comunicaciones de baja
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="flex justify-center py-8">
        <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
      
      <div v-else-if="requests.length === 0" class="text-center py-8 text-muted-foreground">
        <FileText class="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No tienes solicitudes de baja</p>
      </div>
      
      <div v-else class="space-y-3">
        <div 
          v-for="request in requests" 
          :key="request.id"
          class="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          @click="emit('select', request)"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="font-medium text-sm">{{ formatTipoBaja(request.context) }}</p>
              <p class="text-xs text-muted-foreground">
                {{ formatDate(request.startDate) }}
                <span v-if="request.endDate && request.endDate !== request.startDate">
                  - {{ formatDate(request.endDate) }}
                </span>
              </p>
            </div>
            <Badge :class="getEstadoColor(request.currentState?.code)">
              {{ formatEstado(request.currentState?.code) }}
            </Badge>
          </div>
          
          <!-- Acciones rápidas según estado -->
          <div v-if="request.currentState?.code === 'pending_docs'" class="mt-2">
            <Button size="sm" variant="outline" class="w-full text-xs">
              <Upload class="w-3 h-3 mr-1" />
              Subir Documentos
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
