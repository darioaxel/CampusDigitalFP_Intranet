<!-- components/schedule/MySchedule.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Clock, MapPin, CalendarDays, Plus, MoreHorizontal,
  AlertCircle, RefreshCw
} from 'lucide-vue-next'

interface ScheduleBlock {
  id: string
  dayOfWeek: 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO'
  startTime: string
  endTime: string
  subject?: string
  room?: string
  isBreak: boolean
}

interface Schedule {
  id: string
  name: string
  type: 'NORMAL' | 'EXAMENES' | 'EXTRAORDINARIO' | 'GUARDIA' | 'REFUERZO'
  isActive: boolean
  color?: string
  description?: string
  validFrom?: string
  validUntil?: string
  blocks: ScheduleBlock[]
}

const props = defineProps<{
  schedules: Schedule[]
  loading?: boolean
}>()

const emit = defineEmits<{
  refresh: []
}>()

const activeScheduleId = ref<string | null>(null)
const isCreatingBlock = ref(false)

// Inicializar primer tab activo cuando carguen datos
watch(() => props.schedules, (newSchedules) => {
  if (newSchedules?.length && !activeScheduleId.value) {
    activeScheduleId.value = newSchedules[0].id
  }
}, { immediate: true })

const activeSchedule = computed(() => 
  props.schedules.find(s => s.id === activeScheduleId.value)
)

const daysOfWeek = [
  { key: 'LUNES', label: 'Lunes', short: 'Lun' },
  { key: 'MARTES', label: 'Martes', short: 'Mar' },
  { key: 'MIERCOLES', label: 'Miércoles', short: 'Mié' },
  { key: 'JUEVES', label: 'Jueves', short: 'Jue' },
  { key: 'VIERNES', label: 'Viernes', short: 'Vie' },
  { key: 'SABADO', label: 'Sábado', short: 'Sáb' },
  { key: 'DOMINGO', label: 'Domingo', short: 'Dom' }
] as const

const hours = Array.from({ length: 14 }, (_, i) => i + 8) // 08:00 - 21:00

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const getBlockStyle = (block: ScheduleBlock) => {
  const start = timeToMinutes(block.startTime)
  const end = timeToMinutes(block.endTime)
  const duration = end - start
  const topOffset = start - timeToMinutes('08:00')
  
  return {
    top: `${(topOffset / 60) * 4}rem`,
    height: `${(duration / 60) * 4}rem`,
    backgroundColor: activeSchedule.value?.color ? `${activeSchedule.value.color}15` : undefined,
    borderColor: activeSchedule.value?.color ? `${activeSchedule.value.color}40` : undefined
  }
}

const getTypeBadge = (type: Schedule['type']) => {
  const styles = {
    NORMAL: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    EXAMENES: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    EXTRAORDINARIO: 'bg-red-50 text-red-700 ring-red-600/20',
    GUARDIA: 'bg-purple-50 text-purple-700 ring-purple-600/20',
    REFUERZO: 'bg-green-50 text-green-700 ring-green-600/20'
  }
  const labels = {
    NORMAL: 'Normal',
    EXAMENES: 'Exámenes',
    EXTRAORDINARIO: 'Extraordinario',
    GUARDIA: 'Guardia',
    REFUERZO: 'Refuerzo'
  }
  return { style: styles[type], label: labels[type] }
}

const blocksByDay = computed(() => {
  if (!activeSchedule.value) return {}
  const map: Record<string, ScheduleBlock[]> = {}
  daysOfWeek.forEach(day => {
    map[day.key] = activeSchedule.value!.blocks
      .filter(b => b.dayOfWeek === day.key)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  })
  return map
})
</script>

