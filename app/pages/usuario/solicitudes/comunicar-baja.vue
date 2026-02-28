<script setup lang="ts">
import { Info, FileText, CheckCircle, AlertCircle } from 'lucide-vue-next'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCalendar } from '~/composables/useCalendar'
import { useSickLeaveRequests, TIPOS_BAJA, type SickLeaveRequest } from '~/composables/useSickLeaveRequests'
import type { CalendarDay } from '~/components/calendar/MonthCalendar.vue'

// Importar componentes explícitamente para SSR
import MonthCalendar from '~/components/calendar/MonthCalendar.vue'
import SickLeaveFormCard from '~/components/requests/SickLeaveFormCard.vue'
import MySickLeaveList from '~/components/requests/MySickLeaveList.vue'
import ConfirmSubmitDialog from '~/components/requests/ConfirmSubmitDialog.vue'
import SickLeaveDetailDialog from '~/components/requests/SickLeaveDetailDialog.vue'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

// Composables
const { 
  currentDate, monthYearLabel, canGoPrevMonth, canGoNextMonth, selectedDatesText,
  prevMonth, nextMonth, generateCalendarDays, handleDayClick, clearSelection, 
  isDateSelected, isDateInRange, isRangeStart, isRangeEnd, selectedDates, isRangeMode
} = useCalendar()

const { 
  pending, fetchMyRequests, createRequest, downloadDocument, 
  formatEstado, getEstadoColor, formatTipoBaja, parseAPIDate
} = useSickLeaveRequests()

// Estado
const tipoBaja = ref('')
const observaciones = ref('')
const submitting = ref(false)
const showConfirmModal = ref(false)
const showDetailModal = ref(false)
const selectedRequest = ref<SickLeaveRequest | null>(null)

// Datos
const misSolicitudes = ref<SickLeaveRequest[]>([])

// Cargar solicitudes
const loadRequests = async () => {
  misSolicitudes.value = await fetchMyRequests()
}

await loadRequests()

// Generar días del calendario con metadata
const calendarDays = computed((): CalendarDay[] => {
  const days = generateCalendarDays()
  
  return days.map(day => {
    if (!day.isCurrentMonth) return day
    
    // Buscar solicitud existente para este día
    const solicitudExistente = misSolicitudes.value.find((s: SickLeaveRequest) => {
      if (!s.context) return false
      try {
        const ctx = JSON.parse(s.context)
        return ctx.dates?.includes(day.dateStr)
      } catch {
        return false
      }
    })
    
    return {
      ...day,
      isSelected: isDateSelected(day.date),
      isInRange: isDateInRange(day.date),
      isRangeStart: isRangeStart(day.date),
      isRangeEnd: isRangeEnd(day.date),
      isDisabled: !!solicitudExistente || !day.isCurrentMonth,
      metadata: { solicitudExistente }
    }
  })
})

// Manejar clic en día
const onDayClick = (day: CalendarDay) => {
  if (day.metadata?.solicitudExistente) return
  handleDayClick(day.date, isRangeMode.value)
}

// Enviar solicitud
const submitRequest = async () => {
  if (selectedDates.value.length === 0 || !tipoBaja.value) return
  
  submitting.value = true
  const datesStr = selectedDates.value.map(d => format(d, 'yyyy-MM-dd'))
  
  const success = await createRequest({
    title: `Baja: ${TIPOS_BAJA.find(t => t.value === tipoBaja.value)?.label}`,
    description: observaciones.value,
    dates: datesStr,
    subType: tipoBaja.value
  })
  
  if (success) {
    await loadRequests()
    showConfirmModal.value = false
    clearForm()
  }
  submitting.value = false
}

const clearForm = () => {
  clearSelection()
  tipoBaja.value = ''
  observaciones.value = ''
}

// Modal de detalle
const openDetailModal = (solicitud: SickLeaveRequest) => {
  selectedRequest.value = solicitud
  showDetailModal.value = true
}

