<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import { X, SlidersHorizontal } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Props {
  table: Table<any>
  filterColumn?: string
  filterPlaceholder?: string
  showViewOptions?: boolean
}

withDefaults(defineProps<Props>(), {
  filterColumn: '',
  filterPlaceholder: 'Filtrar...',
  showViewOptions: true,
})

const emit = defineEmits<{
  'filter-change': [value: string]
}>()
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-1 items-center gap-2">
      <!-- Input de filtro global -->
      <Input
        v-if="filterColumn"
        :model-value="(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ''"
        class="h-8 w-[150px] lg:w-[250px]"
        :placeholder="filterPlaceholder"
        @update:model-value="table.getColumn(filterColumn)?.setFilterValue($event)"
      />

      <!-- Botón para resetear filtros -->
      <Button
        v-if="table.getState().columnFilters.length > 0 || table.getState().globalFilter"
        variant="ghost"
        size="sm"
        class="h-8 px-2 lg:px-3"
        @click="table.resetColumnFilters()"
      >
        <X class="mr-2 h-4 w-4" />
        Limpiar filtros
      </Button>

      <!-- Slot para filtros personalizados -->
      <slot name="filters" />
    </div>

    <!-- Selector de columnas visibles -->
    <DropdownMenu v-if="showViewOptions">
      <DropdownMenuTrigger as-child>
        <Button
          variant="outline"
          size="sm"
          class="ml-auto hidden h-8 lg:flex"
        >
          <SlidersHorizontal class="mr-2 h-4 w-4" />
          Ver
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-[150px]">
        <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          v-for="column in table.getAllColumns().filter((col) => col.getCanHide())"
          :key="column.id"
          class="capitalize"
          :model-value="column.getIsVisible()"
          @update:model-value="(value) => column.toggleVisibility(!!value)"
        >
          {{ column.columnDef.header || column.id }}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- Slot adicional para acciones -->
    <slot name="actions" />
  </div>
</template>
