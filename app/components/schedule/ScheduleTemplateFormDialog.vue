<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { ScheduleFormData } from '~/composables/useScheduleAdmin'

interface Props {
  open: boolean
  title: string
  description: string
  form: ScheduleFormData
  isSubmitting: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:form': [value: ScheduleFormData]
  'submit': []
  'add-block': []
  'remove-block': [index: number]
  'sort-blocks': []
}>()

const scheduleTypes = [
  { value: 'NORMAL', label: 'Horario Normal' },
  { value: 'EXAMENES', label: 'Exámenes' },
  { value: 'EXTRAORDINARIO', label: 'Extraordinario' },
  { value: 'GUARDIA', label: 'Guardia' },
  { value: 'REFUERZO', label: 'Refuerzo' }
]

const presetColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1', '#14b8a6', '#a855f7'
]

const days = [
  { value: 'LUNES', label: 'Lunes' },
  { value: 'MARTES', label: 'Martes' },
  { value: 'MIERCOLES', label: 'Miércoles' },
  { value: 'JUEVES', label: 'Jueves' },
  { value: 'VIERNES', label: 'Viernes' },
  { value: 'SABADO', label: 'Sábado' },
  { value: 'DOMINGO', label: 'Domingo' }
]

// Local copy para editar
const localForm = computed({
  get: () => props.form,
  set: (value) => emit('update:form', value)
})

const handleClose = () => {
  emit('update:open', false)
}

const handleSubmit = () => {
  emit('submit')
}

const addBlock = () => {
  emit('add-block')
}

const removeBlock = (index: number) => {
  emit('remove-block', index)
}

const sortBlocks = () => {
  emit('sort-blocks')
}

// Validar tiempo
const validateTime = (time: string): boolean => {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/
  return regex.test(time)
}

// Copiar horario de bloque anterior
const copyFromPrevious = (index: number) => {
  if (index === 0) {
    toast.info('No hay bloque anterior')
    return
  }
  
  const prev = localForm.value.blocks[index - 1]
  localForm.value.blocks[index].dayOfWeek = prev.dayOfWeek
  localForm.value.blocks[index].startTime = prev.endTime
  
  // Calcular nueva hora de fin (misma duración que el anterior)
  const [startH, startM] = prev.startTime.split(':').map(Number)
  const [endH, endM] = prev.endTime.split(':').map(Number)
  const duration = (endH * 60 + endM) - (startH * 60 + startM)
  
  const newStartH = parseInt(prev.endTime.split(':')[0])
  const newStartM = parseInt(prev.endTime.split(':')[1])
  const newEndMinutes = newStartH * 60 + newStartM + duration
  const newEndH = Math.floor(newEndMinutes / 60)
  const newEndM = newEndMinutes % 60
  
  localForm.value.blocks[index].endTime = 
    `${String(newEndH).padStart(2, '0')}:${String(newEndM).padStart(2, '0')}`
}

