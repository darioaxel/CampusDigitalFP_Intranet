<script setup lang="ts">
// app/pages/admin/workflows/index.vue
// Listado de workflows configurables - Grid 3 columnas

definePageMeta({
  layout: 'dashboard'
})

import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { toast } from 'vue-sonner'

// Tipos
interface Workflow {
  id: string
  code: string
  name: string
  description: string | null
  entityType: 'REQUEST' | 'TASK'
  version: number
  isActive: boolean
  states: any[]
  transitions: any[]
  _count: {
    requests: number
    tasks: number
  }
}

// Estado
const workflows = ref<Workflow[]>([])
const loading = ref(false)
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const workflowToDelete = ref<Workflow | null>(null)

// Formulario de creación
const newWorkflow = ref({
  code: '',
  name: '',
  description: '',
  entityType: 'REQUEST' as 'REQUEST' | 'TASK',
  initialStateCode: 'pending',
  initialStateName: 'Pendiente'
})

// Cargar workflows
const fetchWorkflows = async () => {
  loading.value = true
  try {
    const { data } = await $fetch('/api/admin/workflows')
    workflows.value = data || []
  } catch (error) {
    console.error('Error cargando workflows:', error)
  } finally {
    loading.value = false
  }
}

// Crear workflow
const createWorkflow = async () => {
  try {
    await $fetch('/api/admin/workflows', {
      method: 'POST',
      body: newWorkflow.value
    })
    showCreateDialog.value = false
    await fetchWorkflows()
    // Reset form
    newWorkflow.value = {
      code: '',
      name: '',
      description: '',
      entityType: 'REQUEST',
      initialStateCode: 'pending',
      initialStateName: 'Pendiente'
    }
    toast.success('Workflow creado correctamente')
  } catch (error: any) {
    toast.error(error.statusMessage || 'Error al crear workflow')
  }
}

// Confirmar eliminación
const confirmDelete = (workflow: Workflow) => {
  workflowToDelete.value = workflow
  showDeleteDialog.value = true
}

// Eliminar workflow
const deleteWorkflow = async () => {
  if (!workflowToDelete.value) return
  try {
    await $fetch(`/api/admin/workflows/${workflowToDelete.value.id}`, {
      method: 'DELETE'
    })
    showDeleteDialog.value = false
    workflowToDelete.value = null
    await fetchWorkflows()
    toast.success('Workflow eliminado correctamente')
  } catch (error: any) {
    toast.error(error.statusMessage || 'Error al eliminar workflow')
  }
}

// Toggle activo/inactivo
const toggleActive = async (workflow: Workflow) => {
  try {
    await $fetch(`/api/admin/workflows/${workflow.id}`, {
      method: 'PUT',
      body: { isActive: !workflow.isActive }
    })
    await fetchWorkflows()
    toast.success(workflow.isActive ? 'Workflow desactivado' : 'Workflow activado')
  } catch (error: any) {
    toast.error(error.statusMessage || 'Error al actualizar workflow')
  }
}

// Exportar a JSON (descargar archivo)
const exportWorkflow = async (workflow: Workflow) => {
  try {
    const response = await $fetch(`/api/admin/workflows/${workflow.id}/export`)
    const jsonStr = JSON.stringify(response.data, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workflow.code}_v${workflow.version}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Workflow exportado correctamente')
  } catch (error) {
    console.error('Error exportando:', error)
    toast.error('Error al exportar workflow')
  }
}

// Helpers
const getEntityTypeLabel = (type: string) => {
  return type === 'REQUEST' ? 'Solicitud' : 'Tarea'
}

const getEntityTypeBadgeColor = (type: string) => {
  return type === 'REQUEST' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
}

// Estadísticas computadas
const stats = computed(() => {
  const total = workflows.value.length
  const active = workflows.value.filter(w => w.isActive).length
  const inactive = total - active
  return { total, active, inactive }
})

// Cargar al montar
onMounted(fetchWorkflows)
</script>

