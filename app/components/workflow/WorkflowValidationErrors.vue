<script setup lang="ts">
// app/components/workflow/WorkflowValidationErrors.vue
// Lista de errores de validación del workflow

import type { WorkflowValidationError } from '@/types/workflow-editor'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Props {
  errors: WorkflowValidationError[]
  maxHeight?: string
}

withDefaults(defineProps<Props>(), {
  maxHeight: '200px'
})

const emit = defineEmits<{
  'goToError': [error: WorkflowValidationError]
}>()
</script>

<template>
  <div v-if="errors.length > 0" class="workflow-validation-errors border-t">
    <div class="p-2 px-3 bg-muted/30 flex items-center justify-between">
      <h4 class="text-xs font-medium flex items-center gap-2">
        <Icon
          name="lucide:alert-circle"
          class="w-4 h-4"
          :class="errors.some(e => e.severity === 'error') ? 'text-red-500' : 'text-yellow-500'"
        />
        Problemas detectados ({{ errors.length }})
      </h4>
    </div>

    <ScrollArea :style="{ maxHeight }">
      <div class="divide-y">
        <button
          v-for="(error, idx) in errors"
          :key="idx"
          class="w-full text-left p-2 px-3 hover:bg-muted/50 transition-colors flex items-start gap-2"
          @click="emit('goToError', error)"
        >
          <Icon
            :name="error.severity === 'error' ? 'lucide:x-circle' : 'lucide:alert-triangle'"
            class="w-4 h-4 flex-shrink-0 mt-0.5"
            :class="error.severity === 'error' ? 'text-red-500' : 'text-yellow-500'"
          />
          <div class="flex-1 min-w-0">
            <code v-if="error.path" class="text-[10px] bg-muted px-1.5 py-0.5 rounded">
              {{ error.path }}
            </code>
            <p class="text-xs mt-0.5">{{ error.message }}</p>
          </div>
        </button>
      </div>
    </ScrollArea>
  </div>
</template>
