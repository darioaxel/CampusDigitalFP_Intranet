<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  table: Table<any>
}

defineProps<Props>()
</script>

<template>
  <div class="flex items-center justify-between px-2">
    <!-- Contador de selección -->
    <div class="flex-1 text-sm text-muted-foreground">
      {{ table.getFilteredSelectedRowModel().rows.length }} de
      {{ table.getFilteredRowModel().rows.length }} fila(s) seleccionadas.
    </div>

    <div class="flex items-center space-x-6 lg:space-x-8">
      <!-- Selector de tamaño de página -->
      <div class="flex items-center space-x-2">
        <p class="text-sm font-medium">Filas por página</p>
        <Select
          :model-value="`${table.getState().pagination.pageSize}`"
          @update:model-value="table.setPageSize(Number($event))"
        >
          <SelectTrigger class="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem
              v-for="pageSize in [10, 20, 30, 40, 50]"
              :key="pageSize"
              :value="`${pageSize}`"
            >
              {{ pageSize }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Contador de página -->
      <div class="flex w-[100px] items-center justify-center text-sm font-medium">
        Página {{ table.getState().pagination.pageIndex + 1 }} de
        {{ table.getPageCount() }}
      </div>

      <!-- Botones de navegación -->
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="!table.getCanPreviousPage()"
          @click="table.setPageIndex(0)"
        >
          <span class="sr-only">Primera página</span>
          <ChevronsLeft class="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          <span class="sr-only">Página anterior</span>
          <ChevronLeft class="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          <span class="sr-only">Página siguiente</span>
          <ChevronRight class="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="!table.getCanNextPage()"
          @click="table.setPageIndex(table.getPageCount() - 1)"
        >
          <span class="sr-only">Última página</span>
          <ChevronsRight class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
