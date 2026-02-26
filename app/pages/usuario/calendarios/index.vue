<!-- pages/usuario/calendarios/index.vue -->
<template>
  <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold">Calendarios</h1>
        <p class="text-muted-foreground text-sm">
          Consulta los calendarios escolares, evaluaciones y eventos
        </p>
      </div>
      
      <!-- Selector de año académico -->
      <Select v-model="selectedYear">
        <SelectTrigger class="w-[180px]">
          <SelectValue placeholder="Año académico" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="year in academicYears" :key="year" :value="year">
            {{ year }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      <span class="ml-2 text-muted-foreground">Cargando calendarios...</span>
    </div>

    <!-- Sin calendarios -->
    <div v-else-if="!calendars?.length" class="text-center py-12">
      <CalendarX class="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
      <p class="mt-4 text-muted-foreground">No hay calendarios disponibles para este curso</p>
    </div>

    <!-- Grid de calendarios -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="calendar in calendars"
        :key="calendar.id"
        :to="calendar.type === 'FREE_DISPOSITION' 
          ? '/usuario/solicitudes/libre-disposicion' 
          : `/usuario/calendarios/${calendar.id}`"
        class="block"
      >
        <Card class="cursor-pointer hover:border-primary transition-colors h-full">
        <CardHeader class="pb-3">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-2">
              <div 
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                :class="getCalendarIconClass(calendar.type)"
              >
                <Icon :name="getCalendarIcon(calendar.type)" class="h-5 w-5" />
              </div>
              <div>
                <CardTitle class="text-base">{{ calendar.name }}</CardTitle>
                <CardDescription class="text-xs">
                  {{ getCalendarTypeLabel(calendar.type) }}
                </CardDescription>
              </div>
            </div>
            <Badge v-if="calendar.allowDragDrop" variant="secondary" class="text-[10px]">
              Interactivo
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent class="pt-0">
          <p class="text-sm text-muted-foreground line-clamp-2 mb-3">
            {{ calendar.description || 'Sin descripción' }}
          </p>
          
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <div class="flex items-center gap-1">
              <Icon name="lucide:calendar" class="h-3 w-3" />
              <span>{{ formatDateRange(calendar.startDate, calendar.endDate) }}</span>
            </div>
            <span>{{ calendar._count?.events || 0 }} eventos</span>
          </div>
        </CardContent>
      </Card>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Loader2, CalendarX } from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

// Año académico actual
const now = new Date()
const currentYear = now.getFullYear()
const academicYearStart = now.getMonth() >= 8 ? currentYear : currentYear - 1
const academicYearEnd = academicYearStart + 1
const currentAcademicYear = `${academicYearStart}-${academicYearEnd}`

const selectedYear = ref(currentAcademicYear)

// Generar opciones de años académicos
const academicYears = computed(() => {
  const years = []
  for (let i = -2; i <= 2; i++) {
    const start = academicYearStart + i
    const end = start + 1
    years.push(`${start}-${end}`)
  }
  return years.reverse()
})

// Fetch calendarios
const { data: response, pending, refresh } = useFetch(() => `/api/calendars?academicYear=${selectedYear.value}&isActive=true`, {
  watch: [selectedYear],
})

// Extraer calendarios de la respuesta
const calendars = computed(() => response.value?.data || [])

// Helpers
function getCalendarIcon(type: string) {
  const icons: Record<string, string> = {
    'SCHOOL_YEAR': 'lucide:graduation-cap',
    'EVALUATION': 'lucide:clipboard-check',
    'FREE_DISPOSITION': 'lucide:calendar-check',
    'MEETINGS': 'lucide:users',
    'OTHER': 'lucide:calendar',
  }
  return icons[type] || 'lucide:calendar'
}

function getCalendarIconClass(type: string) {
  const classes: Record<string, string> = {
    'SCHOOL_YEAR': 'bg-blue-100 text-blue-600',
    'EVALUATION': 'bg-amber-100 text-amber-600',
    'FREE_DISPOSITION': 'bg-green-100 text-green-600',
    'MEETINGS': 'bg-purple-100 text-purple-600',
    'OTHER': 'bg-gray-100 text-gray-600',
  }
  return classes[type] || 'bg-gray-100 text-gray-600'
}

function getCalendarTypeLabel(type: string) {
  const labels: Record<string, string> = {
    'SCHOOL_YEAR': 'Calendario Escolar',
    'EVALUATION': 'Evaluaciones',
    'FREE_DISPOSITION': 'Libre Disposición',
    'MEETINGS': 'Reuniones',
    'OTHER': 'Otros',
  }
  return labels[type] || type
}

function formatDateRange(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${startDate.toLocaleDateString('es-ES', { month: 'short' })} - ${endDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`
}
</script>
