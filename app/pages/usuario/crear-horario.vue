<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

const { user } = await useUserSession()
const router = useRouter()

// Permisos
const canCreateForOthers = computed(() => 
  ['ADMIN', 'ROOT'].includes(user.value?.role || '')
)
const canCreateTemplates = computed(() => 
  ['ADMIN', 'ROOT'].includes(user.value?.role || '')
)

// Datos formulario
const form = reactive({
  name: '',
  type: 'NORMAL',
  color: '#3b82f6',
  isTemplate: false,
  targetUserId: user.value?.id || '',
  validFrom: '',
  validUntil: '',
  blocks: [] as any[]
})

// Estados
const users = ref<any[]>([])
const submitting = ref(false)
const requestValidation = ref(false)
const validationNotes = ref('')

// Cargar usuarios si es admin/root
onMounted(async () => {
  if (canCreateForOthers.value) {
    const { data } = await useFetch('/api/users/list-basic')
    if (data.value) {
      users.value = data.value
    }
  }
})

// Tipos de horario
const scheduleTypes = [
  { value: 'NORMAL', label: 'Horario Normal' },
  { value: 'EXAMENES', label: 'Exámenes' },
  { value: 'EXTRAORDINARIO', label: 'Extraordinario' },
  { value: 'GUARDIA', label: 'Guardia' },
  { value: 'REFUERZO', label: 'Refuerzo' }
]

// Colores predefinidos
const presetColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
]

// Agregar bloque
const addBlock = () => {
  form.blocks.push({
    dayOfWeek: 'LUNES',
    startTime: '08:00',
    endTime: '09:00',
    subject: '',
    room: '',
    isBreak: false
  })
}

// Eliminar bloque
const removeBlock = (index: number) => {
  form.blocks.splice(index, 1)
}

// Ordenar bloques por día y hora
const sortBlocks = () => {
  const dayOrder = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
  form.blocks.sort((a, b) => {
    const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek)
    if (dayDiff !== 0) return dayDiff
    return a.startTime.localeCompare(b.startTime)
  })
}

// Enviar formulario
const onSubmit = async () => {
  if (!form.name) {
    toast.error('El nombre es obligatorio')
    return
  }
  if (form.blocks.length === 0) {
    toast.error('Debes agregar al menos un bloque')
    return
  }

  submitting.value = true
  try {
    // 1. Crear horario
    const payload = {
      ...form,
      userId: canCreateForOthers.value ? form.targetUserId : user.value?.id
    }

    const { data: newSchedule, error } = await useFetch('/api/schedules', {
      method: 'POST',
      body: payload
    })

    if (error.value) throw error.value

    // 2. Si se solicita validación, enviar solicitud
    if (requestValidation.value && !form.isTemplate && newSchedule.value?.scheduleId) {
      const { error: valError } = await useFetch(`/api/schedules/${newSchedule.value.scheduleId}/request-validation`, {
        method: 'POST',
        body: { notes: validationNotes.value }
      })
      
      if (valError.value) {
        toast.warning('Horario creado pero error al enviar validación')
      } else {
        toast.success('Horario creado y enviado para validación')
      }
    } else {
      toast.success(form.isTemplate ? 'Template creado' : 'Horario creado')
    }

    router.push('/usuario/horarios')
  } catch (err: any) {
    toast.error(err.message || 'Error al crear el horario')
  } finally {
    submitting.value = false
  }
}

// Cancelar
const onCancel = () => {
  router.push('/usuario/horarios')
}
</script>

