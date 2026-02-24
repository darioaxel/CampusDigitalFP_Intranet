<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  Calendar, 
  Info, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  X
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

// Estado
const currentDate = ref(new Date())
const selectedDate = ref<string | null>(null)
const reason = ref('')
const submitting = ref(false)
const showConfirmModal = ref(false)

// Cargar datos del calendario
const { data: calendarData, pending, refresh } = await useFetch('/api/calendars/free-disposition')

const calendar = computed(() => calendarData.value?.data?.calendar)
const days = computed(() => calendarData.value?.data?.days || [])
const myStats = computed(() => calendarData.value?.data?.myStats || { approved: 0, remaining: 4 })

// Días por mes para el calendario
const calendarDays = computed(() => {
  if (!calendar.value) return []
  
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Ajustar para que empiece en lunes (0)
  let startDayOfWeek = firstDay.getDay() - 1
  if (startDayOfWeek < 0) startDayOfWeek = 6
  
  const daysArray = []
  
  // Días vacíos al inicio
  for (let i = 0; i < startDayOfWeek; i++) {
    daysArray.push({ empty: true })
  }
  
  // Días del mes
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayData = days.value.find((d: any) => d.date === dateStr)
    
    daysArray.push({
      day,
      date: dateStr,
      ...dayData
    })
  }
  
  return daysArray
})

const monthYearLabel = computed(() => {
  return currentDate.value.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
})

// Navegación
const prevMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

// Seleccionar fecha
const selectDate = (date: string, canRequest: boolean) => {
  if (!canRequest) return
  selectedDate.value = date
  showConfirmModal.value = true
}

// Enviar solicitud
const submitRequest = async () => {
  if (!selectedDate.value) return
  
  submitting.value = true
  try {
    await $fetch('/api/calendars/free-disposition/request', {
      method: 'POST',
      body: {
        date: selectedDate.value,
        reason: reason.value
      }
    })
    
    await refresh()
    showConfirmModal.value = false
    selectedDate.value = null
    reason.value = ''
    alert('Solicitud enviada correctamente')
  } catch (error: any) {
    alert(error.data?.message || 'Error al enviar la solicitud')
  } finally {
    submitting.value = false
  }
}

// Helpers para clases de celdas
const getCellClasses = (day: any) => {
  if (day.empty) return 'bg-transparent'
  
  const baseClasses = 'relative h-24 border border-border p-2 cursor-pointer transition-colors hover:bg-muted/50'
  
  if (!day.isAvailable) {
    return `${baseClasses} bg-gray-100 text-gray-400 cursor-not-allowed`
  }
  
  // Días del usuario
  if (day.myStatus === 'PENDING') {
    return `${baseClasses} bg-amber-100 border-amber-300`
  }
  if (day.myStatus === 'APPROVED') {
    return `${baseClasses} bg-green-100 border-green-300`
  }
  
  // Lleno (3 solicitudes)
  if (day.isFull) {
    return `${baseClasses} bg-red-100 border-red-300`
  }
  
  return `${baseClasses} bg-white hover:border-primary`
}

