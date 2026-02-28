<script setup lang="ts">
import { Send, Loader2 } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Transition {
  id: string
  toState: {
    code: string
    name: string
  }
  requiresComment: boolean
}

interface Props {
  open: boolean
  transition: Transition | null
  executing: boolean
  comment: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:comment': [value: string]
  confirm: []
}>()

const getTransitionTitle = (code?: string): string => {
  const titles: Record<string, string> = {
    'notified': 'Aceptar Notificación',
    'pending_docs': 'Solicitar Documentación',
    'pending_validation': 'Enviar a Validación',
    'validated': 'Validar Solicitud',
    'rejected': 'Rechazar Solicitud',
    'pending_notification': 'Marcar como Pendiente'
  }
  return titles[code || ''] || 'Cambiar Estado'
}

const commentModel = computed({
  get: () => props.comment,
  set: (value) => emit('update:comment', value)
})

const isConfirmDisabled = computed(() => {
  if (props.executing) return true
  if (props.transition?.requiresComment && !props.comment) return true
  return false
})
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ getTransitionTitle(transition?.toState?.code) }}</DialogTitle>
        <DialogDescription>
          {{ transition?.requiresComment ? 'Esta acción requiere un comentario.' : 'Añade un comentario opcional.' }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div>
          <Label>
            Comentario {{ transition?.requiresComment ? '*' : '(opcional)' }}
          </Label>
          <Textarea
            v-model="commentModel"
            placeholder="Escribe un comentario..."
            rows="3"
            class="mt-2"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">Cancelar</Button>
        <Button 
          @click="emit('confirm')" 
          :disabled="isConfirmDisabled"
          :variant="transition?.toState?.code === 'rejected' ? 'destructive' : 'default'"
        >
          <Loader2 v-if="executing" class="w-4 h-4 mr-2 animate-spin" />
          <Send v-else class="w-4 h-4 mr-2" />
          Confirmar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
