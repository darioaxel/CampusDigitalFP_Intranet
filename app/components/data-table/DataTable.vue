<script setup lang="ts" generic="TData, TValue">
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  PaginationState,
  ExpandedState,
} from '@tanstack/vue-table'
import {
  FlexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  useVueTable,
} from '@tanstack/vue-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { valueUpdater } from '@/lib/utils'
import { ref } from 'vue'
import DataTablePagination from './DataTablePagination.vue'

const props = defineProps<{
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  manualPagination?: boolean
  pageCount?: number
  rowCount?: number
  enableRowSelection?: boolean
  enableExpanding?: boolean
}>()

const emit = defineEmits<{
  'pagination-change': [state: PaginationState]
  'sorting-change': [state: SortingState]
  'filter-change': [state: ColumnFiltersState]
  'row-selection-change': [state: RowSelectionState]
  'row-click': [row: TData]
}>()

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref<RowSelectionState>({})
const expanded = ref<ExpandedState>({})
const pagination = ref<PaginationState>({
  pageIndex: 0,
  pageSize: 10,
})

const table = useVueTable({
  get data() { return props.data },
  get columns() { return props.columns },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: props.manualPagination ? undefined : getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: props.enableExpanding ? getExpandedRowModel() : undefined,

  // Modo manual para server-side
  manualPagination: props.manualPagination,
  manualSorting: props.manualPagination,
  manualFiltering: props.manualPagination,

  pageCount: props.pageCount,
  rowCount: props.rowCount,

  onSortingChange: (updater) => {
    valueUpdater(updater, sorting)
    emit('sorting-change', sorting.value)
  },
  onColumnFiltersChange: (updater) => {
    valueUpdater(updater, columnFilters)
    emit('filter-change', columnFilters.value)
  },
  onColumnVisibilityChange: (updater) => valueUpdater(updater, columnVisibility),
  onRowSelectionChange: (updater) => {
    valueUpdater(updater, rowSelection)
    emit('row-selection-change', rowSelection.value)
  },
  onExpandedChange: (updater) => valueUpdater(updater, expanded),
  onPaginationChange: (updater) => {
    valueUpdater(updater, pagination)
    emit('pagination-change', pagination.value)
  },

  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
    get rowSelection() { return rowSelection.value },
    get expanded() { return expanded.value },
    get pagination() { return pagination.value },
  },
})

// Exponer instancia para acceso externo
defineExpose({ table })
</script>

<template>
  <div class="space-y-4">
    <!-- Tabla -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :class="header.column.columnDef.meta?.className"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <template
              v-for="row in table.getRowModel().rows"
              :key="row.id"
            >
              <TableRow
                :data-state="row.getIsSelected() ? 'selected' : undefined"
                :class="[row.getIsExpanded() && 'bg-muted/50', 'cursor-pointer hover:bg-muted/30']"
                @click="$emit('row-click', row.original)"
              >
                <TableCell
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  :class="cell.column.columnDef.meta?.className"
                >
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </TableCell>
              </TableRow>

              <!-- Fila expandida -->
              <TableRow v-if="row.getIsExpanded()">
                <TableCell :colspan="row.getAllCells().length">
                  <slot name="expanded" :row="row" />
                </TableCell>
              </TableRow>
            </template>
          </template>

          <template v-else>
            <TableRow>
              <TableCell
                :colspan="columns.length"
                class="h-24 text-center"
              >
                No hay resultados.
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- Paginación -->
    <DataTablePagination :table="table" />
  </div>
</template>
