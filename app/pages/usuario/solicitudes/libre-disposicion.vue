<!-- pages/usuario/solicitudes/libre-disposicion.vue -->
<template>
  <div class="max-w-5xl mx-auto px-6 py-8 space-y-6">
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
      <!-- Resumen visual -->
      <div class="grid grid-cols-4 gap-4">
        <Card
          v-for="n in 4"
          :key="n"
          :class="[
            'relative overflow-hidden',
            getDayStatus(n).consumed ? 'border-green-500 bg-green-50' : 
            getDayStatus(n).available ? 'border-blue-500' : 'border-gray-200 opacity-60'
          ]"
        >
          <div class="p-4 text-center">
            <div class="text-3xl font-bold" :class="getDayStatus(n).consumed ? 'text-green-700' : 'text-blue-600'">
              {{ n }}
            </div>
            <div class="text-xs mt-1" :class="getDayStatus(n).consumed ? 'text-green-600' : 'text-muted-foreground'">
              {{ getDayStatus(n).label }}
            </div>
            <div v-if="getDayStatus(n).consumed && getDayStatus(n).date" class="text-xs text-green-700 mt-1 font-medium">
              {{ formatDate(getDayStatus(n).date) }}
            </div>
            <div v-else-if="getDayStatus(n).deadline" class="text-xs text-muted-foreground mt-1">
              Antes: {{ getDayStatus(n).deadline }}
            </div>
          </div>
        </Card>
      </div>

      <!-- Tabla de días consumidos -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="flex items-center gap-2 text-lg">
            <CalendarCheck class="h-5 w-5" />
            Días Consumidos
          </CardTitle>
          <CardDescription>
            Curso académico {{ freeDaysData?.academicYear }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="!freeDaysData?.consumedDays?.length" class="text-center py-8 text-muted-foreground">
            <CalendarX class="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No has consumido ningún día de libre disposición este curso.</p>
          </div>

          <Table v-else>
            <TableHeader>
              <TableRow>
                <TableHead class="w-24">Día Nº</TableHead>
                <TableHead>Fecha solicitada</TableHead>
                <TableHead>Fecha de solicitud</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead class="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="day in freeDaysData.consumedDays" :key="day.id">
                <TableCell>
                  <Badge variant="default">{{ day.number }}º día</Badge>
                </TableCell>
                <TableCell class="font-medium">
                  {{ formatDate(day.date) }}
                </TableCell>
                <TableCell class="text-sm text-muted-foreground">
                  {{ formatDate(day.requestedAt) }}
                </TableCell>
                <TableCell>
                  <Badge :variant="day.status === 'APPROVED' ? 'default' : 'secondary'">
                    {{ day.status === 'APPROVED' ? 'Aprobado' : 'Cerrado' }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <Button variant="ghost" size="sm" @click="viewDetails(day.id)">
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <!-- Formulario de nueva solicitud -->
      <Card v-if="canRequest">
        <CardHeader class="pb-3">
          <CardTitle class="flex items-center gap-2 text-lg">
            <CalendarPlus class="h-5 w-5" />
            Nueva Solicitud
          </CardTitle>
          <CardDescription>
            Solicita un nuevo día de libre disposición
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Información de restricciones -->
          <Alert>
            <Info class="h-4 w-4" />
            <AlertTitle>Restricciones aplicables</AlertTitle>
            <AlertDescription class="space-y-1">
              <ul class="text-sm space-y-1 list-disc list-inside">
                <li>Solicitud con <strong>mínimo 15 días</strong> y <strong>máximo 3 meses</strong> de antelación</li>
                <li v-if="nextSlot">Próximo día disponible: <strong>{{ nextSlotLabel }}</strong></li>
              </ul>
            </AlertDescription>
          </Alert>

          <!-- Fechas permitidas -->
          <div class="flex items-center gap-4 text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <CalendarRange class="h-4 w-4" />
            <span>
              Fechas permitidas: 
              <strong>{{ formatDate(freeDaysData?.validation?.minRequestDate) }}</strong>
              a
              <strong>{{ formatDate(freeDaysData?.validation?.maxRequestDate) }}</strong>
            </span>
          </div>

          <!-- Selector de fecha -->
          <div class="space-y-2">
            <Label for="requestDate">Fecha solicitada</Label>
            <div class="flex gap-3">
              <Input
                id="requestDate"
                v-model="selectedDate"
                type="date"
                class="w-auto"
                :min="freeDaysData?.validation?.minRequestDate"
                :max="freeDaysData?.validation?.maxRequestDate"
              />
              <Button 
                @click="validateDate" 
                variant="outline"
                :disabled="!selectedDate || validating"
              >
                <CheckCircle v-if="!validating" class="h-4 w-4 mr-2" />
                <Loader2 v-else class="h-4 w-4 mr-2 animate-spin" />
                Validar
              </Button>
            </div>
          </div>

          <!-- Resultado de validación -->
          <Alert v-if="validationResult" :variant="validationResult.valid ? 'default' : 'destructive'">
            <CheckCircle v-if="validationResult.valid" class="h-4 w-4" />
            <AlertCircle v-else class="h-4 w-4" />
            <AlertTitle>{{ validationResult.valid ? 'Fecha válida' : 'Fecha no válida' }}</AlertTitle>
            <AlertDescription>
              {{ validationResult.message || validationResult.error }}
            </AlertDescription>
          </Alert>

          <!-- Motivo -->
          <div class="space-y-2">
            <Label for="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              v-model="reason"
              placeholder="Indica el motivo de tu solicitud..."
              rows="3"
            />
          </div>

          <!-- Botón enviar -->
          <Button 
            @click="submitRequest" 
            class="w-full"
            :disabled="!canSubmit"
          >
            <Send class="h-4 w-4 mr-2" />
            Enviar Solicitud
          </Button>
        </CardContent>
      </Card>

      <!-- Sin días disponibles -->
      <Alert v-else variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>Sin días disponibles</AlertTitle>
        <AlertDescription>
          {{ freeDaysData?.consumed >= 4 
            ? 'Has consumido todos los días de libre disposición para este curso.' 
            : 'No puedes solicitar días en este momento.' }}
        </AlertDescription>
      </Alert>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  CalendarCheck,
  CalendarX,
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

// Helpers
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
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

  // Día no disponible por fecha límite pasada
  return {
    consumed: false,
    available: false,
    label: 'No disponible',
    deadline: null,
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

    // Mostrar éxito y recargar
    await refresh()
    selectedDate.value = ''
    reason.value = ''
    validationResult.value = null
    
    // Toast de éxito (si tienes sonner/toast configurado)
    // toast.success('Solicitud enviada correctamente')
    alert('Solicitud enviada correctamente')
  } catch (error: any) {
    alert(error.data?.message || 'Error al enviar la solicitud')
  }
}

function viewDetails(id: string) {
  navigateTo(`/usuario/solicitudes/${id}`)
}
</script>
