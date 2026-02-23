<script setup lang="ts">
import { ref, computed } from 'vue'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface ScheduleBlock {
  id: string
  dayOfWeek: string
  startTime: string
  endTime: string
  subject: string
  room: string
  isBreak: boolean
}

interface Schedule {
  id: string
  name: string
  type: string
  color: string
  isActive: boolean
  blocks: ScheduleBlock[]
}

const props = defineProps<{
  schedules: Schedule[]
  loading?: boolean
}>()

const selectedScheduleId = ref<string>(props.schedules[0]?.id || '')

const selectedSchedule = computed(() => 
  props.schedules.find(s => s.id === selectedScheduleId.value) || props.schedules[0]
)

const days = [
  { key: 'LUNES', label: 'Lun' },
  { key: 'MARTES', label: 'Mar' },
  { key: 'MIERCOLES', label: 'Mié' },
  { key: 'JUEVES', label: 'Jue' },
  { key: 'VIERNES', label: 'Vie' }
]

const hours = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
]

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'NORMAL': 'Normal',
    'EXAMENES': 'Exámenes',
    'EXTRAORDINARIO': 'Extraordinario',
    'GUARDIA': 'Guardia',
    'REFUERZO': 'Refuerzo'
  }
  return labels[type] || type
}

const getBlocksForCell = (day: string, hour: string) => {
  if (!selectedSchedule.value) return []
  return selectedSchedule.value.blocks.filter(block => {
    if (block.dayOfWeek !== day) return false
    const blockStart = parseInt(block.startTime.split(':')[0])
    const blockEnd = parseInt(block.endTime.split(':')[0])
    const cellHour = parseInt(hour.split(':')[0])
    return cellHour >= blockStart && cellHour < blockEnd
  })
}

const getBlockStyle = (block: ScheduleBlock, hour: string) => {
  const startHour = parseInt(block.startTime.split(':')[0])
  const endHour = parseInt(block.endTime.split(':')[0])
  const currentHour = parseInt(hour.split(':')[0])
  
  // Si es la primera hora del bloque, mostrar título
  const isStart = currentHour === startHour
  // Calcular altura relativa (cuántas horas dura)
  const duration = endHour - startHour
  
  return {
    isStart,
    duration
  }
}
</script>

<template>
  <div class="flex h-[calc(100vh-12rem)] flex-col gap-4">
    <!-- Tabs de selección -->
    <Tabs v-model="selectedScheduleId" class="w-full">
      <TabsList class="flex w-full flex-wrap gap-1 bg-muted/50 p-1 h-auto">
        <TabsTrigger 
          v-for="schedule in schedules" 
          :key="schedule.id"
          :value="schedule.id"
          class="flex items-center gap-2 px-3 py-1.5 text-xs data-[state=active]:bg-background"
        >
          <div 
            class="h-2 w-2 rounded-full shrink-0" 
            :style="{ backgroundColor: schedule.color || '#3b82f6' }"
          />
          <span class="truncate max-w-[120px]">{{ schedule.name }}</span>
          <Badge 
            v-if="schedule.isActive" 
            variant="secondary" 
            class="ml-1 text-[10px] px-1 py-0"
          >
            Activo
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent 
        v-for="schedule in schedules" 
        :key="schedule.id"
        :value="schedule.id"
        class="mt-0 h-full"
      >
        <!-- Header del horario seleccionado -->
        <div class="mb-2 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold">{{ schedule.name }}</h3>
            <Badge variant="outline" class="text-xs">
              {{ getTypeLabel(schedule.type) }}
            </Badge>
          </div>
          <span class="text-xs text-muted-foreground">
            {{ schedule.blocks.length }} bloques
          </span>
        </div>

        <!-- Grid del horario - Sin scroll, todo visible -->
        <div class="rounded-lg border border-border bg-card overflow-hidden flex-1">
          <div class="grid grid-cols-[3rem_1fr_1fr_1fr_1fr_1fr] h-full">
            <!-- Cabecera días -->
            <div class="bg-muted/30 border-b border-r border-border"></div>
            <div 
              v-for="day in days" 
              :key="day.key"
              class="bg-muted/30 border-b border-r border-border py-1 text-center"
            >
              <span class="text-xs font-medium text-muted-foreground">{{ day.label }}</span>
            </div>

            <!-- Filas de horas -->
            <template v-for="(hour, idx) in hours" :key="hour">
              <!-- Columna hora -->
              <div 
                :class="[
                  'border-r border-border flex items-start justify-end pr-1 pt-0.5',
                  idx !== hours.length - 1 ? 'border-b' : ''
                ]"
              >
                <span class="text-[10px] text-muted-foreground leading-none">{{ hour }}</span>
              </div>

              <!-- Celdas de días -->
              <div 
                v-for="day in days" 
                :key="`${hour}-${day.key}`"
                :class="[
                  'border-r border-border relative p-0.5',
                  idx !== hours.length - 1 ? 'border-b' : ''
                ]"
              >
                <div 
                  v-for="block in getBlocksForCell(day.key, hour)" 
                  :key="block.id"
                  :class="[
                    'rounded px-1 py-0.5 text-[10px] leading-tight h-full flex flex-col justify-center overflow-hidden',
                    block.isBreak 
                      ? 'bg-muted text-muted-foreground italic' 
                      : 'bg-primary/10 text-primary-foreground border border-primary/20'
                  ]"
                  :style="{ 
                    backgroundColor: block.isBreak ? undefined : (schedule.color || '#3b82f6') + '20',
                    borderColor: block.isBreak ? undefined : (schedule.color || '#3b82f6') + '40'
                  }"
                >
                  <template v-if="getBlockStyle(block, hour).isStart">
                    <span class="font-medium truncate">{{ block.subject }}</span>
                    <span v-if="block.room && block.room !== '-'" class="text-[9px] opacity-80 truncate">
                      {{ block.room }}
                    </span>
                  </template>
                </div>
              </div>
            </template>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>