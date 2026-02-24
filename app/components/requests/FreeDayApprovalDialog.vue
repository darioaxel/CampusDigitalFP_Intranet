<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Users,
  AlertCircle
} from 'lucide-vue-next'

const props = defineProps<{
  requestId: string | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'approved': []
  'rejected': []
}>()

// Estado
const loading = ref(false)
const notes = ref('')
const details = ref<any>(null)

// Cargar detalles cuando se abre
watch(() => props.open, async (isOpen) => {
  if (isOpen && props.requestId) {
    await loadDetails()
  }
})

const loadDetails = async () => {
  if (!props.requestId) return
  
  loading.value = true
  try {
    const response = await $fetch(`/api/requests/${props.requestId}/details`)
    details.value = response.data
  } catch (error) {
    console.error('Error loading details:', error)
  } finally {
    loading.value = false
  }
}

const handleApprove = async () => {
  if (!props.requestId) return
  
  loading.value = true
  try {
    await $fetch(`/api/requests/${props.requestId}/transition`, {
      method: 'POST',
      body: {
        toStatus: 'APPROVED',
        comment: notes.value
      }
    })
    
    emit('approved')
    emit('update:open', false)
    notes.value = ''
  } catch (error: any) {
    alert(error.data?.message || 'Error al aprobar')
  } finally {
    loading.value = false
  }
}

const handleReject = async () => {
  if (!props.requestId) return
  
  loading.value = true
  try {
    await $fetch(`/api/requests/${props.requestId}/transition`, {
      method: 'POST',
      body: {
        toStatus: 'REJECTED',
        comment: notes.value
      }
    })
    
    emit('rejected')
    emit('update:open', false)
    notes.value = ''
  } catch (error: any) {
    alert(error.data?.message || 'Error al rechazar')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <AlertCircle class="w-5 h-5 text-amber-500" />
          Revisar solicitud de libre disposición
        </DialogTitle>
        <DialogDescription>
          Revisa los detalles antes de aprobar o denegar la solicitud
        </DialogDescription>
      </DialogHeader>

      <div v-if="loading" class="flex items-center justify-center py-8">
        <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
      </div>

      <div v-else-if="details" class="space-y-6">
        <!-- Información del profesor -->
        <div class="bg-muted/50 p-4 rounded-lg space-y-3">
          <div class="flex items-center gap-3">
            <div class="bg-primary/10 p-2 rounded-full">
              <User class="w-5 h-5 text-primary" />
            </div>
            <div>
              <p class="font-medium">{{ details.teacher.name }}</p>
              <p class="text-sm text-muted-foreground">{{ details.teacher.email }}</p>
            </div>
          </div>
          
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="bg-background rounded p-2">
              <p class="text-lg font-bold text-green-600">{{ details.teacher.stats.approved }}</p>
              <p class="text-xs text-muted-foreground">Aprobados</p>
            </div>
            <div class="bg-background rounded p-2">
              <p class="text-lg font-bold text-amber-600">{{ details.teacher.stats.pending }}</p>
              <p class="text-xs text-muted-foreground">Pendientes</p>
            </div>
            <div class="bg-background rounded p-2">
              <p class="text-lg font-bold">{{ details.teacher.stats.total }}</p>
              <p class="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>

        <!-- Fecha solicitada -->
        <div class="flex items-center gap-3">
          <Calendar class="w-5 h-5 text-muted-foreground" />
          <div>
            <p class="text-sm text-muted-foreground">Fecha solicitada</p>
            <p class="font-medium">{{ new Date(details.request.requestedDate).toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) }}</p>
          </div>
        </div>

        <!-- Profesores con mismo día aprobado -->
        <div v-if="details.sameDay.approvedCount > 0" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-center gap-2 text-red-700 mb-2">
            <Users class="w-4 h-4" />
            <p class="font-medium">Atención: {{ details.sameDay.approvedCount }} profesores ya tienen aprobado este día</p>
          </div>
          <ul class="text-sm text-red-600 space-y-1">
            <li v-for="teacher in details.sameDay.teachers" :key="teacher.name">
              • {{ teacher.name }}
            </li>
          </ul>
        </div>

        <div v-else class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-center gap-2 text-green-700">
            <CheckCircle class="w-4 h-4" />
            <p class="font-medium">Ningún profesor tiene aprobado este día aún</p>
          </div>
        </div>

        <!-- Motivo -->
        <div v-if="details.request.description">
          <p class="text-sm text-muted-foreground mb-1">Motivo del profesor:</p>
          <p class="text-sm bg-muted p-2 rounded">{{ details.request.description }}</p>
        </div>

        <!-- Observaciones -->
        <div class="space-y-2">
          <Label for="notes">Observaciones (opcional)</Label>
          <Textarea
            id="notes"
            v-model="notes"
            placeholder="Añade observaciones sobre la decisión..."
            rows="3"
          />
        </div>
      </div>

      <DialogFooter v-if="details" class="gap-2">
        <Button variant="outline" @click="emit('update:open', false)">
          Cancelar
        </Button>
        <Button 
          variant="destructive" 
          @click="handleReject"
          :disabled="loading"
        >
          <XCircle class="w-4 h-4 mr-2" />
          Denegar
        </Button>
        <Button 
          @click="handleApprove"
          :disabled="loading"
        >
          <CheckCircle class="w-4 h-4 mr-2" />
          Aprobar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
