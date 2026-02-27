import type { CalendarMonthEvent } from '~/components/calendar/CalendarMonthCard.vue'

/**
 * Tipos para las operaciones de calendario
 */
export interface CalendarEventPayload {
  title: string
  description?: string
  type: 'HOLIDAY' | 'LECTIVE' | 'EVALUATION' | 'FREE_DISPOSITION' | 'MEETING' | 'DEADLINE' | 'OTHER'
  startDate: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  isAllDay?: boolean
  startTime?: string
  endTime?: string
  color?: string
  maxAssignments?: number
  isActive?: boolean
}

export interface DateRange {
  start: string
  end: string
}

/**
 * Composable para gestionar operaciones de API de calendarios
 * 
 * @example
 * ```typescript
 * const { createEvent, deleteEvent, isLoading, error } = useCalendarApi(calendarId)
 * 
 * await createEvent({
 *   title: 'Festivo',
 *   type: 'HOLIDAY',
 *   startDate: '2024-09-15'
 * })
 * ```
 */
export function useCalendarApi(calendarId: string | Ref<string>) {
  const id = computed(() => unref(calendarId))
  
  // Estado
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  /**
   * Crea un nuevo evento en el calendario
   */
  async function createEvent(payload: CalendarEventPayload): Promise<CalendarMonthEvent | null> {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await $fetch(`/api/calendars/${id.value}/events`, {
        method: 'POST',
        body: payload
      })
      
      return response?.data || null
    } catch (err: any) {
      error.value = err.data?.message || 'Error al crear el evento'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Actualiza un evento existente
   */
  async function updateEvent(eventId: string, payload: Partial<CalendarEventPayload>): Promise<CalendarMonthEvent | null> {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await $fetch(`/api/calendars/${id.value}/events/${eventId}`, {
        method: 'PUT',
        body: payload
      })
      
      return response?.data || null
    } catch (err: any) {
      error.value = err.data?.message || 'Error al actualizar el evento'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Elimina un evento
   */
  async function deleteEvent(eventId: string): Promise<void> {
    isLoading.value = true
    error.value = null
    
    try {
      await $fetch(`/api/calendars/${id.value}/events/${eventId}`, {
        method: 'DELETE'
      })
    } catch (err: any) {
      error.value = err.data?.message || 'Error al eliminar el evento'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Crea múltiples eventos festivos a partir de rangos de fechas
   */
  async function createHolidayEvents(ranges: DateRange[]): Promise<CalendarMonthEvent[]> {
    isLoading.value = true
    error.value = null
    
    const created: CalendarMonthEvent[] = []
    
    try {
      for (const range of ranges) {
        const event = await createEvent({
          title: 'Festivo',
          type: 'HOLIDAY',
          startDate: range.start,
          endDate: range.end,
          isAllDay: true,
          color: '#EF4444',
          isActive: true
        })
        if (event) created.push(event)
      }
      
      return created
    } catch (err: any) {
      error.value = err.data?.message || 'Error al crear los festivos'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Crea múltiples eventos de evaluación/exámenes a partir de rangos de fechas
   */
  async function createExamEvents(
    ranges: DateRange[],
    examType: string,
    description?: string
  ): Promise<CalendarMonthEvent[]> {
    isLoading.value = true
    error.value = null
    
    const created: CalendarMonthEvent[] = []
    
    try {
      for (const range of ranges) {
        const event = await createEvent({
          title: `Evaluación: ${examType}`,
          description,
          type: 'EVALUATION',
          startDate: range.start,
          endDate: range.end,
          isAllDay: true,
          color: '#F59E0B',
          isActive: true
        })
        if (event) created.push(event)
      }
      
      return created
    } catch (err: any) {
      error.value = err.data?.message || 'Error al crear los periodos de evaluación'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Elimina eventos por sus IDs
   */
  async function deleteEvents(eventIds: string[]): Promise<void> {
    isLoading.value = true
    error.value = null
    
    try {
      for (const eventId of eventIds) {
        await deleteEvent(eventId)
      }
    } catch (err: any) {
      error.value = err.data?.message || 'Error al eliminar los eventos'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Limpia el error actual
   */
  function clearError() {
    error.value = null
  }
  
  return {
    // Estado
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Operaciones
    createEvent,
    updateEvent,
    deleteEvent,
    createHolidayEvents,
    createExamEvents,
    deleteEvents,
    clearError
  }
}

/**
 * Composable para obtener datos de calendario con useFetch
 * 
 * @example
 * ```typescript
 * const { calendar, events, pending, refresh } = useCalendarData(calendarId)
 * ```
 */
export function useCalendarData(calendarId: string | Ref<string>) {
  const id = computed(() => unref(calendarId))
  
  const { data, pending, error, refresh } = useFetch(() => `/api/calendars/${id.value}`, {
    watch: [id]
  })
  
  const calendar = computed(() => data.value?.data)
  const events = computed<CalendarMonthEvent[]>(() => calendar.value?.events || [])
  
  return {
    calendar: readonly(calendar),
    events: readonly(events),
    pending: readonly(pending),
    error: readonly(error),
    refresh
  }
}

/**
 * Composable para listar calendarios
 */
export function useCalendarsList(options: {
  type?: Ref<string | undefined>
  academicYear?: Ref<string | undefined>
  isActive?: Ref<string | undefined>
} = {}) {
  const { type, academicYear, isActive } = options
  
  const params = computed(() => {
    const searchParams = new URLSearchParams()
    if (type?.value) searchParams.append('type', type.value)
    if (academicYear?.value) searchParams.append('academicYear', academicYear.value)
    if (isActive?.value !== undefined) searchParams.append('isActive', isActive.value)
    return searchParams.toString()
  })
  
  const { data, pending, error, refresh } = useFetch(() => {
    const queryString = params.value
    return `/api/calendars${queryString ? `?${queryString}` : ''}`
  }, {
    watch: [params]
  })
  
  const calendars = computed(() => data.value?.data || [])
  
  return {
    calendars: readonly(calendars),
    pending: readonly(pending),
    error: readonly(error),
    refresh
  }
}

/**
 * Composable para gestionar plantillas de calendarios
 */
export function useCalendarTemplates() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  const { data, pending, refresh } = useFetch('/api/calendars/templates', {
    immediate: false
  })
  
  const templates = computed(() => data.value?.data || [])
  
  /**
   * Clona una plantilla para crear un nuevo calendario
   */
  async function cloneTemplate(
    templateId: string,
    payload: {
      name: string
      description?: string
      academicYear: string
      startDate: string
      endDate: string
      type: string
      isPublic?: boolean
      allowDragDrop?: boolean
      maxEventsPerUser?: number | null
    }
  ): Promise<void> {
    isLoading.value = true
    error.value = null
    
    try {
      await $fetch(`/api/calendars/templates/${templateId}/clone`, {
        method: 'POST',
        body: payload
      })
    } catch (err: any) {
      error.value = err.data?.message || 'Error al clonar la plantilla'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  return {
    templates: readonly(templates),
    pending: readonly(pending),
    isLoading: readonly(isLoading),
    error: readonly(error),
    refresh,
    cloneTemplate
  }
}

/**
 * Payload para crear/actualizar un calendario
 */
export interface CalendarPayload {
  name: string
  description?: string
  type: string
  academicYear: string
  startDate: string
  endDate: string
  isPublic?: boolean
  allowDragDrop?: boolean
  maxEventsPerUser?: number | null
  isActive?: boolean
}

/**
 * Composable para gestionar el CRUD completo de calendarios
 * 
 * @example
 * ```typescript
 * const { createCalendar, updateCalendar, deleteCalendar, isLoading } = useCalendarCrud()
 * ```
 */
export function useCalendarCrud() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  /**
   * Crea un nuevo calendario
   */
  async function createCalendar(payload: CalendarPayload): Promise<any> {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await $fetch('/api/calendars', {
        method: 'POST',
        body: payload
      })
      return response?.data
    } catch (err: any) {
      error.value = err.data?.message || 'Error al crear el calendario'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Actualiza un calendario existente
   */
  async function updateCalendar(calendarId: string, payload: Partial<CalendarPayload>): Promise<any> {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await $fetch(`/api/calendars/${calendarId}`, {
        method: 'PUT',
        body: payload
      })
      return response?.data
    } catch (err: any) {
      error.value = err.data?.message || 'Error al actualizar el calendario'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Elimina un calendario
   */
  async function deleteCalendar(calendarId: string): Promise<void> {
    isLoading.value = true
    error.value = null
    
    try {
      await $fetch(`/api/calendars/${calendarId}`, {
        method: 'DELETE'
      })
    } catch (err: any) {
      error.value = err.data?.message || 'Error al eliminar el calendario'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Activa o desactiva un calendario
   */
  async function toggleCalendarActive(calendarId: string, isActive: boolean): Promise<void> {
    isLoading.value = true
    error.value = null
    
    try {
      await $fetch(`/api/calendars/${calendarId}`, {
        method: 'PUT',
        body: { isActive }
      })
    } catch (err: any) {
      error.value = err.data?.message || 'Error al cambiar el estado del calendario'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  function clearError() {
    error.value = null
  }
  
  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    createCalendar,
    updateCalendar,
    deleteCalendar,
    toggleCalendarActive,
    clearError
  }
}
