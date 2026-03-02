import type { ColumnDef } from '@tanstack/vue-table'
import { h, resolveComponent } from 'vue'
import { Badge } from '@/components/ui/badge'
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader.vue'
import type { WorkflowItem, GetItemUrlFn } from './columns'
export { formatSubType, getSubTypeColor, getStatusVariant } from './columns'

// Mapa de nombres de columnas para admin
export const adminColumnNames: Record<string, string> = {
  'type': 'Tipo',
  'subType': 'Tipo específico',
  'title': 'Título',
  'createdBy': 'Solicitante',
  'createdAt': 'Fecha',
  'status': 'Estado',
  'completedAt': 'Resuelto',
}

// Columnas de la tabla para admin (con columna completedAt opcional)
export function getAdminColumns(showCompletedAt: boolean = false, getItemUrl?: GetItemUrlFn): ColumnDef<WorkflowItem>[] {
  const NuxtLink = resolveComponent('NuxtLink')
  const baseColumns: ColumnDef<WorkflowItem>[] = [
    // Tipo (Solicitud/Tarea)
    {
      accessorKey: 'type',
      header: ({ column }) => h(DataTableColumnHeader, {
        column,
        title: 'Tipo',
      }),
      cell: ({ row }) => {
        const type = row.getValue('type') as string
        const isRequest = type === 'Solicitud'
        return h(Badge, { 
          variant: isRequest ? 'default' : 'secondary',
          class: 'w-fit'
        }, () => type)
      },
      filterFn: (row, id, value) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return true
        return (value as string[]).includes(row.getValue(id))
      },
    },

    // Tipo específico
    {
      accessorKey: 'subType',
      header: ({ column }) => h(DataTableColumnHeader, {
        column,
        title: 'Tipo específico',
      }),
      cell: ({ row }) => {
        const subType = row.getValue('subType') as string
        const color = getSubTypeColor(subType)
        return h(Badge, { 
          style: { backgroundColor: color, color: '#fff' },
          class: 'w-fit whitespace-nowrap'
        }, () => formatSubType(subType))
      },
      filterFn: (row, id, value) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return true
        return (value as string[]).includes(row.getValue(id))
      },
    },

    // Título (con link si se proporciona getItemUrl)
    {
      accessorKey: 'title',
      header: ({ column }) => h(DataTableColumnHeader, {
        column,
        title: 'Título',
      }),
      cell: ({ row }) => {
        const title = row.getValue('title') as string
        const item = row.original
        const url = getItemUrl?.(item)
        
        if (url) {
          return h(NuxtLink, { 
            to: url,
            class: 'font-medium max-w-[250px] truncate text-primary hover:underline block',
            title: title
          }, () => title)
        }
        
        return h('div', { 
          class: 'font-medium max-w-[250px] truncate',
          title: title
        }, title)
      },
    },

    // Solicitante
    {
      accessorKey: 'createdBy',
      header: ({ column }) => h(DataTableColumnHeader, {
        column,
        title: 'Solicitante',
      }),
      cell: ({ row }) => h('div', { class: 'text-sm' }, row.getValue('createdBy')),
      filterFn: (row, id, value) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return true
        return (value as string[]).includes(row.getValue(id))
      },
    },

    // Fecha
    {
      accessorKey: 'createdAt',
      header: ({ column }) => h(DataTableColumnHeader, {
        column,
        title: 'Fecha',
      }),
      cell: ({ row }) => h('div', { class: 'text-sm text-muted-foreground whitespace-nowrap' }, 
        row.getValue('createdAt')
      ),
    },

    // Estado
    {
      accessorKey: 'status',
      header: ({ column }) => h(DataTableColumnHeader, {
        column,
        title: 'Estado',
      }),
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return h(Badge, { 
          variant: getStatusVariant(status),
          class: 'w-fit whitespace-nowrap'
        }, () => status)
      },
      filterFn: (row, id, value) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return true
        return (value as string[]).includes(row.getValue(id))
      },
    },
  ]

  // Columna de completado (solo para historial)
  if (showCompletedAt) {
    baseColumns.push({
      accessorKey: 'completedAt',
      header: ({ column }) => h(DataTableColumnHeader, {
        column,
        title: 'Resuelto',
      }),
      cell: ({ row }) => {
        const completedAt = row.getValue('completedAt') as string | null
        if (completedAt && completedAt !== '-') {
          return h('span', { class: 'text-sm text-green-600 whitespace-nowrap' }, completedAt)
        }
        return h('span', { class: 'text-sm text-muted-foreground' }, '-')
      },
    })
  }

  return baseColumns
}

// Importar funciones del columns.ts original
import { formatSubType, getSubTypeColor, getStatusVariant } from './columns'
