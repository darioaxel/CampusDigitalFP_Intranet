<!-- pages/usuario/solicitudes/libre-disposicion.vue -->
<template>
  <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">
    <!-- Header -->
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">Días de Libre Disposición</h1>
      <p class="text-muted-foreground text-sm">
        Gestiona tus días de libre disposición. Tienes derecho a 4 días por curso académico.
      </p>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      <span class="ml-2 text-muted-foreground">Cargando...</span>
    </div>

    <template v-else>
      <!-- Layout con Calendario y Panel lateral -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Columna izquierda: Calendario -->
        <div class="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader class="pb-3">
              <CardTitle class="flex items-center gap-2 text-lg">
                <Calendar class="h-5 w-5" />
                Calendario
              </CardTitle>
              <CardDescription>
                Selecciona una fecha para solicitar libre disposición
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarView 
                :events="calendarEvents"
                @date-click="onDateSelect"
                @event-click="viewDetails"
              />
            </CardContent>
          </Card>

          <!-- Leyenda -->
          <div class="flex flex-wrap gap-4 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Días consumidos</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Período disponible</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-amber-500"></div>
              <span>Fuera de plazo</span>
            </div>
          </div>
        </div>

        <!-- Columna derecha: Resumen y Solicitud -->
        <div class="space-y-6">
          <!-- Resumen visual -->
          <Card>
            <CardHeader class="pb-3">
              <CardTitle class="text-lg">Tus Días</CardTitle>
              <CardDescription>
                Curso académico {{ freeDaysData?.academicYear }}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-2 gap-3">
                <div
                  v-for="n in 4"
                  :key="n"
                  :class="[
                    'relative overflow-hidden rounded-lg border p-3 text-center',
                    getDayStatus(n).consumed ? 'border-green-500 bg-green-50' : 
                    getDayStatus(n).available ? 'border-blue-500' : 'border-gray-200 opacity-60'
                  ]"
                >
                  <div class="text-2xl font-bold" :class="getDayStatus(n).consumed ? 'text-green-700' : 'text-blue-600'">
                    {{ n }}
                  </div>
                  <div class="text-xs mt-1" :class="getDayStatus(n).consumed ? 'text-green-600' : 'text-muted-foreground'">
                    {{ getDayStatus(n).label }}
                  </div>
                  <div v-if="getDayStatus(n).consumed && getDayStatus(n).date" class="text-xs text-green-700 mt-1 font-medium">
                    {{ formatShortDate(getDayStatus(n).date) }}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Formulario de nueva solicitud -->
          <Card v-if="canRequest">
            <CardHeader class="pb-3">
              <CardTitle class="flex items-center gap-2 text-lg">
                <CalendarPlus class="h-5 w-5" />
                Nueva Solicitud
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <!-- Fecha seleccionada del calendario -->
              <div v-if="selectedDate" class="bg-muted p-3 rounded-md">
                <span class="text-sm text-muted-foreground">Fecha seleccionada:</span>
                <p class="font-medium">{{ formatDate(selectedDate) }}</p>
              </div>
              <div v-else class="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
                Haz clic en una fecha del calendario para seleccionarla
              </div>

              <!-- Información de restricciones -->
              <Alert>
                <Info class="h-4 w-4" />
                <AlertTitle class="text-sm">Restricciones</AlertTitle>
                <AlertDescription class="text-xs space-y-1">
                  <ul class="list-disc list-inside">
                    <li>Mínimo 15 días de antelación</li>
                    <li>Máximo 3 meses de antelación</li>
                    <li v-if="nextSlot">{{ nextSlotLabel }}</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <!-- Fechas permitidas -->
              <div class="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                <CalendarRange class="h-3 w-3 flex-shrink-0" />
                <span>
                  {{ formatDate(freeDaysData?.validation?.minRequestDate) }} - {{ formatDate(freeDaysData?.validation?.maxRequestDate) }}
                </span>
              </div>

              <!-- Motivo -->
              <div class="space-y-2">
                <Label for="reason" class="text-sm">Motivo (opcional)</Label>
                <Textarea
                  id="reason"
                  v-model="reason"
                  placeholder="Indica el motivo de tu solicitud..."
                  rows="3"
                  class="text-sm"
                />
              </div>

              <!-- Validación automática -->
              <Alert v-if="validationResult" :variant="validationResult.valid ? 'default' : 'destructive'" class="text-xs">
                <CheckCircle v-if="validationResult.valid" class="h-3 w-3" />
                <AlertCircle v-else class="h-3 w-3" />
                <AlertDescription>
                  {{ validationResult.message || validationResult.error }}
                </AlertDescription>
              </Alert>

              <!-- Botón enviar -->
              <Button 
                @click="submitRequest" 
                class="w-full"
                :disabled="!canSubmit"
                size="sm"
              >
                <Send class="h-4 w-4 mr-2" />
                Enviar Solicitud
              </Button>
            </CardContent>
          </Card>

          <!-- Sin días disponibles -->
          <Alert v-else variant="destructive">
            <AlertCircle class="h-4 w-4" />
            <AlertTitle class="text-sm">Sin días disponibles</AlertTitle>
            <AlertDescription class="text-xs">
              {{ freeDaysData?.consumed >= 4 
                ? 'Has consumido todos los días de libre disposición.' 
                : 'No puedes solicitar días en este momento.' }}
            </AlertDescription>
          </Alert>

          <!-- Lista compacta de días consumidos -->
          <Card v-if="freeDaysData?.consumedDays?.length">
            <CardHeader class="pb-2">
              <CardTitle class="text-sm flex items-center gap-2">
                <CalendarCheck class="h-4 w-4" />
                Días Consumidos
              </CardTitle>
            </CardHeader>
            <CardContent class="pt-0">
              <div class="space-y-2">
                <div 
                  v-for="day in freeDaysData.consumedDays" 
                  :key="day.id"
                  class="flex items-center justify-between py-2 border-b last:border-0 text-sm"
                >
                  <div class="flex items-center gap-2">
                    <Badge variant="default" class="text-xs">{{ day.number }}º</Badge>
                    <span>{{ formatShortDate(day.date) }}</span>
                  </div>
                  <Button variant="ghost" size="sm" class="h-7 px-2" @click="viewDetails(day.id)">
                    Ver
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Calendar,
  CalendarCheck,
  CalendarPlus,
  CalendarRange,
  Info,
  CheckCircle,
  AlertCircle,
  Send,
  Loader2,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

