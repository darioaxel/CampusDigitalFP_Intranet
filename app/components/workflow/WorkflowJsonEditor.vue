<script setup lang="ts">
// app/components/workflow/WorkflowJsonEditor.vue
// Editor JSON para workflows con validación en tiempo real

import { ref, computed, watch } from 'vue'
import { validateWorkflowJson, formatWorkflowJson } from '@/lib/workflow-validation'
import type { WorkflowDefinitionJson, WorkflowValidationError } from '@/types/workflow-editor'

interface Props {
  modelValue: string
  readOnly?: boolean
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
  height: '500px'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'validation': [result: { valid: boolean; errors: WorkflowValidationError[]; data?: WorkflowDefinitionJson }]
}>()

const editorContent = ref(props.modelValue)
const isValidating = ref(false)

// Sincronizar con prop externa
watch(() => props.modelValue, (newVal) => {
  if (newVal !== editorContent.value) {
    editorContent.value = newVal
  }
}, { immediate: true })

// Validación en tiempo real (con debounce)
let validationTimeout: ReturnType<typeof setTimeout> | null = null

const validationResult = computed(() => {
  return validateWorkflowJson(editorContent.value)
})

watch(editorContent, () => {
  emit('update:modelValue', editorContent.value)

  if (validationTimeout) {
    clearTimeout(validationTimeout)
  }

  isValidating.value = true
  validationTimeout = setTimeout(() => {
    const result = validateWorkflowJson(editorContent.value)
    emit('validation', result)
    isValidating.value = false
  }, 300)
}, { immediate: true })

// Formatear JSON
const formatJson = () => {
  try {
    const parsed = JSON.parse(editorContent.value)
    editorContent.value = formatWorkflowJson(parsed)
  } catch (e) {
    // Ignorar error de parseo
  }
}

// Contar líneas para el gutter
const lineCount = computed(() => {
  return editorContent.value.split('\n').length
})

const lineNumbers = computed(() => {
  return Array.from({ length: lineCount.value }, (_, i) => i + 1)
})

// Minimapa de errores para mostrar en scrollbar
const errorLines = computed(() => {
  const errors = validationResult.value.errors
  const lines = new Set<number>()

  errors.forEach(error => {
    // Intentar extraer número de línea del path o mensaje
    const lineMatch = editorContent.value.substring(0, editorContent.value.indexOf(error.path) + 1).split('\n').length - 1
    if (lineMatch > 0) lines.add(lineMatch)
  })

  return lines
})

// Clase CSS para el estado de validación
const editorStatusClass = computed(() => {
  if (validationResult.value.errors.length === 0) return 'border-green-500'
  const hasErrors = validationResult.value.errors.some(e => e.severity === 'error')
  return hasErrors ? 'border-red-500' : 'border-yellow-500'
})
</script>

<template>
  <div class="workflow-json-editor">
    <!-- Toolbar -->
    <div class="flex items-center justify-between p-2 bg-muted/50 border-b">
      <div class="flex items-center gap-2">
        <span class="text-xs font-medium text-muted-foreground">Editor JSON</span>
        <Badge
          v-if="!isValidating"
          :variant="validationResult.errors.length === 0 ? 'default' : 'destructive'"
          class="text-xs"
        >
          <Icon
            :name="validationResult.errors.length === 0 ? 'lucide:check-circle' : 'lucide:alert-circle'"
            class="w-3 h-3 mr-1"
          />
          {{ validationResult.errors.length === 0 ? 'Válido' : `${validationResult.errors.length} ${validationResult.errors.length === 1 ? 'problema' : 'problemas'}` }}
        </Badge>
        <Badge v-else variant="outline" class="text-xs">
          <Icon name="lucide:loader-2" class="w-3 h-3 mr-1 animate-spin" />
          Validando...
        </Badge>
      </div>
      <Button
        v-if="!readOnly"
        variant="ghost"
        size="sm"
        @click="formatJson"
        :disabled="validationResult.parseError !== undefined"
      >
        <Icon name="lucide:align-left" class="w-4 h-4 mr-1" />
        Formatear
      </Button>
    </div>

    <!-- Editor -->
    <div
      class="relative flex border-2 rounded-b-md transition-colors"
      :class="editorStatusClass"
      :style="{ height }"
    >
      <!-- Line numbers -->
      <div class="flex-none w-12 bg-muted/30 border-r py-2 text-right select-none overflow-hidden">
        <div
          v-for="num in lineNumbers"
          :key="num"
          class="px-2 text-xs leading-5"
          :class="errorLines.has(num) ? 'text-red-500 bg-red-500/10 font-bold' : 'text-muted-foreground'"
        >
          {{ num }}
        </div>
      </div>

      <!-- Textarea -->
      <textarea
        v-model="editorContent"
        :readonly="readOnly"
        class="flex-1 p-2 font-mono text-sm leading-5 resize-none outline-none bg-background"
        :class="{ 'bg-muted/50': readOnly }"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        autocorrect="off"
      />
    </div>
  </div>
</template>

<style scoped>
.workflow-json-editor textarea {
  tab-size: 2;
}
</style>
