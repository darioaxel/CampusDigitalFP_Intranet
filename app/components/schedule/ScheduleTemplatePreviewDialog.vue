<script setup lang="ts">
import type { ScheduleTemplate } from '~/composables/useScheduleAdmin'

interface Props {
  open: boolean
  template: ScheduleTemplate | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'edit': []
  'clone': []
}>()

const handleClose = () => {
  emit('update:open', false)
}

const handleEdit = () => {
  handleClose()
  emit('edit')
}

const handleClone = () => {
  emit('clone')
}

// Organizar bloques por día
const blocksByDay = computed(() => {
  if (!props.template?.blocks) return {}
  
  const days = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']
  const grouped: Record<string, any[]> = {}
  
  days.forEach(day => {
    const dayBlocks = props.template!.blocks
      .filter(b => b.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
    
    if (dayBlocks.length) {
      grouped[day] = dayBlocks
    }
  })
  
  return grouped
})

const daysList = computed(() => Object.keys(blocksByDay.value))

// Estadísticas
const stats = computed(() => {
  if (!props.template?.blocks) return { total: 0, breaks: 0, classes: 0, timeRange: '-' }
  
  const blocks = props.template.blocks
  const breaks = blocks.filter(b => b.isBreak).length
  const times = blocks.map(b => b.startTime).sort()
  const endTimes = blocks.map(b => b.endTime).sort()
  
  return {
    total: blocks.length,
    breaks,
    classes: blocks.length - breaks,
    timeRange: times.length ? `${times[0]} - ${endTimes[endTimes.length - 1]}` : '-'
  }
})

const scheduleTypes: Record<string, string> = {
  'NORMAL': 'Horario Normal',
  'EXAMENES': 'Exámenes',
  'EXTRAORDINARIO': 'Extraordinario',
  'GUARDIA': 'Guardia',
  'REFUERZO': 'Refuerzo'
}

const getTypeLabel = (type: string) => scheduleTypes[type] || type

const dayLabels: Record<string, string> = {
  'LUNES': 'Lunes',
  'MARTES': 'Martes',
  'MIERCOLES': 'Miércoles',
  'JUEVES': 'Jueves',
  'VIERNES': 'Viernes',
  'SABADO': 'Sábado',
  'DOMINGO': 'Domingo'
}

const getDayLabel = (day: string) => dayLabels[day] || day
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader class="shrink-0" v-if="template">
        <div class="flex items-center gap-3">
          <div 
            class="h-4 w-4 rounded-full" 
            :style="{ backgroundColor: template.color || '#3b82f6' }"
          />
          <DialogTitle>{{ template.name }}</DialogTitle>
        </div>
        <DialogDescription>
          {{ getTypeLabel(template.type) }} • 
          <Badge :variant="template.isActive ? 'default' : 'secondary'" class="text-xs">
            {{ template.isActive ? 'Activa' : 'Inactiva' }}
          </Badge>
        </DialogDescription>
      </DialogHeader>

      <div v-if="template" class="flex-1 overflow-y-auto space-y-6 py-4">
        <!-- Descripción -->
        <p v-if="template.description" class="text-sm text-muted-foreground">
          {{ template.description }}
        </p>

        <!-- Estadísticas -->
        <div class="grid grid-cols-4 gap-3">
          <div class="bg-muted rounded-lg p-3 text-center">
            <p class="text-2xl font-semibold">{{ stats.total }}</p>
            <p class="text-xs text-muted-foreground">Bloques</p>
          </div>
          <div class="bg-muted rounded-lg p-3 text-center">
            <p class="text-2xl font-semibold text-green-600">{{ stats.classes }}</p>
            <p class="text-xs text-muted-foreground">Clases</p>
          </div>
          <div class="bg-muted rounded-lg p-3 text-center">
            <p class="text-2xl font-semibold text-amber-600">{{ stats.breaks }}</p>
            <p class="text-xs text-muted-foreground">Recreos</p>
          </div>
          <div class="bg-muted rounded-lg p-3 text-center">
            <p class="text-lg font-semibold font-mono">{{ stats.timeRange }}</p>
            <p class="text-xs text-muted-foreground">Horario</p>
          </div>
        </div>

        <!-- Vista por días -->
        <div class="space-y-4">
          <h3 class="font-medium text-sm">Estructura del horario</h3>
          
          <div class="grid gap-4 md:grid-cols-2">
            <Card 
              v-for="day in daysList" 
              :key="day"
              class="overflow-hidden !p-0 !gap-0 !space-y-0"
            >
              <CardHeader class="py-3 px-3 bg-muted/50">
                <CardTitle class="text-sm font-medium">
                  {{ getDayLabel(day) }}
                </CardTitle>
              </CardHeader>
              <CardContent class="p-0">
                <div class="divide-y">
                  <div 
                    v-for="block in blocksByDay[day]" 
                    :key="block.id"
                    class="flex items-center justify-between p-3"
                    :class="block.isBreak ? 'bg-slate-50 dark:bg-slate-900/50' : ''"
                  >
                    <div class="flex items-center gap-3">
                      <div 
                        class="w-1 h-8 rounded-full"
                        :class="block.isBreak ? 'bg-slate-300' : 'bg-primary'"
                      />
                      <div>
                        <p class="text-sm font-medium font-mono">
                          {{ block.startTime }} - {{ block.endTime }}
                        </p>
                        <p v-if="block.isBreak" class="text-xs text-muted-foreground">
                          Recreo
                        </p>
                      </div>
                    </div>
                    <Badge v-if="block.isBreak" variant="secondary" class="text-xs">
                      Pausa
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Vista tipo calendario/grid -->
        <div class="space-y-3">
          <h3 class="font-medium text-sm">Vista semanal</h3>
          <div class="border rounded-lg overflow-hidden">
            <div class="grid grid-cols-6 divide-x">
              <!-- Header -->
              <div class="bg-muted/50 p-2 text-center text-xs font-medium text-muted-foreground">
                Hora
              </div>
              <div 
                v-for="day in ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']" 
                :key="day"
                class="bg-muted/50 p-2 text-center text-xs font-medium text-muted-foreground"
              >
                {{ day }}
              </div>
            </div>
            
            <!-- Grid de horas -->
            <div 
              v-for="hour in 12" 
              :key="hour"
              class="grid grid-cols-6 divide-x divide-y border-t"
            >
              <div class="p-2 text-center text-xs text-muted-foreground bg-muted/20">
                {{ String(hour + 7).padStart(2, '0') }}:00
              </div>
              <div 
                v-for="day in ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']" 
                :key="day"
                class="p-1 min-h-[40px]"
              >
                <div 
                  v-for="block in template.blocks?.filter(b => 
                    b.dayOfWeek === day && 
                    parseInt(b.startTime.split(':')[0]) <= hour + 7 &&
                    parseInt(b.endTime.split(':')[0]) > hour + 7
                  )" 
                  :key="block.id"
                  class="text-[9px] px-1.5 py-0.5 rounded-sm truncate"
                  :class="block.isBreak 
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' 
                    : 'bg-primary/20 text-primary'"
                  :title="`${block.startTime}-${block.endTime}`"
                >
                  {{ block.isBreak ? 'R' : 'C' }}
                </div>
              </div>
            </div>
          </div>
          <div class="flex gap-4 text-xs text-muted-foreground">
            <div class="flex items-center gap-1">
              <div class="w-3 h-3 bg-primary/20 rounded-sm" />
              <span>Clase</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-sm" />
              <span>Recreo</span>
            </div>
          </div>
        </div>

        <!-- Info adicional -->
        <div class="bg-muted rounded-lg p-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Creado:</span>
            <span>{{ new Date(template.createdAt).toLocaleDateString('es-ES') }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Última modificación:</span>
            <span>{{ new Date(template.updatedAt).toLocaleDateString('es-ES') }}</span>
          </div>
          <div v-if="template.validFrom || template.validUntil" class="flex justify-between">
            <span class="text-muted-foreground">Vigencia:</span>
            <span>
              {{ template.validFrom ? new Date(template.validFrom).toLocaleDateString('es-ES') : 'Sin inicio' }}
              -
              {{ template.validUntil ? new Date(template.validUntil).toLocaleDateString('es-ES') : 'Sin fin' }}
            </span>
          </div>
        </div>
      </div>

      <DialogFooter class="shrink-0 border-t pt-4 gap-2">
        <Button variant="outline" @click="handleClose">
          Cerrar
        </Button>
        <Button variant="outline" @click="handleClone">
          <Icon name="lucide:copy" class="mr-2 h-4 w-4" />
          Clonar
        </Button>
        <Button @click="handleEdit">
          <Icon name="lucide:pencil" class="mr-2 h-4 w-4" />
          Editar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
