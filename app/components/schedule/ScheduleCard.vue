<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ScheduleBlock {
  id: string
  dayOfWeek: string
  startTime: string
  endTime: string
  subject: string
  room: string
  isBreak: boolean
}

interface Schedule {
  id: string
  name: string
  type: string
  color: string
  isActive: boolean
  blocks: ScheduleBlock[]
}

const props = defineProps<{
  schedule: Schedule
}>()

const days = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'NORMAL': 'Horario Normal',
    'EXAMENES': 'Exámenes',
    'EXTRAORDINARIO': 'Extraordinario',
    'GUARDIA': 'Guardia',
    'REFUERZO': 'Refuerzo'
  }
  return labels[type] || type
}

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'NORMAL': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
    'EXAMENES': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    'EXTRAORDINARIO': 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',
    'GUARDIA': 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
    'REFUERZO': 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20'
  }
  return colors[type] || 'bg-muted text-muted-foreground'
}

const blocksByDay = (day: string) => {
  return props.schedule.blocks
    .filter(b => b.dayOfWeek === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

const formatTime = (time: string) => time
</script>

<template>
  <Card class="overflow-hidden border-border">
    <CardHeader class="bg-muted/30 px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div 
            class="h-2 w-2 rounded-full" 
            :style="{ backgroundColor: schedule.color || '#3b82f6' }"
          />
          <CardTitle class="text-base font-medium">{{ schedule.name }}</CardTitle>
        </div>
        <div class="flex items-center gap-2">
          <Badge 
            variant="outline" 
            :class="getTypeColor(schedule.type)"
            class="text-xs"
          >
            {{ getTypeLabel(schedule.type) }}
          </Badge>
          <Badge 
            v-if="schedule.isActive" 
            variant="secondary"
            class="text-xs"
          >
            Activo
          </Badge>
        </div>
      </div>
    </CardHeader>
    
    <CardContent class="p-0">
      <div class="grid grid-cols-5 divide-x divide-border">
        <div 
          v-for="day in days" 
          :key="day"
          class="flex flex-col"
        >
          <!-- Cabecera del día -->
          <div class="bg-muted/20 px-2 py-1.5 text-center">
            <span class="text-xs font-medium uppercase text-muted-foreground">
              {{ day.slice(0, 3) }}
            </span>
          </div>
          
          <!-- Bloques del día -->
          <div class="flex-1 space-y-1 p-2">
            <div 
              v-for="block in blocksByDay(day)" 
              :key="block.id"
              :class="[
                'rounded-md p-1.5 text-xs',
                block.isBreak 
                  ? 'bg-muted text-muted-foreground italic' 
                  : 'bg-primary/5 text-foreground border border-primary/10'
              ]"
            >
              <div class="font-medium leading-tight">{{ block.subject }}</div>
              <div class="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                <span>{{ formatTime(block.startTime) }} - {{ formatTime(block.endTime) }}</span>
              </div>
              <div v-if="block.room && block.room !== '-'" class="text-[10px] text-muted-foreground">
                {{ block.room }}
              </div>
            </div>
            
            <div 
              v-if="!blocksByDay(day).length" 
              class="py-4 text-center text-xs text-muted-foreground"
            >
              —
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>