// Generar bloques automáticamente
const generateBlocks = () => {
  const count = localForm.value.blocks.length
  if (count === 0) {
    toast.error('Agrega al menos un bloque primero')
    return
  }
  
  const lastBlock = localForm.value.blocks[count - 1]
  const daysList = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
  const currentDayIndex = daysList.indexOf(lastBlock.dayOfWeek)
  
  if (currentDayIndex < daysList.length - 1) {
    const nextDay = daysList[currentDayIndex + 1]
    const newBlock = {
      dayOfWeek: nextDay,
      startTime: lastBlock.startTime,
      endTime: lastBlock.endTime,
      subject: lastBlock.subject,
      room: lastBlock.room,
      isBreak: lastBlock.isBreak
    }
    localForm.value.blocks.push(newBlock)
    toast.success(`Bloque agregado para ${nextDay}`)
  } else {
    toast.info('Ya se han agregado todos los días de la semana')
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader class="shrink-0">
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
        <!-- Configuración básica -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="name">Nombre de la plantilla *</Label>
            <Input 
              id="name"
              v-model="localForm.name" 
              placeholder="Ej: Horario Mañanas DAM"
            />
          </div>

          <div class="space-y-2">
            <Label for="type">Tipo</Label>
            <Select v-model="localForm.type">
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
        </div>

        <!-- Color y estado -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>Color identificativo</Label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="color in presetColors"
                :key="color"
                type="button"
                :class="[
                  'h-6 w-6 rounded-full border-2 transition-all',
                  localForm.color === color ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                ]"
                :style="{ backgroundColor: color }"
                @click="localForm.color = color"
              />
              <input 
                v-model="localForm.color"
                type="color" 
                class="h-6 w-6 rounded-full border-0 p-0 cursor-pointer"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label class="flex items-center gap-2">
              <Switch v-model:checked="localForm.isActive" />
              <span>Plantilla activa</span>
            </Label>
            <p class="text-xs text-muted-foreground">
              Las plantillas inactivas no aparecen para los profesores
            </p>
          </div>
        </div>

        <!-- Descripción -->
        <div class="space-y-2">
          <Label for="description">Descripción (opcional)</Label>
          <Textarea 
            id="description"
            v-model="localForm.description" 
            placeholder="Describe el horario, curso al que aplica, etc."
            rows="2"
          />
        </div>

        <!-- Vigencia -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="validFrom">Vigente desde (opcional)</Label>
            <Input 
              id="validFrom"
              v-model="localForm.validFrom" 
              type="date"
            />
          </div>
          <div class="space-y-2">
            <Label for="validUntil">Vigente hasta (opcional)</Label>
            <Input 
              id="validUntil"
              v-model="localForm.validUntil" 
              type="date"
            />
          </div>
        </div>

        <!-- Bloques -->
        <div class="border rounded-lg p-4 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-medium">Franjas horarias</h3>
              <p class="text-xs text-muted-foreground">
                {{ localForm.blocks.length }} bloques definidos
              </p>
            </div>
            <div class="flex gap-2">
              <Button type="button" variant="outline" size="sm" @click="sortBlocks">
                <Icon name="lucide:arrow-up-down" class="mr-1 h-4 w-4" />
                Ordenar
              </Button>
              <Button type="button" variant="outline" size="sm" @click="generateBlocks">
                <Icon name="lucide:copy" class="mr-1 h-4 w-4" />
                Auto
              </Button>
              <Button type="button" size="sm" @click="addBlock">
                <Icon name="lucide:plus" class="mr-1 h-4 w-4" />
                Agregar
              </Button>
            </div>
          </div>

          <div v-if="localForm.blocks.length === 0" class="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <Icon name="lucide:calendar-plus" class="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p class="text-sm">No hay franjas horarias</p>
            <p class="text-xs mt-1">Agrega bloques de tiempo para cada día</p>
          </div>

          <div v-else class="space-y-2 max-h-64 overflow-y-auto">
            <div 
              v-for="(block, index) in localForm.blocks" 
              :key="index"
              class="flex items-center gap-2 p-2 rounded-lg border bg-card"
            >
              <span class="text-xs text-muted-foreground w-6">{{ index + 1 }}</span>
              
              <Select v-model="block.dayOfWeek">
                <SelectTrigger class="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem 
                    v-for="day in days" 
                    :key="day.value" 
                    :value="day.value"
                    class="text-xs"
                  >
                    {{ day.label }}
                  </SelectItem>
                </SelectContent>
              </Select>

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

              <div class="flex items-center gap-2 ml-auto">
                <Checkbox 
                  :id="`break-${index}`" 
                  v-model:checked="block.isBreak"
                />
                <Label :for="`break-${index}`" class="text-xs whitespace-nowrap cursor-pointer">
                  Recreo
                </Label>

                <Button 
                  v-if="index > 0"
                  type="button"
                  variant="ghost" 
                  size="icon"
                  class="h-7 w-7"
                  title="Copiar del anterior"
                  @click="copyFromPrevious(index)"
                >
                  <Icon name="lucide:copy" class="h-3 w-3" />
                </Button>

                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon"
                  class="h-7 w-7 text-destructive hover:text-destructive"
                  @click="removeBlock(index)"
                >
                  <Icon name="lucide:trash-2" class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <!-- Resumen de bloques -->
          <div v-if="localForm.blocks.length > 0" class="pt-2 border-t">
            <div class="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                <Icon name="lucide:calendar" class="inline h-3 w-3 mr-1" />
                {{ new Set(localForm.blocks.map(b => b.dayOfWeek)).size }} días
              </span>
              <span>
                <Icon name="lucide:clock" class="inline h-3 w-3 mr-1" />
                {{ localForm.blocks.filter(b => b.isBreak).length }} recreos
              </span>
              <span>
                <Icon name="lucide:book-open" class="inline h-3 w-3 mr-1" />
                {{ localForm.blocks.filter(b => !b.isBreak).length }} clases
              </span>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="shrink-0 border-t pt-4">
        <Button variant="outline" @click="handleClose" :disabled="isSubmitting">
          Cancelar
        </Button>
        <Button @click="handleSubmit" :disabled="isSubmitting">
          <Icon v-if="isSubmitting" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
          <Icon v-else name="lucide:save" class="mr-2 h-4 w-4" />
          Guardar Plantilla
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
