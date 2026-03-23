<script setup lang="ts">
// app/pages/admin/workflows/[id].vue
// Editor JSON de workflow

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth'],
  roles: ['ADMIN', 'ROOT']
})

import { ref, computed, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '@/components/ui/resizable'

import WorkflowJsonEditor from '@/components/workflow/WorkflowJsonEditor.vue'
import WorkflowElementsPanel from '@/components/workflow/WorkflowElementsPanel.vue'
import WorkflowPreview from '@/components/workflow/WorkflowPreview.vue'
import WorkflowValidationErrors from '@/components/workflow/WorkflowValidationErrors.vue'
import {
  validateWorkflowJson,
  formatWorkflowJson,
  workflowDbToJson
} from '@/lib/workflow-validation'
import type {
  WorkflowDefinitionJson,
  WorkflowValidationError
} from '@/types/workflow-editor'

const route = useRoute()
const router = useRouter()
const workflowId = route.params.id as string

// Estado
const loading = ref(true)
const saving = ref(false)
const workflowName = ref('')
const jsonContent = ref('')
const originalJson = ref('')
const activeTab = ref('editor')

const validationResult = ref<{
  valid: boolean
  errors: WorkflowValidationError[]
  data?: WorkflowDefinitionJson
}>({
  valid: false,
  errors: []
})

const hasChanges = computed(() => {
  return jsonContent.value !== originalJson.value
})

const isValid = computed(() => {
  return validationResult.value.valid
})

// Cargar workflow
const fetchWorkflow = async () => {
  loading.value = true
  try {
    const response = await $fetch(`/api/admin/workflows/${workflowId}/export`)
    const json = response.data as WorkflowDefinitionJson
    workflowName.value = json.name
    jsonContent.value = JSON.stringify(json, null, 2)
    originalJson.value = jsonContent.value

    // Validar inicial
    validationResult.value = validateWorkflowJson(jsonContent.value)
  } catch (error) {
    console.error('Error cargando workflow:', error)
  } finally {
    loading.value = false
  }
}

// Guardar workflow
const saveWorkflow = async () => {
  if (!isValid.value) {
    alert('Corrige los errores antes de guardar')
    return
  }

  saving.value = true
  try {
    await $fetch('/api/admin/workflows/import', {
      method: 'POST',
      body: {
        json: jsonContent.value,
        workflowId
      }
    })
    originalJson.value = jsonContent.value
    alert('Workflow guardado correctamente')
    // Recargar para obtener la nueva versión
    await fetchWorkflow()
  } catch (error: any) {
    alert(error.statusMessage || 'Error al guardar workflow')
  } finally {
    saving.value = false
  }
}

// Insertar snippet en el editor
const insertSnippet = (code: string) => {
  // Insertar al final del contenido o en la posición del cursor
  // Por simplicidad, lo insertamos al final con una coma si es necesario
  const trimmed = jsonContent.value.trim()
  if (trimmed.endsWith('}')) {
    // Insertar antes del último cierre
    const lastBrace = trimmed.lastIndexOf('}')
    const before = trimmed.slice(0, lastBrace)
    const after = trimmed.slice(lastBrace)
    jsonContent.value = before + ',\n  ' + code.replace(/^\{\n/, '').replace(/\n\}$/, '') + '\n' + after
  } else {
    jsonContent.value += '\n' + code
  }
}

// Manejar validación del editor
const handleValidation = (result: typeof validationResult.value) => {
  validationResult.value = result
}

// Ir a error (scroll al elemento)
const goToError = (error: WorkflowValidationError) => {
  // Por ahora solo mostramos el error, en una implementación completa
  // podríamos hacer scroll a la línea específica
  console.log('Navegar a error:', error.path)
}

// Volver al listado
const goBack = () => {
  router.push('/admin/workflows')
}

// Descargar JSON
const downloadJson = () => {
  const blob = new Blob([jsonContent.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${validationResult.value.data?.code || 'workflow'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Resetear cambios
const resetChanges = () => {
  if (confirm('¿Descartar todos los cambios?')) {
    jsonContent.value = originalJson.value
  }
}

// Formatear JSON
const formatJson = () => {
  try {
    const parsed = JSON.parse(jsonContent.value)
    jsonContent.value = JSON.stringify(parsed, null, 2)
  } catch (e) {
    // Ignorar error
  }
}

onMounted(fetchWorkflow)
</script>

<template>
  <div class="h-screen flex flex-col">
    <!-- Header -->
    <div class="border-b bg-background px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" @click="goBack">
          <Icon name="lucide:arrow-left" class="w-4 h-4" />
        </Button>
        <div>
          <h1 class="font-semibold flex items-center gap-2">
            {{ workflowName || 'Cargando...' }}
            <Badge
              v-if="hasChanges"
              variant="outline"
              class="text-[10px]"
            >
              Modificado
            </Badge>
          </h1>
          <p class="text-xs text-muted-foreground">
            Editor JSON de Workflow
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Estado de validación -->
        <Badge
          v-if="!loading"
          :variant="isValid ? 'default' : 'destructive'"
          class="mr-2"
        >
          <Icon
            :name="isValid ? 'lucide:check-circle' : 'lucide:alert-circle'"
            class="w-3 h-3 mr-1"
          />
          {{ isValid ? 'Válido' : 'Errores' }}
        </Badge>

        <Button
          variant="outline"
          size="sm"
          @click="formatJson"
          :disabled="loading"
        >
          <Icon name="lucide:align-left" class="w-4 h-4 mr-1" />
          Formatear
        </Button>

        <Button
          variant="outline"
          size="sm"
          @click="downloadJson"
          :disabled="loading"
        >
          <Icon name="lucide:download" class="w-4 h-4 mr-1" />
          Descargar
        </Button>

        <Button
          variant="outline"
          size="sm"
          @click="resetChanges"
          :disabled="loading || !hasChanges"
        >
          <Icon name="lucide:rotate-ccw" class="w-4 h-4 mr-1" />
          Resetear
        </Button>

        <Button
          size="sm"
          @click="saveWorkflow"
          :disabled="loading || !isValid || saving || !hasChanges"
        >
          <Icon
            :name="saving ? 'lucide:loader-2' : 'lucide:save'"
            class="w-4 h-4 mr-1"
            :class="{ 'animate-spin': saving }"
          />
          {{ saving ? 'Guardando...' : 'Guardar' }}
        </Button>
      </div>
    </div>

    <!-- Contenido -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-muted-foreground" />
    </div>

    <ResizablePanelGroup v-else direction="horizontal" class="flex-1">
      <!-- Panel izquierdo: Elementos -->
      <ResizablePanel :default-size="20" :min-size="15" :max-size="30">
        <WorkflowElementsPanel @insert="insertSnippet" />
      </ResizablePanel>

      <ResizableHandle with-handle />

      <!-- Panel central: Editor -->
      <ResizablePanel :default-size="50">
        <Tabs v-model="activeTab" class="h-full flex flex-col">
          <TabsList class="mx-4 mt-2">
            <TabsTrigger value="editor" class="flex items-center gap-1">
              <Icon name="lucide:code-2" class="w-4 h-4" />
              Editor JSON
            </TabsTrigger>
            <TabsTrigger value="preview" class="flex items-center gap-1">
              <Icon name="lucide:eye" class="w-4 h-4" />
              Vista previa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" class="flex-1 mt-0">
            <WorkflowJsonEditor
              v-model="jsonContent"
              height="calc(100vh - 180px)"
              @validation="handleValidation"
            />
          </TabsContent>

          <TabsContent value="preview" class="flex-1 mt-0 overflow-hidden">
            <WorkflowPreview :workflow="validationResult.data" />
          </TabsContent>
        </Tabs>

        <!-- Errores de validación -->
        <WorkflowValidationErrors
          :errors="validationResult.errors"
          @go-to-error="goToError"
        />
      </ResizablePanel>

      <ResizableHandle with-handle />

      <!-- Panel derecho: Vista previa siempre visible -->
      <ResizablePanel :default-size="30" :min-size="20">
        <WorkflowPreview :workflow="validationResult.data" />
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
</template>

<style scoped>
:deep(.tabs-content) {
  height: 100%;
}
</style>
