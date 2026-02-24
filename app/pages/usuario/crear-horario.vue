<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

const { user } = await useUserSession()
const router = useRouter()

// Estado del paso actual
const step = ref<'select-template' | 'fill-schedule'>('select-template')
const selectedTemplate = ref<any>(null)

// Templates disponibles
const { data: templatesResponse, pending: loadingTemplates } = await useFetch('/api/schedules/templates')
const templates = computed(() => templatesResponse.value?.data || [])

// Datos del horario
const form = reactive({
  name: '',
  type: 'NORMAL',
  color: '#3b82f6',
  blocks: [] as any[]
})

// Estados
const submitting = ref(false)
const requestValidation = ref(false)
const validationNotes = ref('')

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

// Seleccionar template
const selectTemplate = (template: any) => {
  selectedTemplate.value = template
  form.name = `${template.name} - ${user.value?.firstName || 'Mi horario'}`
  form.color = template.color || '#3b82f6'
  
  // Copiar bloques del template pero limpiando subject y room
  form.blocks = template.blocks.map((block: any) => ({
    dayOfWeek: block.dayOfWeek,
    startTime: block.startTime,
    endTime: block.endTime,
    subject: '', // El profesor debe rellenar
    room: '',
    isBreak: block.isBreak
  }))
  
  step.value = 'fill-schedule'
}

// Volver a selección de template
const goBackToTemplates = () => {
  step.value = 'select-template'
  selectedTemplate.value = null
  form.blocks = []
}

