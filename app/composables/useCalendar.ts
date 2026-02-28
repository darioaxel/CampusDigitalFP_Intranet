// composables/useCalendar.ts
// Composable reutilizable para calendarios de selección de fechas

import { format, startOfMonth, endOfMonth, startOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

export interface CalendarDay {
  date: Date
  dateStr: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
}

export interface CalendarOptions {
  minDate?: Date | null
  maxDate?: Date | null
  selectedDates?: Date[]
  rangeStart?: Date | null
  rangeEnd?: Date | null
  isRangeMode?: boolean
  disabledDates?: string[]
  markedDates?: Map<string, any>
}

export function useCalendar(initialDate: Date = new Date()) {
  const currentDate = ref(initialDate)
  const selectedDates = ref<Date[]>([])
  const rangeStart = ref<Date | null>(null)
  const rangeEnd = ref<Date | null>(null)
  const isRangeMode = ref(false)

  // Navegación
  const monthYearLabel = computed(() => {
    return format(currentDate.value, 'MMMM yyyy', { locale: es })
  })

  const canGoPrevMonth = computed(() => {
    // Implementar según necesidades
    return true
  })

  const canGoNextMonth = computed(() => {
    // Implementar según necesidades
    return true
  })

  const prevMonth = () => {
    currentDate.value = subMonths(currentDate.value, 1)
  }

  const nextMonth = () => {
    currentDate.value = addMonths(currentDate.value, 1)
  }

  // Generar días del calendario
  const generateCalendarDays = (options: CalendarOptions = {}): CalendarDay[] => {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    
    const firstDayOfMonth = startOfMonth(new Date(year, month, 1))
    const lastDayOfMonth = endOfMonth(new Date(year, month, 1))
    
    // Ajustar para que empiece en lunes (0 = lunes en nuestra lógica)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1
    if (startDayOfWeek < 0) startDayOfWeek = 6
    
    const startDate = addDays(firstDayOfMonth, -startDayOfWeek)
    const days: CalendarDay[] = []
    
    // Generar 42 días (6 semanas)
    for (let i = 0; i < 42; i++) {
      const date = addDays(startDate, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      
      days.push({
        date,
        dateStr,
        day: date.getDate(),
        isCurrentMonth: isSameMonth(date, currentDate.value),
        isToday: isSameDay(date, new Date()),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      })
    }
    
    return days
  }

  // Selección de fechas
  const toggleDateSelection = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const index = selectedDates.value.findIndex(d => format(d, 'yyyy-MM-dd') === dateStr)
    
    if (index > -1) {
      selectedDates.value.splice(index, 1)
    } else {
      selectedDates.value.push(date)
    }
  }

  const selectRange = (date: Date) => {
    if (!rangeStart.value || (rangeStart.value && rangeEnd.value)) {
      // Iniciar nuevo rango
      rangeStart.value = date
      rangeEnd.value = null
      selectedDates.value = [date]
    } else {
      // Completar rango
      const start = rangeStart.value
      const end = date
      
      if (end < start) {
        rangeEnd.value = start
        rangeStart.value = end
      } else {
        rangeEnd.value = end
      }
      
      // Generar array de fechas en el rango
      const dates: Date[] = []
      let current = new Date(rangeStart.value!)
      const rangeEndDate = rangeEnd.value!
      
      while (current <= rangeEndDate) {
        dates.push(new Date(current))
        current.setDate(current.getDate() + 1)
      }
      
      selectedDates.value = dates
    }
  }

  const handleDayClick = (date: Date, isRangeMode: boolean = false) => {
    if (isRangeMode) {
      selectRange(date)
    } else {
      toggleDateSelection(date)
    }
  }

  const clearSelection = () => {
    selectedDates.value = []
    rangeStart.value = null
    rangeEnd.value = null
  }

  const isDateSelected = (date: Date): boolean => {
    return selectedDates.value.some(d => isSameDay(d, date))
  }

  const isDateInRange = (date: Date): boolean => {
    if (!rangeStart.value || !rangeEnd.value) return false
    return date >= rangeStart.value && date <= rangeEnd.value
  }

  const isRangeStart = (date: Date): boolean => {
    if (!rangeStart.value) return false
    return isSameDay(date, rangeStart.value)
  }

  const isRangeEnd = (date: Date): boolean => {
    if (!rangeEnd.value) return false
    return isSameDay(date, rangeEnd.value)
  }

  const selectedDatesText = computed(() => {
    if (selectedDates.value.length === 0) return 'Ninguna fecha seleccionada'
    if (selectedDates.value.length === 1) {
      return format(selectedDates.value[0]!, "d 'de' MMMM 'de' yyyy", { locale: es })
    }
    const sorted = [...selectedDates.value].sort((a, b) => a.getTime() - b.getTime())
    const first = format(sorted[0]!, "d 'de' MMMM", { locale: es })
    const last = format(sorted[sorted.length - 1]!, "d 'de' MMMM 'de' yyyy", { locale: es })
    return `${first} al ${last}`
  })

  return {
    // Estado
    currentDate,
    selectedDates,
    rangeStart,
    rangeEnd,
    isRangeMode,
    
    // Computed
    monthYearLabel,
    canGoPrevMonth,
    canGoNextMonth,
    selectedDatesText,
    
    // Métodos
    prevMonth,
    nextMonth,
    generateCalendarDays,
    handleDayClick,
    toggleDateSelection,
    selectRange,
    clearSelection,
    isDateSelected,
    isDateInRange,
    isRangeStart,
    isRangeEnd,
  }
}