// Datos
const { data: freeDaysData, pending, refresh } = await useFetch('/api/requests/free-days')

// Estado del formulario
const selectedDate = ref('')
const reason = ref('')
const validating = ref(false)
const validationResult = ref<{ valid: boolean; message?: string; error?: string } | null>(null)

// Computed
const canRequest = computed(() => freeDaysData.value?.validation?.canRequest)
const nextSlot = computed(() => freeDaysData.value?.nextAvailableSlot)

const nextSlotLabel = computed(() => {
  if (!nextSlot.value) return ''
  const labels: Record<number, string> = {
    1: '1º día (antes del 21 dic)',
    2: '2º día (antes del 1 abr)',
    3: '3º día (antes del 30 jun)',
    4: '4º día (antes del 30 jun)',
  }
  return labels[nextSlot.value.dayNumber] || ''
})

const canSubmit = computed(() => {
  return selectedDate.value && validationResult.value?.valid && !validating.value
})

// Eventos del calendario
const calendarEvents = computed(() => {
  const events: any[] = []
  
  // Días consumidos
  freeDaysData.value?.consumedDays?.forEach((day: any) => {
    events.push({
      id: day.id,
      title: `Libre Disp. - ${day.number}º día`,
      start: day.date,
      end: day.date,
      color: '#22c55e', // green
      description: `Solicitado el ${formatDate(day.requestedAt)}`,
    })
  })
  
  // Slots disponibles (como eventos de referencia)
  freeDaysData.value?.availableSlots?.forEach((slot: any) => {
    events.push({
      id: `slot-${slot.dayNumber}`,
      title: `Disponible (Día ${slot.dayNumber})`,
      start: slot.earliestDate,
      end: slot.deadline,
      color: '#3b82f6', // blue
      description: `Solicitar antes del ${formatDate(slot.deadline)}`,
    })
  })
  
  return events
})

// Watch para validar fecha automáticamente
watch(selectedDate, async (newDate) => {
  if (newDate) {
    await validateDate()
  } else {
    validationResult.value = null
  }
})

// Handlers
function onDateSelect(date: string) {
  const minDate = freeDaysData.value?.validation?.minRequestDate
  const maxDate = freeDaysData.value?.validation?.maxRequestDate
  
  if (minDate && maxDate) {
    if (date >= minDate && date <= maxDate) {
      selectedDate.value = date
    } else {
      alert(`La fecha debe estar entre ${formatDate(minDate)} y ${formatDate(maxDate)}`)
    }
  }
}

async function validateDate() {
  if (!selectedDate.value) return

  validating.value = true
  validationResult.value = null

  try {
    const result = await $fetch('/api/requests/free-days/validate', {
      method: 'POST',
      body: { requestedDate: selectedDate.value },
    })
    validationResult.value = result as any
  } catch (error: any) {
    validationResult.value = {
      valid: false,
      error: error.data?.message || 'Error al validar la fecha',
    }
  } finally {
    validating.value = false
  }
}

async function submitRequest() {
  if (!canSubmit.value) return

  try {
    await $fetch('/api/requests', {
      method: 'POST',
      body: {
        type: 'FREE_DAY',
        title: `Día de libre disposición - ${formatDate(selectedDate.value)}`,
        description: reason.value || undefined,
        requestedDate: selectedDate.value,
      },
    })

    await refresh()
    selectedDate.value = ''
    reason.value = ''
    validationResult.value = null
    
    alert('Solicitud enviada correctamente')
  } catch (error: any) {
    alert(error.data?.message || 'Error al enviar la solicitud')
  }
}

function viewDetails(id: string) {
  navigateTo(`/usuario/solicitudes/${id}`)
}

// Helpers
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatShortDate(dateStr: string | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  })
}

function getDayStatus(n: number) {
  const consumed = freeDaysData.value?.consumedDays?.find((d: any) => d.number === n)
  const slot = freeDaysData.value?.availableSlots?.find((s: any) => s.dayNumber === n)

  if (consumed) {
    return {
      consumed: true,
      available: false,
      label: 'Consumido',
      date: consumed.date,
    }
  }

  if (slot) {
    return {
      consumed: false,
      available: true,
      label: `Disponible`,
      deadline: slot.deadline,
    }
  }

  return {
    consumed: false,
    available: false,
    label: 'No disponible',
    deadline: null,
  }
}
</script>
