<script setup lang="ts">
import { MoreHorizontal, Copy, Pencil, CalendarDays, Trash2, Power, PowerOff } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CalendarWithRelations } from './columns'

interface Props {
  calendar: CalendarWithRelations
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'edit': [calendar: CalendarWithRelations]
  'delete': [calendar: CalendarWithRelations]
  'clone': [calendar: CalendarWithRelations]
  'toggle-active': [calendar: CalendarWithRelations]
}>()

const isTemplate = props.calendar.type === 'TEMPLATE'
</script>

<template>
  <div class="flex items-center justify-end gap-1">
    <!-- Botón clonar (solo para plantillas) -->
    <Button
      v-if="isTemplate"
      variant="ghost"
      size="icon"
      class="h-8 w-8"
      @click="$emit('clone', calendar)"
      title="Clonar plantilla"
    >
      <Copy class="h-4 w-4" />
    </Button>

    <!-- Botón editar -->
    <Button
      variant="ghost"
      size="icon"
      class="h-8 w-8"
      @click="$emit('edit', calendar)"
      title="Editar calendario"
    >
      <Pencil class="h-4 w-4" />
    </Button>

    <!-- Botón gestionar días -->
    <Button
      variant="ghost"
      size="icon"
      class="h-8 w-8"
      as-child
      title="Gestionar días y eventos"
    >
      <NuxtLink :to="`/admin/calendarios/${calendar.id}/dias`">
        <CalendarDays class="h-4 w-4" />
      </NuxtLink>
    </Button>

    <!-- Dropdown con más acciones -->
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
        >
          <MoreHorizontal class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem @click="$emit('toggle-active', calendar)">
          <Power v-if="!calendar.isActive" class="mr-2 h-4 w-4 text-green-500" />
          <PowerOff v-else class="mr-2 h-4 w-4 text-amber-500" />
          {{ calendar.isActive ? 'Desactivar' : 'Activar' }}
        </DropdownMenuItem>

        <DropdownMenuItem
          v-if="isTemplate"
          @click="$emit('clone', calendar)"
        >
          <Copy class="mr-2 h-4 w-4" />
          Clonar plantilla
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          class="text-destructive focus:text-destructive"
          @click="$emit('delete', calendar)"
        >
          <Trash2 class="mr-2 h-4 w-4" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
