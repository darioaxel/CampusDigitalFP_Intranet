<script setup lang="ts">
import { 
  Loader2, 
  Users,
  Stethoscope,
  Umbrella,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-vue-next'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, startOfYear, endOfYear } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Absence } from '~/server/api/admin/ausencias/index.get'

// Page meta
definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
  roles: ['ADMIN', 'ROOT']
})

// Tipos
type AbsenceType = 'ALL' | 'SICK_LEAVE' | 'FREE_DAY'

// Estado
const currentDate = ref(new Date())
const loading = ref(false)
const absencesByDate = ref<Record<string, Absence[]>>({})
const filterType = ref<AbsenceType>('ALL')

// Computed
const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())
const monthName = computed(() => 
  format(currentDate.value, 'MMMM yyyy', { locale: es })
)

// Días del mes actual
const daysInMonth = computed(() => {
  const start = startOfMonth(currentDate.value)
  const end = endOfMonth(currentDate.value)
  return eachDayOfInterval({ start, end })
})

// Estadísticas del mes actual
const stats = computed(() => {
  const allAbsences = Object.values(absencesByDate.value).flat()
  const sickLeaves = allAbsences.filter(a => a.type === 'SICK_LEAVE')
  const freeDays = allAbsences.filter(a => a.type === 'FREE_DAY')
  
  return {
    total: allAbsences.length,
    sickLeaves: sickLeaves.length,
    freeDays: freeDays.length,
    uniqueUsers: new Set(allAbsences.map(a => a.userId)).size
  }
})

// Función para cargar ausencias
const loadAbsences = async () => {
  loading.value = true
  try {
    const start = startOfMonth(currentDate.value)
    const end = endOfMonth(currentDate.value)
    
    const response = await $fetch('/api/admin/ausencias', {
      params: {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd')
      }
    })
    
    absencesByDate.value = response.data?.absencesByDate || {}
  } catch (error: any) {
    console.error('Error cargando ausencias:', error)
  } finally {
    loading.value = false
  }
}

// Cargar al montar
await loadAbsences()

// Navegación
const prevMonth = () => {
  currentDate.value = subMonths(currentDate.value, 1)
  loadAbsences()
}

const nextMonth = () => {
  currentDate.value = addMonths(currentDate.value, 1)
  loadAbsences()
}

const goToCurrentMonth = () => {
  currentDate.value = new Date()
  loadAbsences()
}

// Helpers
const getAbsencesForDay = (date: Date): Absence[] => {
  const dateStr = format(date, 'yyyy-MM-dd')
  let absences = absencesByDate.value[dateStr] || []
  
  // Aplicar filtro
  if (filterType.value !== 'ALL') {
    absences = absences.filter(a => a.type === filterType.value)
  }
  
  return absences
}

const getAbsenceColor = (type: string): string => {
  return type === 'SICK_LEAVE' 
    ? 'bg-red-100 text-red-700 border-red-200' 
    : 'bg-blue-100 text-blue-700 border-blue-200'
}

const getAbsenceIcon = (type: string) => {
  return type === 'SICK_LEAVE' ? Stethoscope : Umbrella
}