<template>
  <div class="space-y-6">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <RefreshCw class="h-8 w-8 animate-spin text-slate-400" />
    </div>

    <!-- Empty state -->
    <div 
      v-else-if="!schedules.length" 
      class="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm"
    >
      <div class="rounded-full bg-slate-50 p-4 mb-4">
        <CalendarDays class="h-8 w-8 text-slate-400" />
      </div>
      <h3 class="text-lg font-semibold text-slate-900">No tienes horarios asignados</h3>
      <p class="text-sm text-slate-500 mt-1 max-w-sm">
        Contacta con administración si crees que deberías tener horarios configurados.
      </p>
    </div>

    <template v-else>
      <!-- Tabs de horarios -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="border-b border-slate-200 bg-slate-50/50 px-4 overflow-x-auto">
          <div class="flex gap-2 py-3 min-w-max">
            <button
              v-for="schedule in schedules"
              :key="schedule.id"
              @click="activeScheduleId = schedule.id"
              :class="[
                'group inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                activeScheduleId === schedule.id
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
              ]"
            >
              <span 
                class="h-2.5 w-2.5 rounded-full"
                :style="{ backgroundColor: schedule.color || '#3b82f6' }"
              />
              <span>{{ schedule.name }}</span>
              <span 
                :class="[
                  'ml-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1',
                  getTypeBadge(schedule.type).style
                ]"
              >
                {{ getTypeBadge(schedule.type).label }}
              </span>
              <span 
                v-if="!schedule.isActive"
                class="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
              >
                Inactivo
              </span>
            </button>
          </div>
        </div>

        <!-- Contenido del horario activo -->
        <div v-if="activeSchedule" class="p-6">
          <!-- Header del horario -->
          <div class="flex items-start justify-between mb-6">
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-xl font-semibold text-slate-900">
                  {{ activeSchedule.name }}
                </h2>
                <span 
                  v-if="activeSchedule.validFrom && activeSchedule.validUntil"
                  class="text-sm text-slate-500"
                >
                  Vigente del {{ new Date(activeSchedule.validFrom).toLocaleDateString() }} 
                  al {{ new Date(activeSchedule.validUntil).toLocaleDateString() }}
                </span>
              </div>
              <p v-if="activeSchedule.description" class="mt-1 text-sm text-slate-600">
                {{ activeSchedule.description }}
              </p>
            </div>
            <button 
              class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <MoreHorizontal class="h-4 w-4" />
              Opciones
            </button>
          </div>

          <!-- Grid Semanal Desktop -->
          <div class="hidden lg:block overflow-hidden rounded-lg border border-slate-200">
            <div class="grid grid-cols-8 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-700">
              <div class="p-3 text-center border-r border-slate-200 bg-slate-100">Hora</div>
              <div 
                v-for="day in daysOfWeek" 
                :key="day.key"
                class="p-3 text-center border-r border-slate-200 last:border-r-0"
              >
                {{ day.label }}
              </div>
            </div>
            
            <div class="relative grid grid-cols-8 bg-white">
              <!-- Columna horas -->
              <div class="border-r border-slate-200 bg-slate-50/50">
                <div 
                  v-for="hour in hours" 
                  :key="hour"
                  class="h-16 border-b border-slate-100 flex items-center justify-center text-xs font-medium text-slate-500"
                >
                  {{ String(hour).padStart(2, '0') }}:00
                </div>
              </div>

              <!-- Días -->
              <div 
                v-for="day in daysOfWeek" 
                :key="day.key"
                class="relative border-r border-slate-200 last:border-r-0"
              >
                <!-- Líneas hora -->
                <div 
                  v-for="hour in hours" 
                  :key="hour"
                  class="h-16 border-b border-slate-50"
                />
                
                <!-- Bloques -->
                <div
                  v-for="block in blocksByDay[day.key]"
                  :key="block.id"
                  :style="getBlockStyle(block)"
                  class="absolute inset-x-1 rounded-md border p-2 text-xs transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer overflow-hidden group"
                  :class="[
                    block.isBreak 
                      ? 'bg-slate-100 border-slate-200 text-slate-500 italic' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  ]"
                >
                  <div class="font-semibold text-slate-900 truncate flex items-center gap-1">
                    <Clock v-if="!block.isBreak" class="h-3 w-3 text-slate-400" />
                    {{ block.subject || (block.isBreak ? 'Descanso' : 'Bloque') }}
                  </div>
                  <div v-if="block.room && !block.isBreak" class="flex items-center gap-1 mt-1 text-slate-500 truncate">
                    <MapPin class="h-3 w-3 shrink-0" />
                    <span>{{ block.room }}</span>
                  </div>
                  <div class="mt-1 font-mono text-[10px] text-slate-400">
                    {{ block.startTime }} - {{ block.endTime }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Vista Lista Mobile/Tablet -->
          <div class="lg:hidden space-y-4 mt-6">
            <div 
              v-for="day in daysOfWeek.filter(d => blocksByDay[d.key]?.length)" 
              :key="day.key"
              class="rounded-lg border border-slate-200 bg-white overflow-hidden"
            >
              <div class="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h3 class="font-semibold text-slate-900">{{ day.label }}</h3>
              </div>
              <div class="divide-y divide-slate-100">
                <div 
                  v-for="block in blocksByDay[day.key]"
                  :key="block.id"
                  class="flex items-start gap-4 p-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div class="flex flex-col items-center min-w-[4rem] py-1">
                    <span class="text-sm font-semibold text-slate-900">{{ block.startTime }}</span>
                    <div class="h-4 w-px bg-slate-300 my-1"></div>
                    <span class="text-sm text-slate-500">{{ block.endTime }}</span>
                  </div>
                  
                  <div class="flex-1 min-w-0">
                    <div 
                      class="font-medium text-slate-900"
                      :class="{ 'text-slate-500 italic': block.isBreak }"
                    >
                      {{ block.subject || 'Sin título' }}
                    </div>
                    <div v-if="block.room" class="flex items-center gap-1 mt-1 text-sm text-slate-500">
                      <MapPin class="h-3.5 w-3.5" />
                      {{ block.room }}
                    </div>
                  </div>

                  <div 
                    v-if="!block.isBreak"
                    class="h-2 w-2 rounded-full shrink-0 mt-2"
                    :style="{ backgroundColor: activeSchedule.color || '#3b82f6' }"
                  />
                </div>
              </div>
            </div>
            
            <div 
              v-if="!daysOfWeek.some(d => blocksByDay[d.key]?.length)"
              class="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200"
            >
              <AlertCircle class="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p class="text-sm">No hay bloques configurados para este horario</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Leyenda -->
      <div class="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <span class="font-medium">Leyenda:</span>
        <div class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-full bg-blue-500"></span>
          <span>Clase</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-full bg-slate-300"></span>
          <span>Descanso</span>
        </div>
        <div class="ml-auto text-slate-400">
          Última actualización: {{ new Date().toLocaleDateString() }}
        </div>
      </div>
    </template>
  </div>
</template>