<template>
  <div class="min-h-screen bg-background p-4">
    <div class="mx-auto max-w-5xl">
      <!-- Cabecera -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold tracking-tight text-foreground">
            {{ form.isTemplate ? 'Crear Template de Horario' : 'Crear Horario' }}
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            {{ canCreateForOthers 
              ? 'Crea un horario para ti o para otro usuario' 
              : 'Crea tu propio horario semanal' 
            }}
          </p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" @click="onCancel">
            Cancelar
          </Button>
          <Button @click="onSubmit" :disabled="submitting">
            <Icon v-if="submitting" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
            <Icon v-else name="lucide:save" class="mr-2 h-4 w-4" />
            Guardar
          </Button>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Columna izquierda: Configuración -->
        <div class="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle class="text-sm font-medium">Configuración</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <!-- Nombre -->
              <div class="space-y-2">
                <Label>Nombre del horario</Label>
                <Input 
                  v-model="form.name" 
                  placeholder="Ej: Horario Mañana DAM"
                />
              </div>

              <!-- Tipo -->
              <div class="space-y-2">
                <Label>Tipo</Label>
                <Select v-model="form.type">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      v-for="type in scheduleTypes" 
                      :key="type.value" 
                      :value="type.value"
                    >
                      {{ type.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- Color -->
              <div class="space-y-2">
                <Label>Color identificativo</Label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="color in presetColors"
                    :key="color"
                    type="button"
                    :class="[
                      'h-6 w-6 rounded-full border-2 transition-all',
                      form.color === color ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                    ]"
                    :style="{ backgroundColor: color }"
                    @click="form.color = color"
                  />
                  <input 
                    v-model="form.color"
                    type="color" 
                    class="h-6 w-6 rounded-full border-0 p-0"
                  />
                </div>
              </div>

              <!-- Es Template (solo Admin/Root) -->
              <div v-if="canCreateTemplates" class="flex items-center justify-between rounded-lg border border-border p-3">
                <div class="space-y-0.5">
                  <Label class="text-sm">Es Template</Label>
                  <p class="text-xs text-muted-foreground">Disponible para reutilizar</p>
                </div>
                <Switch v-model="form.isTemplate" />
              </div>

              <!-- Seleccionar Usuario (solo Admin/Root) -->
              <div v-if="canCreateForOthers && !form.isTemplate" class="space-y-2">
                <Label>Usuario asignado</Label>
                <Select v-model="form.targetUserId">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem :value="user?.id">
                      {{ user?.firstName }} {{ user?.lastName }} (Yo)
                    </SelectItem>
                    <Separator class="my-2" />
                    <SelectItem 
                      v-for="u in users" 
                      :key="u.id" 
                      :value="u.id"
                    >
                      {{ u.firstName }} {{ u.lastName }} • {{ u.email }}
                      <Badge variant="secondary" class="ml-2 text-[10px]">{{ u.role }}</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- Vigencia opcional -->
              <div class="space-y-2">
                <Label>Vigencia (opcional)</Label>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <Input 
                      v-model="form.validFrom" 
                      type="date"
                      placeholder="Desde"
                    />
                  </div>
                  <div>
                    <Input 
                      v-model="form.validUntil" 
                      type="date"
                      placeholder="Hasta"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Solicitar validación (solo para usuarios normales, no templates) -->
          <Card v-if="!form.isTemplate && !canCreateForOthers">
            <CardHeader>
              <CardTitle class="text-sm font-medium">Validación</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <Label class="text-sm">Enviar a validación</Label>
                  <p class="text-xs text-muted-foreground">
                    La administración revisará y aprobará tu horario
                  </p>
                </div>
                <Switch v-model="requestValidation" />
              </div>
              
              <div v-if="requestValidation" class="space-y-2">
                <Label class="text-xs">Notas para el revisor (opcional)</Label>
                <Textarea 
                  v-model="validationNotes" 
                  placeholder="Añade comentarios sobre este horario..."
                  class="min-h-[80px] text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <!-- Resumen -->
          <Card>
            <CardHeader>
              <CardTitle class="text-sm font-medium">Resumen</CardTitle>
            </CardHeader>
            <CardContent class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Bloques:</span>
                <Badge variant="secondary">{{ form.blocks.length }}</Badge>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Usuario:</span>
                <span class="truncate max-w-[150px]">
                  {{ form.targetUserId === user?.id ? 'Yo' : users.find(u => u.id === form.targetUserId)?.firstName || 'Yo' }}
                </span>
              </div>
              <div v-if="form.isTemplate" class="flex justify-between">
                <span class="text-muted-foreground">Tipo:</span>
                <Badge>Template Global</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Columna derecha: Bloques -->
        <div class="lg:col-span-2">
          <Card class="h-full">
            <CardHeader class="flex flex-row items-center justify-between">
              <CardTitle class="text-sm font-medium">Bloques de tiempo</CardTitle>
              <Button type="button" variant="outline" size="sm" @click="addBlock">
                <Icon name="lucide:plus" class="mr-1 h-4 w-4" />
                Agregar bloque
              </Button>
            </CardHeader>
            <CardContent>
              <div v-if="form.blocks.length === 0" class="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Icon name="lucide:calendar-plus" class="h-12 w-12 mb-3 opacity-20" />
                <p class="text-sm">No hay bloques aún</p>
                <Button type="button" variant="ghost" size="sm" class="mt-2" @click="addBlock">
                  Agregar el primero
                </Button>
              </div>

              <div v-else class="space-y-3">
                <div 
                  v-for="(block, index) in form.blocks" 
                  :key="index"
                  :class="[
                    'flex items-start gap-2 rounded-lg border border-border p-3',
                    block.isBreak ? 'bg-muted/30' : 'bg-card'
                  ]"
                >
                  <!-- Día -->
                  <div class="w-28 shrink-0">
                    <Select v-model="block.dayOfWeek">
                      <SelectTrigger class="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LUNES">Lunes</SelectItem>
                        <SelectItem value="MARTES">Martes</SelectItem>
                        <SelectItem value="MIERCOLES">Miércoles</SelectItem>
                        <SelectItem value="JUEVES">Jueves</SelectItem>
                        <SelectItem value="VIERNES">Viernes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <!-- Horas -->
                  <div class="flex items-center gap-1 shrink-0">
                    <Input 
                      v-model="block.startTime" 
                      type="time"
                      class="h-8 w-24 text-xs"
                    />
                    <span class="text-muted-foreground">-</span>
                    <Input 
                      v-model="block.endTime" 
                      type="time"
                      class="h-8 w-24 text-xs"
                    />
                  </div>

                  <!-- Asignatura -->
                  <div class="min-w-0 flex-1">
                    <Input 
                      v-model="block.subject" 
                      placeholder="Asignatura o actividad"
                      class="h-8 text-xs"
                    />
                  </div>

                  <!-- Aula -->
                  <div class="w-24 shrink-0">
                    <Input 
                      v-model="block.room" 
                      placeholder="Aula"
                      class="h-8 text-xs"
                    />
                  </div>

                  <!-- Es recreo -->
                  <div class="flex items-center gap-2 px-2">
                    <Checkbox 
                      :id="`break-${index}`" 
                      v-model:checked="block.isBreak"
                    />
                    <Label :for="`break-${index}`" class="text-xs whitespace-nowrap cursor-pointer">
                      Recreo
                    </Label>
                  </div>

                  <!-- Eliminar -->
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm"
                    class="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    @click="removeBlock(index)"
                  >
                    <Icon name="lucide:trash-2" class="h-4 w-4" />
                  </Button>
                </div>

                <div class="flex justify-end pt-2">
                  <Button type="button" variant="ghost" size="sm" @click="sortBlocks">
                    <Icon name="lucide:arrow-up-down" class="mr-1 h-4 w-4" />
                    Ordenar por día y hora
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>