const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold">Días de Libre Disposición</h1>
        <p class="text-muted-foreground text-sm">
          Selecciona una fecha disponible en el calendario para solicitar tu día
        </p>
      </div>
      
      <!-- Resumen de días -->
      <div class="flex items-center gap-4">
        <div class="text-right">
          <p class="text-sm text-muted-foreground">Días disponibles</p>
          <p class="text-2xl font-bold">{{ myStats.remaining }}/{{ calendar?.maxPerUser || 4 }}</p>
        </div>
        <div class="flex gap-1">
          <div 
            v-for="n in 4" 
            :key="n"
            :class="[
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
              n <= myStats.approved 
                ? 'bg-green-500 text-white' 
                : n <= myStats.approved + (myStats.remaining > 0 ? 0 : 0)
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-200 text-gray-500'
            ]"
          >
            <CheckCircle v-if="n <= myStats.approved" class="w-4 h-4" />
            <span v-else>{{ n }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      <span class="ml-2 text-muted-foreground">Cargando calendario...</span>
    </div>

    <!-- Sin calendario -->
    <div v-else-if="!calendar" class="text-center py-12">
      <AlertCircle class="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
      <p class="mt-4 text-muted-foreground">No hay calendario de libre disposición activo</p>
    </div>

    <template v-else>
      <!-- Layout principal -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Calendario -->
        <div class="lg:col-span-2">
          <Card>
            <CardHeader class="pb-3">
              <div class="flex items-center justify-between">
                <CardTitle class="text-lg flex items-center gap-2">
                  <Calendar class="h-5 w-5" />
                  {{ calendar.name }}
                </CardTitle>
                <div class="flex items-center gap-2">
                  <Button variant="ghost" size="sm" @click="prevMonth">
                    <ChevronLeft class="h-4 w-4" />
                  </Button>
                  <span class="font-medium capitalize">{{ monthYearLabel }}</span>
                  <Button variant="ghost" size="sm" @click="nextMonth">
                    <ChevronRight class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <!-- Grid de días -->
              <div class="grid grid-cols-7 gap-1">
                <!-- Cabecera días semana -->
                <div 
                  v-for="day in weekDays" 
                  :key="day"
                  class="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {{ day }}
                </div>
                
                <!-- Celdas -->
                <div
                  v-for="(day, index) in calendarDays"
                  :key="index"
                  :class="getCellClasses(day)"
                  @click="day.isAvailable && day.canRequest && selectDate(day.date, day.canRequest)"
                >
                  <template v-if="!day.empty">
                    <span class="text-sm font-medium">{{ day.day }}</span>
                    
                    <!-- Contenido según estado -->
                    <div v-if="day.isAvailable" class="mt-1">
                      <!-- Mi solicitud pendiente -->
                      <div v-if="day.myStatus === 'PENDING'" class="flex items-center gap-1 text-amber-600">
                        <Clock class="w-3 h-3" />
                        <span class="text-xs">Pendiente</span>
                      </div>
                      
                      <!-- Mi solicitud aprobada -->
                      <div v-else-if="day.myStatus === 'APPROVED'" class="flex items-center gap-1 text-green-600">
                        <CheckCircle class="w-3 h-3" />
                        <span class="text-xs">Aprobado</span>
                      </div>
                      
                      <!-- Día lleno -->
                      <div v-else-if="day.isFull" class="text-red-600">
                        <span class="text-xs font-bold">COMPLETO</span>
                      </div>
                      
                      <!-- Disponible con contador -->
                      <div v-else class="flex items-center gap-1">
                        <span 
                          :class="[
                            'text-xs font-bold px-1.5 py-0.5 rounded',
                            day.approvedCount === 0 ? 'bg-green-100 text-green-700' :
                            day.approvedCount === 1 ? 'bg-blue-100 text-blue-700' :
                            day.approvedCount === 2 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          ]"
                        >
                          {{ day.approvedCount }}/3
                        </span>
                      </div>
                    </div>
                    
                    <!-- No disponible -->
                    <div v-else class="text-xs text-gray-400 mt-1">
                      No disp.
                    </div>
                  </template>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Leyenda -->
          <div class="flex flex-wrap gap-4 mt-4 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>Tu día aprobado</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-amber-100 border border-amber-300 rounded"></div>
              <span>Tu solicitud pendiente</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-white border border-primary rounded"></div>
              <span>Disponible</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span>Completo (3/3)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
              <span>No disponible</span>
            </div>
          </div>
        </div>

        <!-- Panel lateral -->
        <div class="space-y-6">
          <!-- Información -->
          <Card>
            <CardHeader>
              <CardTitle class="text-lg">Información</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4 text-sm">
              <div class="flex items-start gap-3">
                <Info class="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p class="font-medium">Límite de días</p>
                  <p class="text-muted-foreground">Tienes derecho a {{ calendar.maxPerUser }} días por curso académico</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <Info class="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p class="font-medium">Máximo por día</p>
                  <p class="text-muted-foreground">Cada día admite máximo 3 profesores en libre disposición</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <Info class="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p class="font-medium">Aprobación</p>
                  <p class="text-muted-foreground">Las solicitudes deben ser aprobadas por administración</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Período -->
          <Card>
            <CardHeader>
              <CardTitle class="text-lg">Período</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-sm text-muted-foreground">
                Curso académico {{ calendar.academicYear }}
              </p>
              <p class="text-sm mt-2">
                Del {{ new Date(calendar.startDate).toLocaleDateString('es-ES') }}
                al {{ new Date(calendar.endDate).toLocaleDateString('es-ES') }}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </template>

    <!-- Modal de confirmación -->
    <Dialog v-model:open="showConfirmModal">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar día de libre disposición</DialogTitle>
          <DialogDescription>
            Fecha seleccionada: {{ selectedDate }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div class="bg-muted p-3 rounded-md">
            <p class="text-sm text-muted-foreground">Esta fecha tiene:</p>
            <p class="font-medium">
              {{ days.find(d => d.date === selectedDate)?.approvedCount || 0 }} solicitudes aprobadas
            </p>
          </div>

          <div class="space-y-2">
            <Label for="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              v-model="reason"
              placeholder="Indica el motivo de tu solicitud..."
              rows="3"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showConfirmModal = false">
            Cancelar
          </Button>
          <Button @click="submitRequest" :disabled="submitting">
            <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
            <CheckCircle v-else class="w-4 h-4 mr-2" />
            Confirmar solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
