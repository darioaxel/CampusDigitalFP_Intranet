<!-- pages/admin/solicitudes/gestion.vue -->
<template>
  <div class="min-h-screen p-6">
    <!-- Header -->
    <div class="max-w-7xl mx-auto mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <GitBranch class="h-6 w-6" />
            Gestión de Workflows
          </h1>
          <p class="text-muted-foreground mt-1">
            Configura los flujos de trabajo para solicitudes y tareas
          </p>
        </div>
        <Button @click="showCreateModal = true">
          <Plus class="h-4 w-4 mr-2" />
          Nuevo Workflow
        </Button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="max-w-7xl mx-auto">
      <Alert variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {{ error.message || 'Error al cargar workflows' }}
        </AlertDescription>
      </Alert>
    </div>

    <!-- Workflows Grid -->
    <div v-else class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card v-for="workflow in workflows" :key="workflow.id" class="relative">
        <CardHeader>
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <CardTitle>{{ workflow.name }}</CardTitle>
                <Badge :variant="workflow.isActive ? 'default' : 'secondary'">
                  {{ workflow.isActive ? 'Activo' : 'Inactivo' }}
                </Badge>
              </div>
              <CardDescription class="mt-1">
                <code class="bg-muted px-1 py-0.5 rounded text-xs">{{ workflow.code }}</code>
                <span class="mx-2">•</span>
                <span class="capitalize">{{ workflow.entityType === 'REQUEST' ? 'Solicitud' : 'Tarea' }}</span>
                <span class="mx-2">•</span>
                <span class="text-xs">v{{ workflow.version }}</span>
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="sm">
                  <MoreVertical class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="editWorkflow(workflow)">
                  <Edit class="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem @click="toggleActive(workflow)">
                  <Power class="h-4 w-4 mr-2" />
                  {{ workflow.isActive ? 'Desactivar' : 'Activar' }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p v-if="workflow.description" class="text-sm text-muted-foreground mt-2">
            {{ workflow.description }}
          </p>
        </CardHeader>
        
        <CardContent>
          <!-- Estadísticas -->
          <div class="flex items-center gap-4 text-sm mb-4">
            <div class="flex items-center gap-1">
              <Circle class="h-3 w-3 text-blue-500" />
              <span>{{ workflow.states.length }} estados</span>
            </div>
            <div class="flex items-center gap-1">
              <ArrowRight class="h-3 w-3 text-green-500" />
              <span>{{ workflow.transitions.length }} transiciones</span>
            </div>
            <div class="flex items-center gap-1">
              <FileText class="h-3 w-3 text-amber-500" />
              <span>{{ workflow._count.requests + workflow._count.tasks }} instancias</span>
            </div>
          </div>

          <!-- Estados -->
          <div class="space-y-2">
            <h4 class="text-sm font-medium flex items-center gap-2">
              <ListOrdered class="h-4 w-4" />
              Estados
            </h4>
            <div class="flex flex-wrap gap-2">
              <Badge 
                v-for="state in workflow.states" 
                :key="state.id"
                :style="{ backgroundColor: getColorClass(state.color) }"
                class="text-white"
              >
                {{ state.name }}
                <span v-if="state.isInitial" class="ml-1 text-xs opacity-75">(inicio)</span>
                <span v-if="state.isFinal" class="ml-1 text-xs opacity-75">(fin)</span>
              </Badge>
            </div>
          </div>

          <!-- Acciones -->
          <div class="mt-4 pt-4 border-t flex gap-2">
            <Button variant="outline" size="sm" @click="manageStates(workflow)">
              <Circle class="h-4 w-4 mr-1" />
              Estados
            </Button>
            <Button variant="outline" size="sm" @click="manageTransitions(workflow)">
              <ArrowRight class="h-4 w-4 mr-1" />
              Transiciones
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Modal: Crear Workflow -->
    <Dialog :open="showCreateModal" @update:open="showCreateModal = false">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Workflow</DialogTitle>
          <DialogDescription>
            Define un nuevo flujo de trabajo para solicitudes o tareas.
          </DialogDescription>
        </DialogHeader>
        
        <form @submit.prevent="createWorkflow" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="entityType">Tipo de Entidad</Label>
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
            <div class="space-y-2">
              <Label for="code">Código</Label>
              <Input 
                id="code" 
                v-model="newWorkflow.code" 
                placeholder="ej: free_day_request"
                pattern="[a-z0-9_]+"
                title="Solo minúsculas, números y guiones bajos"
              />
            </div>
          </div>
          
          <div class="space-y-2">
            <Label for="name">Nombre</Label>
            <Input id="name" v-model="newWorkflow.name" placeholder="Nombre del workflow" />
          </div>
          
          <div class="space-y-2">
            <Label for="description">Descripción</Label>
            <Textarea id="description" v-model="newWorkflow.description" placeholder="Descripción opcional" />
          </div>
          
          <div class="border-t pt-4">
            <h4 class="text-sm font-medium mb-3">Estado Inicial</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="initialStateCode">Código</Label>
                <Input 
                  id="initialStateCode" 
                  v-model="newWorkflow.initialStateCode" 
                  placeholder="ej: pending"
                  pattern="[a-z0-9_]+"
                />
              </div>
              <div class="space-y-2">
                <Label for="initialStateName">Nombre</Label>
                <Input 
                  id="initialStateName" 
                  v-model="newWorkflow.initialStateName" 
                  placeholder="ej: Pendiente"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" @click="showCreateModal = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="creating">
              <Loader2 v-if="creating" class="h-4 w-4 mr-2 animate-spin" />
              Crear Workflow
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal: Gestionar Estados -->
    <Dialog :open="!!selectedWorkflowForStates" @update:open="selectedWorkflowForStates = null">
      <DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Estados</DialogTitle>
          <DialogDescription>
            {{ selectedWorkflowForStates?.name }}
          </DialogDescription>
        </DialogHeader>
        
        <div v-if="selectedWorkflowForStates" class="space-y-4">
          <!-- Lista de estados -->
          <div class="space-y-2">
            <div 
              v-for="state in selectedWorkflowForStates.states" 
              :key="state.id"
              class="flex items-center justify-between p-3 border rounded-lg"
            >
              <div class="flex items-center gap-3">
                <div 
                  class="w-4 h-4 rounded-full" 
                  :style="{ backgroundColor: getColorClass(state.color) }"
                />
                <div>
                  <span class="font-medium">{{ state.name }}</span>
                  <code class="text-xs text-muted-foreground ml-2">{{ state.code }}</code>
                  <div class="flex gap-1 mt-1">
                    <Badge v-if="state.isInitial" variant="outline" class="text-xs">Inicial</Badge>
                    <Badge v-if="state.isFinal" variant="outline" class="text-xs">Final</Badge>
                    <Badge v-if="state.isTerminal" variant="outline" class="text-xs">Terminal</Badge>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-xs text-muted-foreground mr-2">Orden: {{ state.order }}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  @click="deleteState(state)"
                  :disabled="state.isInitial && selectedWorkflowForStates.states.length === 1"
                >
                  <Trash2 class="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>

          <!-- Añadir nuevo estado -->
          <div class="border-t pt-4">
            <h4 class="text-sm font-medium mb-3">Añadir Nuevo Estado</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Código</Label>
                <Input v-model="newState.code" placeholder="ej: approved" pattern="[a-z0-9_]+" />
              </div>
              <div class="space-y-2">
                <Label>Nombre</Label>
                <Input v-model="newState.name" placeholder="ej: Aprobado" />
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4 mt-3">
              <div class="space-y-2">
                <Label>Color</Label>
                <Select v-model="newState.color">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gray">Gris</SelectItem>
                    <SelectItem value="blue">Azul</SelectItem>
                    <SelectItem value="green">Verde</SelectItem>
                    <SelectItem value="amber">Ámbar</SelectItem>
                    <SelectItem value="red">Rojo</SelectItem>
                    <SelectItem value="purple">Púrpura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="flex items-center gap-2 pt-6">
                <Checkbox v-model:checked="newState.isFinal" />
                <Label class="text-sm">Final</Label>
              </div>
              <div class="flex items-center gap-2 pt-6">
                <Checkbox v-model:checked="newState.isTerminal" />
                <Label class="text-sm">Terminal</Label>
              </div>
            </div>
            <Button class="mt-3" size="sm" @click="addState" :disabled="!newState.code || !newState.name">
              <Plus class="h-4 w-4 mr-1" />
              Añadir Estado
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button @click="selectedWorkflowForStates = null">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal: Gestionar Transiciones -->
    <Dialog :open="!!selectedWorkflowForTransitions" @update:open="selectedWorkflowForTransitions = null">
      <DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Transiciones</DialogTitle>
          <DialogDescription>
            {{ selectedWorkflowForTransitions?.name }}
          </DialogDescription>
        </DialogHeader>
        
        <div v-if="selectedWorkflowForTransitions" class="space-y-4">
          <!-- Lista de transiciones -->
          <div class="space-y-2">
            <div 
              v-for="transition in selectedWorkflowForTransitions.transitions" 
              :key="transition.id"
              class="flex items-center justify-between p-3 border rounded-lg"
            >
              <div class="flex items-center gap-2">
                <Badge :style="{ backgroundColor: getColorClass(transition.fromState.color) }" class="text-white">
                  {{ transition.fromState.name }}
                </Badge>
                <ArrowRight class="h-4 w-4 text-muted-foreground" />
                <Badge :style="{ backgroundColor: getColorClass(transition.toState.color) }" class="text-white">
                  {{ transition.toState.name }}
                </Badge>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex gap-1">
                  <Badge v-for="role in parseRoles(transition.allowedRoles)" :key="role" variant="outline" class="text-xs">
                    {{ role }}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" @click="deleteTransition(transition.id)">
                  <Trash2 class="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            <div v-if="selectedWorkflowForTransitions.transitions.length === 0" class="text-center py-4 text-muted-foreground">
              No hay transiciones definidas
            </div>
          </div>

          <!-- Añadir nueva transición -->
          <div class="border-t pt-4">
            <h4 class="text-sm font-medium mb-3">Añadir Nueva Transición</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Desde</Label>
                <Select v-model="newTransition.fromStateId">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      v-for="state in selectedWorkflowForTransitions.states" 
                      :key="state.id" 
                      :value="state.id"
                    >
                      {{ state.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-2">
                <Label>Hacia</Label>
                <Select v-model="newTransition.toStateId">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      v-for="state in selectedWorkflowForTransitions.states" 
                      :key="state.id" 
                      :value="state.id"
                    >
                      {{ state.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div class="mt-3 space-y-2">
              <Label>Roles permitidos</Label>
              <div class="flex flex-wrap gap-2">
                <label v-for="role in availableRoles" :key="role" class="flex items-center gap-1 text-sm">
                  <input 
                    type="checkbox" 
                    :value="role" 
                    v-model="newTransition.allowedRoles"
                    class="rounded border-gray-300"
                  />
                  {{ role }}
                </label>
              </div>
            </div>
            <div class="flex items-center gap-2 mt-3">
              <Checkbox v-model:checked="newTransition.requiresComment" />
              <Label class="text-sm">Requiere comentario</Label>
            </div>
            <Button 
              class="mt-3" 
              size="sm" 
              @click="addTransition"
              :disabled="!newTransition.fromStateId || !newTransition.toStateId || newTransition.allowedRoles.length === 0"
            >
              <Plus class="h-4 w-4 mr-1" />
              Añadir Transición
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button @click="selectedWorkflowForTransitions = null">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  GitBranch, Plus, Loader2, AlertCircle, MoreVertical, Edit, Power,
  Circle, ArrowRight, FileText, ListOrdered, Trash2
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
  roles: ['ADMIN', 'ROOT']
})

// Tipos
interface WorkflowState {
  id: string
  code: string
  name: string
  color: string
  order: number
  isInitial: boolean
  isFinal: boolean
  isTerminal: boolean
}

interface WorkflowTransition {
  id: string
  fromStateId: string
  toStateId: string
  fromState: WorkflowState
  toState: WorkflowState
  allowedRoles: string
  requiresComment: boolean
}

interface Workflow {
  id: string
  code: string
  name: string
  description: string | null
  entityType: 'REQUEST' | 'TASK'
  version: number
  isActive: boolean
  states: WorkflowState[]
  transitions: WorkflowTransition[]
  _count: {
    requests: number
    tasks: number
  }
}

// Datos
const { data, pending, error, refresh } = await useFetch('/api/admin/workflows', {
  key: 'admin-workflows',
  server: true
})

const workflows = computed(() => data.value?.data || [])

// Modales
const showCreateModal = ref(false)
const selectedWorkflowForStates = ref<Workflow | null>(null)
const selectedWorkflowForTransitions = ref<Workflow | null>(null)

// Formulario nuevo workflow
const newWorkflow = ref({
  entityType: 'REQUEST',
  code: '',
  name: '',
  description: '',
  initialStateCode: '',
  initialStateName: ''
})

// Formulario nuevo estado
const newState = ref({
  code: '',
  name: '',
  color: 'blue',
  isFinal: false,
  isTerminal: false
})

// Formulario nueva transición
const newTransition = ref({
  fromStateId: '',
  toStateId: '',
  allowedRoles: [] as string[],
  requiresComment: false
})

const availableRoles = ['USER', 'PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT']

const creating = ref(false)

// Helpers
const getColorClass = (color: string): string => {
  const colors: Record<string, string> = {
    gray: '#6b7280',
    blue: '#3b82f6',
    green: '#22c55e',
    amber: '#f59e0b',
    red: '#ef4444',
    purple: '#a855f7'
  }
  return colors[color] || colors.gray
}

const parseRoles = (rolesJson: string): string[] => {
  try {
    return JSON.parse(rolesJson)
  } catch {
    return []
  }
}

// Acciones
const createWorkflow = async () => {
  creating.value = true
  try {
    await $fetch('/api/admin/workflows', {
      method: 'POST',
      body: newWorkflow.value
    })
    showCreateModal.value = false
    refresh()
    // Reset form
    newWorkflow.value = {
      entityType: 'REQUEST',
      code: '',
      name: '',
      description: '',
      initialStateCode: '',
      initialStateName: ''
    }
  } catch (err: any) {
    alert(err.message || 'Error al crear workflow')
  } finally {
    creating.value = false
  }
}

const editWorkflow = (workflow: Workflow) => {
  // TODO: Implementar edición básica
}

const toggleActive = async (workflow: Workflow) => {
  try {
    await $fetch(`/api/admin/workflows/${workflow.id}`, {
      method: 'PUT',
      body: { isActive: !workflow.isActive }
    })
    refresh()
  } catch (err: any) {
    alert(err.message || 'Error al actualizar workflow')
  }
}

// Estados
const manageStates = (workflow: Workflow) => {
  selectedWorkflowForStates.value = workflow
  newState.value = { code: '', name: '', color: 'blue', isFinal: false, isTerminal: false }
}

const addState = async () => {
  if (!selectedWorkflowForStates.value) return
  try {
    await $fetch(`/api/admin/workflows/${selectedWorkflowForStates.value.id}/states`, {
      method: 'POST',
      body: newState.value
    })
    refresh()
    newState.value = { code: '', name: '', color: 'blue', isFinal: false, isTerminal: false }
    // Recargar el workflow seleccionado
    const updated = await $fetch(`/api/admin/workflows/${selectedWorkflowForStates.value.id}`)
    selectedWorkflowForStates.value = updated.data
  } catch (err: any) {
    alert(err.message || 'Error al crear estado')
  }
}

const deleteState = async (state: WorkflowState) => {
  if (!confirm(`¿Eliminar el estado "${state.name}"?`)) return
  if (!selectedWorkflowForStates.value) return
  try {
    await $fetch(`/api/admin/workflows/${selectedWorkflowForStates.value.id}/states/${state.id}`, {
      method: 'DELETE'
    })
    refresh()
    const updated = await $fetch(`/api/admin/workflows/${selectedWorkflowForStates.value.id}`)
    selectedWorkflowForStates.value = updated.data
  } catch (err: any) {
    alert(err.message || 'Error al eliminar estado')
  }
}

// Transiciones
const manageTransitions = (workflow: Workflow) => {
  selectedWorkflowForTransitions.value = workflow
  newTransition.value = { fromStateId: '', toStateId: '', allowedRoles: [], requiresComment: false }
}

const addTransition = async () => {
  if (!selectedWorkflowForTransitions.value) return
  try {
    await $fetch(`/api/admin/workflows/${selectedWorkflowForTransitions.value.id}/transitions`, {
      method: 'POST',
      body: newTransition.value
    })
    refresh()
    newTransition.value = { fromStateId: '', toStateId: '', allowedRoles: [], requiresComment: false }
    const updated = await $fetch(`/api/admin/workflows/${selectedWorkflowForTransitions.value.id}`)
    selectedWorkflowForTransitions.value = updated.data
  } catch (err: any) {
    alert(err.message || 'Error al crear transición')
  }
}

const deleteTransition = async (transitionId: string) => {
  if (!confirm('¿Eliminar esta transición?')) return
  if (!selectedWorkflowForTransitions.value) return
  try {
    await $fetch(`/api/admin/workflows/${selectedWorkflowForTransitions.value.id}/transitions/${transitionId}`, {
      method: 'DELETE'
    })
    refresh()
    const updated = await $fetch(`/api/admin/workflows/${selectedWorkflowForTransitions.value.id}`)
    selectedWorkflowForTransitions.value = updated.data
  } catch (err: any) {
    alert(err.message || 'Error al eliminar transición')
  }
}
</script>
