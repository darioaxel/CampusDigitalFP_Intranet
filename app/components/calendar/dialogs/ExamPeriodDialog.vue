<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
/**
 * Modal para marcar días como período de evaluación/exámenes
 * 
 * @example
 * ```vue
 * <ExamPeriodDialog
 *   v-model:open="showExamModal"
 *   :selected-days-count="selectedDays.length"
 *   :selected-days-text="selectedDaysText"
 *   :loading="saving"
 *   @submit="handleExamSubmit"
 * />
 * ```
 */
interface Props {
  open: boolean
  selectedDaysCount: number
  selectedDaysText: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'submit': [data: { type: string; description: string }]
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const form = reactive({
  type: '',
  description: '',
})

// Resetear formulario cuando se abre
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    form.type = ''
    form.description = ''
  }
})

function handleSubmit() {
  emit('submit', {
    type: form.type,
    description: form.description,
  })
}

function handleClose() {
  isOpen.value = false
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle>Marcar como Periodo de Exámenes</DialogTitle>
        <DialogDescription>
          Se marcarán {{ selectedDaysCount }} días como periodo de evaluación
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <Label for="examType">Tipo de evaluación</Label>
          <Input 
            id="examType" 
            v-model="form.type" 
            placeholder="Ej: DAM/DAW, junio 1, extraordinarios..."
            required
          />
          <p class="text-xs text-muted-foreground">
            Este texto se mostrará en el título del evento
          </p>
        </div>
        
        <div class="space-y-2">
          <Label for="examDescription">Descripción (opcional)</Label>
          <Textarea 
            id="examDescription" 
            v-model="form.description" 
            placeholder="Detalles adicionales..."
            rows="2"
          />
        </div>
        
        <div class="bg-muted p-3 rounded-lg text-sm">
          <p class="font-medium mb-1">Días seleccionados:</p>
          <p class="text-muted-foreground">
            {{ selectedDaysText }}
          </p>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose">
            Cancelar
          </Button>
          <Button type="submit" :disabled="loading">
            <Loader2 v-if="loading" class="h-4 w-4 mr-2 animate-spin" />
            Marcar como exámenes
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