// Nombres de días de la semana (empezando en lunes)
const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// Calcular días vacíos al inicio (para alinear con lunes)
const emptyDaysAtStart = computed(() => {
  const firstDay = startOfMonth(currentDate.value)
  let dayOfWeek = firstDay.getDay() // 0 = domingo, 1 = lunes
  if (dayOfWeek === 0) dayOfWeek = 7
  return dayOfWeek - 1 // Días vacíos antes del primer día
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <Users class="h-6 w-6" />
          Calendario de Ausencias
        </h1>
        <p class="text-muted-foreground text-sm">
          Visualización de bajas y días de libre disposición
        </p>
      </div>
      
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="goToCurrentMonth">
          Hoy
        </Button>
        <div class="flex items-center gap-1 border rounded-lg p-1">
          <Button variant="ghost" size="icon" class="h-8 w-8" @click="prevMonth">
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <span class="text-sm font-medium min-w-[140px] text-center capitalize">
            {{ monthName }}
          </span>
          <Button variant="ghost" size="icon" class="h-8 w-8" @click="nextMonth">
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-4">
          <p class="text-2xl font-bold">{{ stats.total }}</p>
          <p class="text-xs text-muted-foreground">Total Ausencias</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <p class="text-2xl font-bold text-red-600">{{ stats.sickLeaves }}</p>
          <p class="text-xs text-muted-foreground flex items-center gap-1">
            <Stethoscope class="w-3 h-3" />
            Bajas
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <p class="text-2xl font-bold text-blue-600">{{ stats.freeDays }}</p>
          <p class="text-xs text-muted-foreground flex items-center gap-1">
            <Umbrella class="w-3 h-3" />
            Días Libres
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <p class="text-2xl font-bold">{{ stats.uniqueUsers }}</p>
          <p class="text-xs text-muted-foreground">Personas Afectadas</p>
        </CardContent>
      </Card>
    </div>

    <!-- Filtros -->
    <div class="flex items-center gap-2">
      <Filter class="w-4 h-4 text-muted-foreground" />
      <Select v-model="filterType">
        <SelectTrigger class="w-[200px]">
          <SelectValue placeholder="Filtrar por tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todas las ausencias</SelectItem>
          <SelectItem value="SICK_LEAVE">Solo bajas</SelectItem>
          <SelectItem value="FREE_DAY">Solo días libres</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Calendario -->
    <Card>
      <CardHeader>
        <CardTitle class="capitalize">{{ monthName }}</CardTitle>
        <CardDescription>
          Haz hover sobre un día para ver todas las ausencias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="flex justify-center py-12">
          <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        
        <div v-else>
          <!-- Cabecera días de la semana -->
          <div class="grid grid-cols-7 gap-1 mb-2">
            <div 
              v-for="day in weekDays" 
              :key="day"
              class="text-center font-medium text-muted-foreground text-sm py-2"
            >
              {{ day }}
            </div>
          </div>
          
          <!-- Grid de días -->
          <div class="grid grid-cols-7 gap-1">
            <!-- Días vacíos al inicio -->
            <div 
              v-for="n in emptyDaysAtStart" 
              :key="`empty-${n}`"
              class="h-24 md:h-32 bg-muted/30 rounded-lg"
            />
            
            <!-- Días del mes -->
            <TooltipProvider v-for="day in daysInMonth" :key="day.toISOString()">
              <Tooltip :delay-duration="200">
                <TooltipTrigger as-child>
                  <div
                    class="h-24 md:h-32 border rounded-lg p-1.5 md:p-2 transition-colors cursor-default"
                    :class="[
                      isWeekend(day) ? 'bg-muted/20' : 'bg-card hover:bg-muted/50',
                      format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'ring-2 ring-primary' : ''
                    ]"
                  >
                    <!-- Número del día -->
                    <div class="text-right">
                      <span 
                        class="text-sm font-medium"
                        :class="isWeekend(day) ? 'text-muted-foreground' : ''"
                      >
                        {{ format(day, 'd') }}
                      </span>
                    </div>
                    
                    <!-- Ausencias del día -->
                    <div class="mt-1 space-y-0.5 overflow-hidden">
                      <template v-for="(absence, index) in getAbsencesForDay(day).slice(0, 4)" :key="absence.id">
                        <div 
                          class="text-[10px] md:text-xs px-1.5 py-0.5 rounded truncate flex items-center gap-1"
                          :class="getAbsenceColor(absence.type)"
                        >
                          <component :is="getAbsenceIcon(absence.type)" class="w-3 h-3 flex-shrink-0" />
                          <span class="truncate">{{ absence.firstName }} {{ absence.lastName.charAt(0) }}.</span>
                        </div>
                      </template>
                      
                      <!-- Indicador de más ausencias -->
                      <div 
                        v-if="getAbsencesForDay(day).length > 4"
                        class="text-[10px] md:text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-center"
                      >
                        +{{ getAbsencesForDay(day).length - 4 }} más
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                
                <!-- Tooltip con todas las ausencias -->
                <TooltipContent 
                  v-if="getAbsencesForDay(day).length > 0"
                  side="top" 
                  :side-offset="5"
                  class="max-w-xs"
                >
                  <div class="space-y-2">
                    <p class="font-medium border-b pb-1">
                      {{ format(day, "EEEE d 'de' MMMM", { locale: es }) }}
                    </p>
                    <div class="space-y-1.5">
                      <div 
                        v-for="absence in getAbsencesForDay(day)" 
                        :key="absence.id"
                        class="flex items-center gap-2 text-xs"
                      >
                        <div 
                          class="w-2 h-2 rounded-full flex-shrink-0"
                          :class="absence.type === 'SICK_LEAVE' ? 'bg-red-400' : 'bg-blue-400'"
                        />
                        <span class="font-medium">{{ absence.firstName }} {{ absence.lastName }}</span>
                        <span class="text-muted-foreground">({{ absence.typeLabel }})</span>
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Leyenda -->
    <div class="flex flex-wrap items-center gap-4 text-sm">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-red-400" />
        <span>Baja médica o laboral</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-blue-400" />
        <span>Día de libre disposición</span>
      </div>
    </div>
  </div>
</template>
