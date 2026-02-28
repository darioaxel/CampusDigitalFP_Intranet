<script setup lang="ts">
import { Send, Loader2, Info } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

interface Props {
  open: boolean
  title?: string
  description?: string
  submitting?: boolean
  confirmText?: string
  showAlert?: boolean
  alertTitle?: string
  alertDescription?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Confirmar Comunicación de Baja',
  description: 'Revisa los datos antes de enviar la solicitud.',
  confirmText: 'Confirmar y Enviar',
  showAlert: true,
  alertTitle: 'Importante',
  alertDescription: 'Tras enviar la comunicación, deberás esperar a que administración la acepte. Posteriormente deberás subir la documentación justificativa.'
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
}>()
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>
          {{ description }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Slot para contenido personalizado -->
        <slot />

        <Alert v-if="showAlert">
          <Info class="h-4 w-4" />
          <AlertTitle>{{ alertTitle }}</AlertTitle>
          <AlertDescription>
            {{ alertDescription }}
          </AlertDescription>
        </Alert>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">
          Cancelar
        </Button>
        <Button @click="emit('confirm')" :disabled="submitting">
          <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
          <Send v-else class="w-4 h-4 mr-2" />
          {{ confirmText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
