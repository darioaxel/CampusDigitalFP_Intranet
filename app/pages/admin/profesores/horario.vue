<template>
  <div class="min-h-screen">
    <!-- Header -->
    <div class="bg-card border-b">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-semibold flex items-center gap-2">
              <Clock class="h-6 w-6" />
              Horarios de Profesores
            </h1>
            <p class="text-sm text-muted-foreground mt-1">
              Visualiza y gestiona los horarios de todo el profesorado
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" @click="refreshData" :disabled="pending">
              <RefreshCw class="h-4 w-4 mr-2" :class="{ 'animate-spin': pending }" />
              Recargar
            </Button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <!-- Resumen -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted-foreground">Total Profesores</p>
                <p class="text-2xl font-bold">{{ stats.totalProfesores }}</p>
              </div>
              <Users class="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted-foreground">Con Horario</p>
                <p class="text-2xl font-bold text-green-600">{{ stats.conHorario }}</p>
              </div>
              <UserCheck class="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted-foreground">Sin Horario</p>
                <p class="text-2xl font-bold text-amber-600">{{ stats.sinHorario }}</p>
              </div>
              <UserX class="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted-foreground">Total Horarios</p>
                <p class="text-2xl font-bold text-blue-600">{{ stats.totalHorarios }}</p>
              </div>
              <Calendar class="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Filtros -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base flex items-center gap-2">
            <Search class="h-4 w-4" />
            Buscar Profesor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex gap-4">
            <div class="flex-1">
              <Input
                v-model="searchQuery"
                placeholder="Buscar por nombre, apellidos o email..."
                @input="debouncedSearch"
              />
            </div>
            <Button variant="ghost" size="icon" @click="clearSearch" v-if="searchQuery">
              <X class="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Tabla de Profesores con Acordeón -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center justify-between">
            <span class="flex items-center gap-2">
              <List class="h-5 w-5" />
              Listado de Profesores
            </span>
            <Badge variant="secondary">{{ filteredProfesores.length }} resultados</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <!-- Loading -->
          <div v-if="pending" class="flex items-center justify-center py-12">
            <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
            <span class="ml-2 text-muted-foreground">Cargando profesores...</span>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="text-center py-12">
            <AlertCircle class="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 class="text-lg font-medium mb-2">Error al cargar los datos</h3>
            <p class="text-sm text-muted-foreground mb-4">{{ error.message }}</p>
            <Button @click="refreshData">
              <RefreshCw class="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>

          <!-- Tabla con Acordeón -->
          <div v-else class="border rounded-md">
            <!-- Header de tabla -->
            <div class="grid grid-cols-12 gap-4 p-4 bg-muted/50 font-medium text-sm border-b">
              <div class="col-span-4">Profesor</div>
              <div class="col-span-2">Rol</div>
              <div class="col-span-2">Estado</div>
              <div class="col-span-2 text-center">Horarios</div>
              <div class="col-span-2 text-right">Acciones</div>
            </div>

            <!-- Filas de profesores -->
            <div v-if="filteredProfesores.length === 0" class="p-8 text-center text-muted-foreground">
              <Inbox class="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron profesores</p>
            </div>

            <template v-for="profesor in filteredProfesores" :key="profesor.id">
              <!-- Fila principal -->
              <div 
                class="grid grid-cols-12 gap-4 p-4 border-b hover:bg-muted/30 transition-colors cursor-pointer"
                @click="toggleExpand(profesor.id)"
              >
                <div class="col-span-4 flex items-center gap-3">
                  <Avatar class="h-10 w-10">
                    <AvatarFallback class="bg-primary/10 text-primary">
                      {{ getIniciales(profesor.nombre) }}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p class="font-medium">{{ profesor.nombre }}</p>
                    <p class="text-xs text-muted-foreground">{{ profesor.email }}</p>
                  </div>
                </div>
                <div class="col-span-2 flex items-center">
                  <Badge :variant="getRoleVariant(profesor.rol)">
                    {{ formatRole(profesor.rol) }}
                  </Badge>
                </div>
                <div class="col-span-2 flex items-center">
                  <Badge :variant="profesor.activo ? 'default' : 'secondary'">
                    {{ profesor.activo ? 'Activo' : 'Inactivo' }}
                  </Badge>
                </div>
                <div class="col-span-2 flex items-center justify-center">
                  <Badge 
                    :variant="profesor.totalHorarios > 0 ? 'default' : 'outline'"
                    :class="profesor.totalHorarios === 0 ? 'text-amber-600 border-amber-600' : ''"
                  >
                    {{ profesor.totalHorarios }}
                  </Badge>
                </div>
                <div class="col-span-2 flex items-center justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    @click.stop="navigateTo(`/usuario/crear-horario?userId=${profesor.id}`)"
                  >
                    <Plus class="h-4 w-4 mr-1" />
                    Crear
                  </Button>
                  <Button variant="ghost" size="icon" @click.stop="toggleExpand(profesor.id)">
                    <ChevronDown 
                      class="h-5 w-5 transition-transform" 
                      :class="expandedRows.has(profesor.id) ? 'rotate-180' : ''"
                    />
                  </Button>
                </div>
              </div>

              <!-- Panel expandible con horarios -->
              <div 
                v-show="expandedRows.has(profesor.id)"
                class="bg-muted/20 border-b"
              >
                <div class="p-4">
                  <div v-if="profesor.horarios.length === 0" class="text-center py-8 text-muted-foreground">
                    <CalendarX class="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Este profesor no tiene horarios asignados</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      class="mt-4"
                      @click="navigateTo(`/usuario/crear-horario?userId=${profesor.id}`)"
                    >
                      <Plus class="h-4 w-4 mr-2" />
                      Crear Horario
                    </Button>
                  </div>

                  <div v-else class="space-y-4">
                    <div class="flex items-center justify-between">
                      <h4 class="font-medium flex items-center gap-2">
                        <Calendar class="h-4 w-4" />
                        Horarios del profesor
                      </h4>
                    </div>

                    <!-- Lista de horarios -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card 
                        v-for="horario in profesor.horarios" 
                        :key="horario.id"
                        class="overflow-hidden"
                      >
                        <!-- Header del horario -->
                        <div 
                          class="p-4 border-b flex items-center justify-between"
                          :style="{ borderLeft: `4px solid ${horario.color || '#3b82f6'}` }"
                        >
                          <div>
                            <h5 class="font-medium">{{ horario.nombre }}</h5>
                            <p class="text-xs text-muted-foreground">{{ formatScheduleType(horario.tipo) }}</p>
                          </div>
                          <Badge :variant="getValidationVariant(horario.validationStatus)">
                            {{ formatValidationStatus(horario.validationStatus) }}
                          </Badge>
                        </div>

                        <CardContent class="p-4 space-y-3">
                          <!-- Info del horario -->
                          <div class="flex items-center gap-4 text-sm text-muted-foreground">
                            <span class="flex items-center gap-1">
                              <Layers class="h-4 w-4" />
                              {{ horario.totalBloques }} bloques
                            </span>
                            <span v-if="horario.validFrom && horario.validUntil" class="flex items-center gap-1">
                              <CalendarRange class="h-4 w-4" />
                              {{ formatDate(horario.validFrom) }} - {{ formatDate(horario.validUntil) }}
                            </span>
                          </div>

                          <!-- Descripción -->
                          <p v-if="horario.descripcion" class="text-sm text-muted-foreground line-clamp-2">
                            {{ horario.descripcion }}
                          </p>

                          <!-- Vista previa de bloques -->
                          <div v-if="horario.bloques.length > 0" class="space-y-1">
                            <p class="text-xs font-medium text-muted-foreground">Vista previa:</p>
                            <div class="flex flex-wrap gap-1">
                              <Badge 
                                v-for="(bloque, idx) in horario.bloques.slice(0, 5)" 
                                :key="bloque.id"
                                variant="outline" 
                                class="text-xs"
                                :class="bloque.esRecreo ? 'bg-amber-50' : ''"
                              >
                                {{ formatDay(bloque.dia) }} {{ bloque.horaInicio }}-{{ bloque.horaFin }}
                                <span v-if="bloque.asignatura" class="ml-1 text-muted-foreground">
                                  ({{ bloque.asignatura.substring(0, 15) }}{{ bloque.asignatura.length > 15 ? '...' : '' }})
                                </span>
                              </Badge>
                              <Badge v-if="horario.bloques.length > 5" variant="secondary" class="text-xs">
                                +{{ horario.bloques.length - 5 }} más
                              </Badge>
                            </div>
                          </div>

                          <!-- Acciones del horario -->
                          <div class="flex gap-2 pt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              class="flex-1"
                              @click="navigateTo(`/usuario/horarios?scheduleId=${horario.id}`)"
                            >
                              <Eye class="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              class="flex-1"
                              @click="navigateTo(`/usuario/crear-horario?templateId=${horario.id}`)"
                            >
                              <Copy class="h-4 w-4 mr-1" />
                              Clonar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              @click="openScheduleDetail(horario)"
                            >
                              <Maximize2 class="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Modal de detalle del horario -->
    <Dialog :open="!!selectedSchedule" @update:open="selectedSchedule = null">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Calendar class="h-5 w-5" />
            {{ selectedSchedule?.nombre }}
          </DialogTitle>
          <DialogDescription>
            {{ selectedSchedule?.descripcion || 'Sin descripción' }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="selectedSchedule" class="space-y-6">
          <!-- Info general -->
          <div class="flex items-center gap-4 text-sm">
            <Badge :variant="getValidationVariant(selectedSchedule.validationStatus)">
              {{ formatValidationStatus(selectedSchedule.validationStatus) }}
            </Badge>
            <span class="text-muted-foreground">
              {{ selectedSchedule.totalBloques }} bloques
            </span>
            <span v-if="selectedSchedule.validFrom && selectedSchedule.validUntil" class="text-muted-foreground">
              Vigente: {{ formatDate(selectedSchedule.validFrom) }} - {{ formatDate(selectedSchedule.validUntil) }}
            </span>
          </div>

          <!-- Tabla de bloques -->
          <div class="border rounded-md">
            <table class="w-full text-sm">
              <thead class="bg-muted">
                <tr>
                  <th class="p-3 text-left">Día</th>
                  <th class="p-3 text-left">Hora</th>
                  <th class="p-3 text-left">Asignatura/Actividad</th>
                  <th class="p-3 text-left">Aula</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="bloque in selectedSchedule.bloques" 
                  :key="bloque.id"
                  class="border-t"
                  :class="bloque.esRecreo ? 'bg-amber-50' : ''"
                >
                  <td class="p-3">{{ formatDayFull(bloque.dia) }}</td>
                  <td class="p-3 font-mono">{{ bloque.horaInicio }} - {{ bloque.horaFin }}</td>
                  <td class="p-3">
                    <span v-if="bloque.esRecreo" class="text-amber-700 font-medium">Recreo</span>
                    <span v-else>{{ bloque.asignatura || '-' }}</span>
                  </td>
                  <td class="p-3 text-muted-foreground">{{ bloque.aula || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Acciones -->
          <DialogFooter class="gap-2">
            <Button variant="outline" @click="selectedSchedule = null">
              Cerrar
            </Button>
            <Button 
              @click="navigateTo(`/usuario/horarios?scheduleId=${selectedSchedule.id}`)"
            >
              <ExternalLink class="h-4 w-4 mr-2" />
              Ver en página completa
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import {
  Clock, Users, UserCheck, UserX, Calendar, Search, X, List,
  RefreshCw, Loader2, AlertCircle, Inbox, ChevronDown, Plus,
  Eye, Copy, Maximize2, ExternalLink, CalendarX, CalendarRange,
  Layers
} from 'lucide-vue-next'
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

// Tipos
interface Bloque {
  id: string
  dia: string
  horaInicio: string
  horaFin: string
  asignatura: string
  aula: string
  esRecreo: boolean
}

interface Horario {
  id: string
  nombre: string
  tipo: string
  descripcion: string
  color: string
  validFrom: string | null
  validUntil: string | null
  validationStatus: string
  totalBloques: number
  bloques: Bloque[]
}

interface Profesor {
  id: string
  nombre: string
  email: string
  rol: string
  activo: boolean
  totalHorarios: number
  horarios: Horario[]
}

// Estados
const expandedRows = ref<Set<string>>(new Set())
const searchQuery = ref('')
const selectedSchedule = ref<Horario | null>(null)
const searchTimeout = ref<NodeJS.Timeout | null>(null)

// Datos
const { data: profesoresData, pending, error, refresh } = await useFetch('/api/admin/profesores/horarios', {
  key: 'profesores-horarios',
  server: true,
})

const profesores = computed<Profesor[]>(() => profesoresData.value?.data || [])

// Filtrar profesores por búsqueda
const filteredProfesores = computed(() => {
  if (!searchQuery.value.trim()) return profesores.value
  
  const query = searchQuery.value.toLowerCase()
  return profesores.value.filter(p => 
    p.nombre.toLowerCase().includes(query) ||
    p.email.toLowerCase().includes(query)
  )
})

// Estadísticas
const stats = computed(() => {
  const total = profesores.value.length
  const conHorario = profesores.value.filter(p => p.totalHorarios > 0).length
  const totalHorarios = profesores.value.reduce((sum, p) => sum + p.totalHorarios, 0)
  
  return {
    totalProfesores: total,
    conHorario,
    sinHorario: total - conHorario,
    totalHorarios
  }
})

// Métodos
function toggleExpand(profesorId: string) {
  if (expandedRows.value.has(profesorId)) {
    expandedRows.value.delete(profesorId)
  } else {
    expandedRows.value.add(profesorId)
  }
}

function debouncedSearch() {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  searchTimeout.value = setTimeout(() => {
    // La búsqueda es local por ahora, podría ser server-side
  }, 300)
}

function clearSearch() {
  searchQuery.value = ''
}

function refreshData() {
  refresh()
  toast.success('Datos actualizados')
}

function openScheduleDetail(horario: Horario) {
  selectedSchedule.value = horario
}

// Helpers
function getIniciales(nombre: string): string {
  return nombre
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(n => n[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
}

function formatRole(role: string): string {
  const roles: Record<string, string> = {
    'ADMIN': 'Administrador',
    'PROFESOR': 'Profesor',
    'JEFE_DEPT': 'Jefe Dept.',
    'EXPERTO': 'Experto',
    'USER': 'Usuario'
  }
  return roles[role] || role
}

function getRoleVariant(role: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'ADMIN': 'destructive',
    'PROFESOR': 'default',
    'JEFE_DEPT': 'secondary',
    'EXPERTO': 'outline',
    'USER': 'secondary'
  }
  return variants[role] || 'secondary'
}

function formatScheduleType(type: string): string {
  const types: Record<string, string> = {
    'NORMAL': 'Normal',
    'EXAMENES': 'Exámenes',
    'EXTRAORDINARIO': 'Extraordinario',
    'GUARDIA': 'Guardia',
    'REFUERZO': 'Refuerzo'
  }
  return types[type] || type
}

function formatValidationStatus(status: string): string {
  const statuses: Record<string, string> = {
    'BORRADOR': 'Borrador',
    'PENDIENTE': 'Pendiente',
    'VALIDADO': 'Validado',
    'RECHAZADO': 'Rechazado'
  }
  return statuses[status] || status
}

function getValidationVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'BORRADOR': 'secondary',
    'PENDIENTE': 'outline',
    'VALIDADO': 'default',
    'RECHAZADO': 'destructive'
  }
  return variants[status] || 'secondary'
}

function formatDay(day: string): string {
  const days: Record<string, string> = {
    'LUNES': 'Lun',
    'MARTES': 'Mar',
    'MIERCOLES': 'Mié',
    'JUEVES': 'Jue',
    'VIERNES': 'Vie',
    'SABADO': 'Sáb',
    'DOMINGO': 'Dom'
  }
  return days[day] || day
}

function formatDayFull(day: string): string {
  const days: Record<string, string> = {
    'LUNES': 'Lunes',
    'MARTES': 'Martes',
    'MIERCOLES': 'Miércoles',
    'JUEVES': 'Jueves',
    'VIERNES': 'Viernes',
    'SABADO': 'Sábado',
    'DOMINGO': 'Domingo'
  }
  return days[day] || day
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}
</script>
