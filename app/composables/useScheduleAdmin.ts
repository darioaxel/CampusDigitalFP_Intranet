// app/composables/useScheduleAdmin.ts
// Composable para gestión de horarios desde administración

import { toast } from 'vue-sonner'

export interface ScheduleTemplate {
  id: string
  name: string
  description: string | null
  type: string
  color: string | null
  isActive: boolean
  isTemplate: boolean
  validFrom: string | null
  validUntil: string | null
  createdAt: string
  updatedAt: string
  userId: string
  user?: {
    firstName: string
    lastName: string
    role: string
  }
  blocks: ScheduleBlock[]
  _count?: {
    blocks: number
  }
}

export interface ScheduleBlock {
  id: string
  dayOfWeek: 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO'
  startTime: string
  endTime: string
  subject: string | null
  room: string | null
  isBreak: boolean
}

export interface ScheduleFormData {
  name: string
  type: string
  description: string
  color: string
  isActive: boolean
  validFrom: string
  validUntil: string
  blocks: ScheduleBlockInput[]
}

export interface ScheduleBlockInput {
  dayOfWeek: string
  startTime: string
  endTime: string
  subject: string
  room: string
  isBreak: boolean
}

const scheduleTypes = [
  { value: 'NORMAL', label: 'Horario Normal' },
  { value: 'EXAMENES', label: 'Exámenes' },
  { value: 'EXTRAORDINARIO', label: 'Extraordinario' },
  { value: 'GUARDIA', label: 'Guardia' },
  { value: 'REFUERZO', label: 'Refuerzo' }
] as const

const presetColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1', '#14b8a6', '#a855f7'
]

const dayOrder = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']