const onDocumentUploaded = async () => {
  showDetailModal.value = false
  await loadRequests()
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <FileText class="h-6 w-6" />
          Comunicación de Bajas
        </h1>
        <p class="text-muted-foreground text-sm">
          Selecciona las fechas y el tipo de baja para comunicar a administración
        </p>
      </div>
    </div>

    <!-- Layout principal -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Calendario -->
      <div class="lg:col-span-2 space-y-6">
        <MonthCalendar
          v-model:rangeMode="isRangeMode"
          :days="calendarDays"
          :month-year-label="monthYearLabel"
          :can-go-prev="canGoPrevMonth"
          :can-go-next="canGoNextMonth"
          show-range-mode
          @prev="prevMonth"
          @next="nextMonth"
          @day-click="onDayClick"
        >
          <template #dayContent="{ day }">
            <div v-if="day.metadata?.solicitudExistente" class="mt-1">
              <span class="text-[10px] font-bold px-1 py-0.5 rounded bg-white/50">
                {{ formatEstado(day.metadata.solicitudExistente.currentState?.code) }}
              </span>
            </div>
            <div v-else-if="day.isSelected" class="mt-1">
              <CheckCircle class="w-3 h-3 mx-auto" />
            </div>
          </template>
          
          <template #legend>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-primary rounded"></div>
              <span>Seleccionado</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-amber-100 border border-amber-300 rounded"></div>
              <span>Pendiente</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>Validado</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span>Rechazado</span>
            </div>
          </template>
        </MonthCalendar>

        <!-- Formulario de solicitud -->
        <SickLeaveFormCard
          v-if="selectedDates.length > 0"
          v-model:tipo-baja="tipoBaja"
          v-model:observaciones="observaciones"
          :selected-dates-text="selectedDatesText"
          :submitting="submitting"
          @submit="showConfirmModal = true"
          @cancel="clearForm"
        />
      </div>

      <!-- Panel lateral -->
      <div class="space-y-6">
        <MySickLeaveList
          :requests="misSolicitudes"
          :loading="pending"
          :format-estado="formatEstado"
          :get-estado-color="getEstadoColor"
          :format-tipo-baja="formatTipoBaja"
          :parse-api-date="parseAPIDate"
          @select="openDetailModal"
        />

        <!-- Información -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg flex items-center gap-2">
              <Info class="h-4 w-4" />
              Información
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4 text-sm">
            <div class="flex items-start gap-3">
              <AlertCircle class="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p class="font-medium">Proceso de comunicación</p>
                <p class="text-muted-foreground">
                  1. Selecciona las fechas y tipo de baja<br>
                  2. Envía la comunicación a administración<br>
                  3. Espera la aceptación de la notificación<br>
                  4. Sube los documentos justificativos<br>
                  5. Administración validará la documentación
                </p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <FileText class="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p class="font-medium">Documentación requerida</p>
                <p class="text-muted-foreground">
                  Parte médico, informe del centro de salud, o documento oficial que acredite la baja.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Modales -->
    <ConfirmSubmitDialog
      v-model:open="showConfirmModal"
      :submitting="submitting"
      @confirm="submitRequest"
    >
      <div class="bg-muted p-3 rounded-md space-y-2">
        <p class="text-sm"><strong>Fechas:</strong> {{ selectedDatesText }}</p>
        <p class="text-sm"><strong>Tipo:</strong> {{ TIPOS_BAJA.find(t => t.value === tipoBaja)?.label }}</p>
        <p class="text-sm" v-if="observaciones"><strong>Observaciones:</strong> {{ observaciones }}</p>
      </div>
    </ConfirmSubmitDialog>

    <SickLeaveDetailDialog
      v-model:open="showDetailModal"
      :request="selectedRequest"
      :format-estado="formatEstado"
      :get-estado-color="getEstadoColor"
      :format-tipo-baja="formatTipoBaja"
      :parse-api-date="parseAPIDate"
      @uploaded="onDocumentUploaded"
      @download="downloadDocument"
    />
  </div>
</template>
