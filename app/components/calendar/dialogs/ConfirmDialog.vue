<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
/**
 * Modal de confirmación genérico reutilizable
 * 
 * @example
 * ```vue
 * <ConfirmDialog
 *   v-model:open="showDeleteModal"
 *   title="Eliminar elemento"
 *   description="¿Estás seguro de que deseas eliminar este elemento?"
 *   icon="lucide:trash-2"
 *   icon-class="text-destructive"
 *   confirm-text="Eliminar"
 *   confirm-variant="destructive"
 *   :loading="isLoading"
 *   @confirm="handleConfirm"
 * />
 * ```
 */
interface Props {
  open: boolean
  title: string
  description?: string
  icon?: string
  iconClass?: string
  cancelText?: string
  confirmText?: string
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  loading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  icon: 'lucide:alert-triangle',
  iconClass: 'text-amber-500',
  cancelText: 'Cancelar',
  confirmText: 'Confirmar',
  confirmVariant: 'default',
  loading: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
  'cancel': []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
  isOpen.value = false
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Icon :name="icon" class="h-5 w-5" :class="iconClass" />
          {{ title }}
        </DialogTitle>
        <DialogDescription v-if="description">
          {{ description }}
        </DialogDescription>
        <slot name="description" />
      </DialogHeader>
      
      <slot />
      
      <DialogFooter>
        <Button 
          type="button" 
          variant="outline" 
          @click="handleCancel"
          :disabled="loading"
        >
          {{ cancelText }}
        </Button>
        <Button 
          type="button" 
          :variant="confirmVariant" 
          @click="handleConfirm"
          :disabled="loading || disabled"
        >
          <Loader2 v-if="loading" class="h-4 w-4 mr-2 animate-spin" />
          {{ confirmText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