export function useScheduleAdmin() {
  const templates = ref<ScheduleTemplate[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Cargar templates
  const fetchTemplates = async () => {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await useFetch('/api/schedules/templates')
      templates.value = data.value?.data || []
      return templates.value
    } catch (err: any) {
      error.value = err.message || 'Error al cargar templates'
      toast.error(error.value)
      return []
    } finally {
      loading.value = false
    }
  }

  // Crear template
  const createTemplate = async (formData: ScheduleFormData) => {
    try {
      const { data, error: fetchError } = await useFetch('/api/schedules', {
        method: 'POST',
        body: {
          ...formData,
          isTemplate: true
        }
      })

      if (fetchError.value) throw fetchError.value

      toast.success('Plantilla creada correctamente')
      await fetchTemplates()
      return data.value
    } catch (err: any) {
      const message = err.message || 'Error al crear la plantilla'
      toast.error(message)
      throw err
    }
  }

  // Actualizar template
  const updateTemplate = async (id: string, formData: ScheduleFormData) => {
    try {
      const { data, error: fetchError } = await useFetch(`/api/schedules/${id}`, {
        method: 'PUT',
        body: formData
      })

      if (fetchError.value) throw fetchError.value

      toast.success('Plantilla actualizada correctamente')
      await fetchTemplates()
      return data.value
    } catch (err: any) {
      const message = err.message || 'Error al actualizar la plantilla'
      toast.error(message)
      throw err
    }
  }

  // Eliminar template
  const deleteTemplate = async (id: string) => {
    try {
      const { error: fetchError } = await useFetch(`/api/schedules/${id}`, {
        method: 'DELETE'
      })

      if (fetchError.value) throw fetchError.value

      toast.success('Plantilla eliminada')
      await fetchTemplates()
      return true
    } catch (err: any) {
      const message = err.message || 'Error al eliminar la plantilla'
      toast.error(message)
      throw err
    }
  }

  // Clonar template
  const cloneTemplate = async (id: string) => {
    try {
      const { data, error: fetchError } = await useFetch(`/api/schedules/${id}/clone`, {
        method: 'POST'
      })

      if (fetchError.value) throw fetchError.value

      toast.success('Plantilla clonada correctamente')
      await fetchTemplates()
      return data.value
    } catch (err: any) {
      const message = err.message || 'Error al clonar la plantilla'
      toast.error(message)
      throw err
    }
  }

  // Crear bloque base
  const createBaseBlocks = (): ScheduleBlockInput[] => {
    const blocks: ScheduleBlockInput[] = []
    const days = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
    
    days.forEach(day => {
      // 8:00 - 14:00 con recreo 10:00-10:30
      blocks.push(
        { dayOfWeek: day, startTime: '08:00', endTime: '09:00', subject: '', room: '', isBreak: false },
        { dayOfWeek: day, startTime: '09:00', endTime: '10:00', subject: '', room: '', isBreak: false },
        { dayOfWeek: day, startTime: '10:00', endTime: '10:30', subject: 'Recreo', room: '', isBreak: true },
        { dayOfWeek: day, startTime: '10:30', endTime: '11:30', subject: '', room: '', isBreak: false },
        { dayOfWeek: day, startTime: '11:30', endTime: '12:30', subject: '', room: '', isBreak: false },
        { dayOfWeek: day, startTime: '12:30', endTime: '13:30', subject: '', room: '', isBreak: false },
        { dayOfWeek: day, startTime: '13:30', endTime: '14:30', subject: '', room: '', isBreak: false }
      )
    })
    
    return sortBlocks(blocks)
  }

  // Crear bloque tarde
  const createAfternoonBlocks = (): ScheduleBlockInput[] => {
    const blocks: ScheduleBlockInput[] = []
    const days = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
    
    days.forEach(day => {
      blocks.push(
        { dayOfWeek: day, startTime: '15:00', endTime: '16:00', subject: '', room: '', isBreak: false },
        { dayOfWeek: day, startTime: '16:00', endTime: '17:00', subject: '', room: '', isBreak: false },
        { dayOfWeek: day, startTime: '17:00', endTime: '17:30', subject: 'Recreo', room: '', isBreak: true },
        { dayOfWeek: day, startTime: '17:30', endTime: '18:30', subject: '', room: '', isBreak: false },
        { dayOfWeek: day, startTime: '18:30', endTime: '19:30', subject: '', room: '', isBreak: false },
        { dayOfWeek: day, startTime: '19:30', endTime: '20:30', subject: '', room: '', isBreak: false }
      )
    })
    
    return sortBlocks(blocks)
  }

  // Ordenar bloques
  const sortBlocks = (blocks: ScheduleBlockInput[]): ScheduleBlockInput[] => {
    return [...blocks].sort((a, b) => {
      const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek)
      if (dayDiff !== 0) return dayDiff
      return a.startTime.localeCompare(b.startTime)
    })
  }

  // Validar bloque
  const validateBlock = (block: ScheduleBlockInput): { valid: boolean; error?: string } => {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
    
    if (!timeRegex.test(block.startTime) || !timeRegex.test(block.endTime)) {
      return { valid: false, error: 'Formato de hora inválido (HH:MM)' }
    }

    const [startH, startM] = block.startTime.split(':').map(Number)
    const [endH, endM] = block.endTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    if (startMinutes >= endMinutes) {
      return { valid: false, error: 'La hora de inicio debe ser menor que la de fin' }
    }

    return { valid: true }
  }

  // Verificar solapamiento
  const hasOverlap = (blocks: ScheduleBlockInput[]): { hasOverlap: boolean; conflicts: string[] } => {
    const conflicts: string[] = []
    
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const a = blocks[i]
        const b = blocks[j]
        
        if (a.dayOfWeek !== b.dayOfWeek) continue

        const [aStartH, aStartM] = a.startTime.split(':').map(Number)
        const [aEndH, aEndM] = a.endTime.split(':').map(Number)
        const [bStartH, bStartM] = b.startTime.split(':').map(Number)
        const [bEndH, bEndM] = b.endTime.split(':').map(Number)

        const aStart = aStartH * 60 + aStartM
        const aEnd = aEndH * 60 + aEndM
        const bStart = bStartH * 60 + bStartM
        const bEnd = bEndH * 60 + bEndM

        if (aStart < bEnd && bStart < aEnd) {
          conflicts.push(`${a.dayOfWeek}: ${a.startTime}-${a.endTime} se solapa con ${b.startTime}-${b.endTime}`)
        }
      }
    }

    return { hasOverlap: conflicts.length > 0, conflicts }
  }

  return {
    // Estado
    templates,
    loading,
    error,
    
    // Constantes
    scheduleTypes,
    presetColors,
    dayOrder,
    
    // Acciones
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    cloneTemplate,
    
    // Utilidades
    createBaseBlocks,
    createAfternoonBlocks,
    sortBlocks,
    validateBlock,
    hasOverlap
  }
}