// Agregar bloque manual
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
  
  // Verificar que todos los bloques tengan subject (excepto recreos)
  const emptyBlocks = form.blocks.filter((b, i) => !b.isBreak && !b.subject.trim())
  if (emptyBlocks.length > 0) {
    toast.error(`Hay ${emptyBlocks.length} bloque(s) sin asignatura. Rellénalos o márcalos como recreo.`)
    return
  }

  submitting.value = true
  try {
    // 1. Crear horario
    const payload = {
      name: form.name,
      type: form.type,
      color: form.color,
      isTemplate: false,
      userId: user.value?.id,
      validFrom: undefined,
      validUntil: undefined,
      blocks: form.blocks.map(b => ({
        ...b,
        subject: b.subject || 'Sin asignatura'
      }))
    }

    console.log('Enviando payload:', payload)

    const { data: newSchedule, error } = await useFetch('/api/schedules', {
      method: 'POST',
      body: payload
    })

    if (error.value) {
      console.error('Error en respuesta:', error.value)
      throw error.value
    }

    // 2. Si se solicita validación, enviar solicitud
    if (requestValidation.value && newSchedule.value?.scheduleId) {
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
      toast.success('Horario creado correctamente')
    }

    router.push('/usuario/horarios')
  } catch (err: any) {
    console.error('Error completo:', err)
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
      <!-- PASO 1: Seleccionar Template -->
      <template v-if="step === 'select-template'">
        <!-- Cabecera -->
        <div class="mb-6">
          <h1 class="text-xl font-semibold tracking-tight text-foreground">
            Crear Horario
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            Selecciona una plantilla de horario como base
          </p>
        </div>

        <!-- Loading -->
        <div v-if="loadingTemplates" class="flex items-center justify-center py-12">
          <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>

        <!-- Grid de Templates -->
        <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card 
            v-for="template in templates" 
            :key="template.id"
            class="cursor-pointer hover:border-primary transition-colors"
            @click="selectTemplate(template)"
          >
            <CardHeader class="pb-3">
              <div class="flex items-center gap-2">
                <div 
                  class="h-3 w-3 rounded-full" 
                  :style="{ backgroundColor: template.color || '#3b82f6' }"
                />
                <CardTitle class="text-base">{{ template.name }}</CardTitle>
              </div>
              <CardDescription class="text-xs">
                Creado por: {{ template.user?.firstName }} {{ template.user?.lastName }}
              </CardDescription>
            </CardHeader>
            
            <CardContent class="pt-0">
              <div class="space-y-1 text-sm">
                <div class="flex items-center gap-2">
                  <Icon name="lucide:grid-3x3" class="h-4 w-4 text-muted-foreground" />
                  <span>{{ template.blocks?.length || 0 }} bloques predefinidos</span>
                </div>
                <p v-if="template.description" class="text-xs text-muted-foreground mt-2">
                  {{ template.description }}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Empty state -->
        <div v-if="!loadingTemplates && templates.length === 0" class="flex flex-col items-center justify-center py-12">
          <Icon name="lucide:layout-template" class="h-12 w-12 text-muted-foreground opacity-50" />
          <p class="mt-4 text-muted-foreground">No hay plantillas disponibles</p>
          <p class="text-xs text-muted-foreground mt-1">
            Contacta con el administrador para que cree plantillas de horario
          </p>
        </div>

        <!-- Botón cancelar -->
        <div class="mt-6">
          <Button variant="outline" @click="onCancel">
            Cancelar
          </Button>
        </div>
      </template>

      <!-- PASO 2: Rellenar Horario -->
      <template v-else>
        <!-- Cabecera -->
        <div class="mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" @click="goBackToTemplates" class="mb-2">
              <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
              Cambiar plantilla
            </Button>
            <h1 class="text-xl font-semibold tracking-tight text-foreground">
              Rellenar Horario
            </h1>
            <p class="text-sm text-muted-foreground mt-1">
              Basado en: {{ selectedTemplate?.name }}
            </p>
          </div>
          <div class="flex gap-2">
            <Button variant="outline" @click="onCancel">
              Cancelar
            </Button>
            <Button @click="onSubmit" :disabled="submitting">
              <Icon v-if="submitting" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
              <Icon v-else name="lucide:save" class="mr-2 h-4 w-4" />
              Guardar Horario
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
              </CardContent>
            </Card>

            <!-- Solicitar validación -->
            <Card>
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
                  <span class="text-muted-foreground">Por rellenar:</span>
                  <Badge 
                    :variant="form.blocks.filter(b => !b.isBreak && !b.subject).length > 0 ? 'destructive' : 'secondary'" 
                    class="text-xs"
                  >
                    {{ form.blocks.filter(b => !b.isBreak && !b.subject).length }}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- Columna derecha: Bloques -->
          <div class="lg:col-span-2">
            <Card class="h-full">
              <CardHeader class="flex flex-row items-center justify-between">
                <div>
                  <CardTitle class="text-sm font-medium">Bloques de tiempo</CardTitle>
                  <CardDescription>
                    Rellena cada bloque con la asignatura o actividad
                  </CardDescription>
                </div>
                <div class="flex gap-2">
                  <Button type="button" variant="outline" size="sm" @click="sortBlocks">
                    <Icon name="lucide:arrow-up-down" class="mr-1 h-4 w-4" />
                    Ordenar
                  </Button>
                  <Button type="button" variant="outline" size="sm" @click="addBlock">
                    <Icon name="lucide:plus" class="mr-1 h-4 w-4" />
                    Agregar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div v-if="form.blocks.length === 0" class="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Icon name="lucide:calendar-plus" class="h-12 w-12 mb-3 opacity-20" />
                  <p class="text-sm">No hay bloques en esta plantilla</p>
                </div>

                <div v-else class="space-y-3">
                  <div 
                    v-for="(block, index) in form.blocks" 
                    :key="index"
                    :class="[
                      'flex items-start gap-2 rounded-lg border border-border p-3',
                      block.isBreak ? 'bg-muted/30' : 'bg-card',
                      !block.isBreak && !block.subject ? 'border-destructive/50' : ''
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
                        :placeholder="block.isBreak ? 'Recreo' : 'Asignatura o actividad'"
                        :disabled="block.isBreak"
                        :class="[
                          'h-8 text-xs',
                          !block.isBreak && !block.subject ? 'border-destructive' : ''
                        ]"
                      />
                    </div>

                    <!-- Aula -->
                    <div class="w-20 shrink-0">
                      <Input 
                        v-model="block.room" 
                        placeholder="Aula"
                        :disabled="block.isBreak"
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
