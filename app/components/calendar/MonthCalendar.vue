<script setup lang="ts">
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export interface CalendarDay {
  date: Date
  dateStr: string
  day: number
  isCurrentMonth: boolean
  isToday?: boolean
  isWeekend?: boolean
  isSelected?: boolean
  isInRange?: boolean
  isRangeStart?: boolean
  isRangeEnd?: boolean
  isDisabled?: boolean
  metadata?: any
}

interface Props {
  days: CalendarDay[]
  monthYearLabel: string
  canGoPrev?: boolean
  canGoNext?: boolean
  showRangeMode?: boolean
  isRangeMode?: boolean
  weekDays?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  canGoPrev: true,
  canGoNext: true,
  showRangeMode: false,
  isRangeMode: false,
  weekDays: () => ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
})

const emit = defineEmits<{
  prev: []
  next: []
  'update:rangeMode': [value: boolean]
  'dayClick': [day: CalendarDay]
}>()

const toggleRangeMode = () => {
  emit('update:rangeMode', !props.isRangeMode)
}

const getCellClasses = (day: CalendarDay): string => {
  if (!day.isCurrentMonth) return 'bg-transparent'
  
  const baseClasses = 'relative h-16 border border-border p-1 transition-colors text-center'
  
  if (day.isDisabled) {
    return `${baseClasses} bg-gray-50 text-gray-300 cursor-not-allowed`
  }
  
  if (day.isSelected) {
    return `${baseClasses} bg-primary text-primary-foreground cursor-pointer`
  }
  
  if (day.isInRange) {
    return `${baseClasses} bg-primary/20 cursor-pointer`
  }
  
  return `${baseClasses} bg-white hover:border-primary hover:bg-primary/5 cursor-pointer`
}
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <CardTitle class="text-lg flex items-center gap-2">
          <slot name="title">
            <CalendarIcon class="h-5 w-5" />
            Seleccionar Fechas
          </slot>
        </CardTitle>
        <div class="flex items-center gap-2">
          <div v-if="showRangeMode" class="flex items-center gap-2 mr-4">
            <Switch 
              :checked="isRangeMode" 
              @update:checked="toggleRangeMode"
            />
            <Label class="text-sm">Seleccionar rango</Label>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            class="h-8 w-8"
            @click="emit('prev')"
            :disabled="!canGoPrev"
          >
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <span class="font-medium capitalize min-w-[140px] text-center">{{ monthYearLabel }}</span>
          <Button 
            variant="outline" 
            size="icon" 
            class="h-8 w-8"
            @click="emit('next')"
            :disabled="!canGoNext"
          >
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
          v-for="(day, index) in days" 
          :key="index"
          :class="getCellClasses(day)"
          @click="!day.isDisabled && day.isCurrentMonth && emit('dayClick', day)"
        >
          <template v-if="day.isCurrentMonth">
            <span class="text-sm font-medium">{{ day.day }}</span>
            
            <!-- Slot para contenido personalizado -->
            <slot name="dayContent" :day="day">
              <div v-if="day.isSelected" class="mt-1">
                <CheckCircle class="w-3 h-3 mx-auto" />
              </div>
            </slot>
          </template>
        </div>
      </div>
      
      <!-- Leyenda -->
      <div class="flex flex-wrap gap-4 mt-4 text-sm border-t pt-4">
        <slot name="legend">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-primary rounded"></div>
            <span>Seleccionado</span>
          </div>
        </slot>
      </div>
    </CardContent>
  </Card>
</template>