<template>
  <div class="min-h-screen bg-background p-4 md:p-6">
    <div class="mx-auto max-w-7xl space-y-6">
      <!-- Header -->
      <LayoutPageHeader
        title="Workflows Configurables"
        description="Gestiona los flujos de trabajo para solicitudes y tareas"
      >
        <template #actions>
          <Button @click="showCreateDialog = true">
            <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
            Nuevo Workflow
          </Button>
        </template>
      </LayoutPageHeader>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader class="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle class="text-2xl">{{ stats.total }}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader class="pb-2">
            <CardDescription>Activos</CardDescription>
            <CardTitle class="text-2xl text-green-600">{{ stats.active }}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader class="pb-2">
            <CardDescription>Inactivos</CardDescription>
            <CardTitle class="text-2xl text-gray-500">{{ stats.inactive }}</CardTitle>
          </CardHeader>
        </Card>
        <Card class="border-dashed">
          <CardHeader class="pb-2">
            <CardDescription>Acciones</CardDescription>
            <div class="flex gap-2 mt-2">
              <Button variant="outline" size="sm" class="w-full" as-child>
                <NuxtLink to="/documentacion/workflows-y-procesos">
                  <Icon name="lucide:book-open" class="w-4 h-4 mr-1" />
                  Docs
                </NuxtLink>
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-muted-foreground" />
      </div>

      <!-- Empty state -->
      <div v-else-if="workflows.length === 0" class="text-center py-12 border rounded-lg">
        <Icon name="lucide:git-branch" class="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 class="text-lg font-medium">No hay workflows configurados</h3>
        <p class="text-muted-foreground mt-1">Crea tu primer workflow para empezar</p>
      </div>

      <!-- Grid de workflows - 3 columnas -->
      <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="workflow in workflows"
          :key="workflow.id"
          :class="{ 'opacity-60': !workflow.isActive }"
          class="flex flex-col"
        >
          <CardHeader class="pb-3">
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-3">
                <div class="p-2 bg-primary/10 rounded-lg">
                  <Icon name="lucide:git-branch" class="w-5 h-5 text-primary" />
                </div>
                <div class="min-w-0 flex-1">
                  <CardTitle class="text-base flex items-center gap-2 truncate">
                    {{ workflow.name }}
                  </CardTitle>
                  <div class="flex items-center gap-2 mt-1">
                    <Badge
                      :class="getEntityTypeBadgeColor(workflow.entityType)"
                      class="text-[10px]"
                    >
                      {{ getEntityTypeLabel(workflow.entityType) }}
                    </Badge>
                    <span class="text-xs text-muted-foreground">
                      v{{ workflow.version }}
                    </span>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <Icon name="lucide:more-vertical" class="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <NuxtLink :to="`/admin/workflows/${workflow.id}`">
                    <DropdownMenuItem>
                      <Icon name="lucide:edit" class="w-4 h-4 mr-2" />
                      Editar JSON
                    </DropdownMenuItem>
                  </NuxtLink>
                  <DropdownMenuItem @click="exportWorkflow(workflow)">
                    <Icon name="lucide:download" class="w-4 h-4 mr-2" />
                    Exportar JSON
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem @click="toggleActive(workflow)">
                    <Icon
                      :name="workflow.isActive ? 'lucide:pause' : 'lucide:play'"
                      class="w-4 h-4 mr-2"
                    />
                    {{ workflow.isActive ? 'Desactivar' : 'Activar' }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="text-destructive"
                    @click="confirmDelete(workflow)"
                  >
                    <Icon name="lucide:trash-2" class="w-4 h-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent class="pt-0 flex-1">
            <p class="text-xs text-muted-foreground mb-3 line-clamp-2">
              {{ workflow.description || 'Sin descripción' }}
            </p>
            
            <div class="flex items-center gap-3 text-xs text-muted-foreground">
              <div class="flex items-center gap-1">
                <Icon name="lucide:circle-dot" class="w-3.5 h-3.5" />
                <span>{{ workflow.states.length }} estados</span>
              </div>
              <div class="flex items-center gap-1">
                <Icon name="lucide:arrow-right" class="w-3.5 h-3.5" />
                <span>{{ workflow.transitions.length }} trans.</span>
              </div>
              <div class="flex items-center gap-1">
                <Icon name="lucide:file-text" class="w-3.5 h-3.5" />
                <span>{{ workflow._count.requests + workflow._count.tasks }}</span>
              </div>
            </div>
          </CardContent>

          <div class="px-6 pb-4">
            <Badge
              v-if="!workflow.isActive"
              variant="secondary"
              class="text-[10px]"
            >
              Inactivo
            </Badge>
            <code v-else class="text-[10px] bg-muted px-2 py-1 rounded">
              {{ workflow.code }}
            </code>
          </div>
        </Card>
      </div>
    </div>

    <!-- Dialog crear workflow -->
    <Dialog v-model:open="showCreateDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear nuevo workflow</DialogTitle>
          <DialogDescription>
            Define los datos básicos. Luego podrás editar el JSON completo.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="code">Código</Label>
            <Input
              id="code"
              v-model="newWorkflow.code"
              placeholder="ej: request_free_day"
            />
            <p class="text-xs text-muted-foreground">
              Solo minúsculas, números y guiones bajos
            </p>
          </div>

          <div class="space-y-2">
            <Label for="name">Nombre</Label>
            <Input
              id="name"
              v-model="newWorkflow.name"
              placeholder="ej: Día Libre Disposición"
            />
          </div>

          <div class="space-y-2">
            <Label for="description">Descripción</Label>
            <Input
              id="description"
              v-model="newWorkflow.description"
              placeholder="Descripción del workflow"
            />
          </div>

          <div class="space-y-2">
            <Label>Tipo de entidad</Label>
            <Select v-model="newWorkflow.entityType">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REQUEST">Solicitud</SelectItem>
                <SelectItem value="TASK">Tarea</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="initialStateCode">Código estado inicial</Label>
              <Input
                id="initialStateCode"
                v-model="newWorkflow.initialStateCode"
                placeholder="pending"
              />
            </div>
            <div class="space-y-2">
              <Label for="initialStateName">Nombre estado inicial</Label>
              <Input
                id="initialStateName"
                v-model="newWorkflow.initialStateName"
                placeholder="Pendiente"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showCreateDialog = false">
            Cancelar
          </Button>
          <Button @click="createWorkflow" :disabled="!newWorkflow.code || !newWorkflow.name">
            Crear y editar JSON
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Dialog eliminar -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar workflow?</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Si el workflow tiene entidades asociadas,
            podría causar problemas.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">
            Cancelar
          </Button>
          <Button variant="destructive" @click="deleteWorkflow">
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
