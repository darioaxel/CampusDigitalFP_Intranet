<script setup lang="ts">
// app/pages/admin/workflows/[id].vue
// Editor JSON de workflow

definePageMeta({
  layout: 'dashboard'
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
import ConfirmDialog from '@/components/calendar/dialogs/ConfirmDialog.vue'

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
    toast.error('Corrige los errores antes de guardar')
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
    toast.success('Workflow guardado correctamente')
    // Recargar para obtener la nueva versión
    await fetchWorkflow()
  } catch (error: any) {
    toast.error(error.statusMessage || 'Error al guardar workflow')
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



// Volver al listado
const goBack = () => {
  router.push('/admin/workflows')
}

// Resetear cambios
const showResetDialog = ref(false)
const resetChanges = () => {
  showResetDialog.value = true
}
const confirmReset = () => {
  jsonContent.value = originalJson.value
  showResetDialog.value = false
  toast.success('Cambios descartados')
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
      <ResizablePanel :default-size="25" :min-size="20" :max-size="35">
        <WorkflowElementsPanel @insert="insertSnippet" />
      </ResizablePanel>

      <ResizableHandle with-handle />

      <!-- Panel derecho: Editor con pestañas -->
      <ResizablePanel :default-size="75">
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
            <TabsTrigger value="problems" class="flex items-center gap-1">
              <Icon name="lucide:alert-circle" class="w-4 h-4" />
              Problemas
              <Badge
                v-if="validationResult.errors.length > 0"
                :variant="validationResult.errors.some(e => e.severity === 'error') ? 'destructive' : 'secondary'"
                class="ml-1 text-[10px] h-5"
              >
                {{ validationResult.errors.length }}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" class="flex-1 mt-0 flex flex-col min-h-0">
            <WorkflowJsonEditor
              v-model="jsonContent"
              height="auto"
              @validation="handleValidation"
            />
          </TabsContent>

          <TabsContent value="preview" class="flex-1 mt-0 overflow-hidden">
            <WorkflowPreview :workflow="validationResult.data" />
          </TabsContent>

          <TabsContent value="problems" class="flex-1 mt-0 overflow-hidden">
            <div class="h-full overflow-auto p-4">
              <div v-if="validationResult.errors.length === 0" class="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Icon name="lucide:check-circle" class="w-16 h-16 mb-4 text-green-500" />
                <p class="text-lg font-medium">No hay problemas</p>
                <p class="text-sm">El workflow es válido</p>
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="(error, idx) in validationResult.errors"
                  :key="idx"
                  class="p-3 rounded-lg border"
                  :class="error.severity === 'error' ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'"
                >
                  <div class="flex items-start gap-3">
                    <Icon
                      :name="error.severity === 'error' ? 'lucide:x-circle' : 'lucide:alert-triangle'"
                      class="w-5 h-5 flex-shrink-0 mt-0.5"
                      :class="error.severity === 'error' ? 'text-red-500' : 'text-yellow-500'"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <Badge
                          :variant="error.severity === 'error' ? 'destructive' : 'secondary'"
                          class="text-[10px]"
                        >
                          {{ error.severity === 'error' ? 'ERROR' : 'ADVERTENCIA' }}
                        </Badge>
                        <code v-if="error.path" class="text-xs bg-muted px-2 py-0.5 rounded">
                          {{ error.path }}
                        </code>
                      </div>
                      <p class="text-sm mt-2 font-medium">{{ error.message }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ResizablePanel>
    </ResizablePanelGroup>

    <!-- Diálogo de confirmación para descartar cambios -->
    <ConfirmDialog
      v-model:open="showResetDialog"
      title="Descartar cambios"
      icon="lucide:rotate-ccw"
      icon-class="text-destructive"
      confirm-text="Descartar"
      confirm-variant="destructive"
      @confirm="confirmReset"
    >
      <template #description>
        ¿Estás seguro de que deseas descartar todos los cambios no guardados?
        <br><br>
        Esta acción no se puede deshacer.
      </template>
    </ConfirmDialog>
  </div>
</template>

<style scoped>
:deep(.tabs-content) {
  height: 100%;
}
</style>
