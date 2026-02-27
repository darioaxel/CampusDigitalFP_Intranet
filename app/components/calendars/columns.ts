import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader.vue'
import CalendarRowActions from './CalendarRowActions.vue'

// Tipo extendido del calendario con relaciones
export interface CalendarWithRelations {
  id: string
  name: string
  description: string | null
  type: 'SCHOOL_YEAR' | 'EVALUATION' | 'FREE_DISPOSITION' | 'MEETINGS' | 'TEMPLATE' | 'OTHER'
  academicYear: string
  startDate: string
  endDate: string
  isActive: boolean
  isPublic: boolean
  allowDragDrop: boolean
  maxEventsPerUser: number | null
  createdById: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  _count?: {
    events: number
  }
  createdAt: string
  updatedAt: string
}

// Helpers para formatear
export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'SCHOOL_YEAR': 'Escolar',
    'EVALUATION': 'Evaluaciones',
    'FREE_DISPOSITION': 'Libre Disp.',
    'MEETINGS': 'Reuniones',
    'TEMPLATE': 'Plantilla',
    'OTHER': 'Otros',
  }
  return labels[type] || type
}

export function getTypeVariant(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'SCHOOL_YEAR': 'default',
    'EVALUATION': 'secondary',
    'FREE_DISPOSITION': 'outline',
    'MEETINGS': 'destructive',
    'TEMPLATE': 'secondary',
    'OTHER': 'secondary',
  }
  return variants[type] || 'default'
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Mapa de nombres de columnas para el selector de visibilidad
export const columnNames: Record<string, string> = {
  'name': 'Nombre',
  'type': 'Tipo',
  'academicYear': 'Año',
  'startDate': 'Período',
  'eventsCount': 'Eventos',
  'createdByName': 'Creado por',
  'isActive': 'Activo',
}

// Columnas de la tabla
export const columns: ColumnDef<CalendarWithRelations>[] = [
  // Nombre
  {
    accessorKey: 'name',
    header: ({ column }) => h(DataTableColumnHeader, {
      column,
      title: 'Nombre',
    }),
    cell: ({ row }) => h('div', { class: 'space-y-0.5' }, [
      h('div', { class: 'font-medium' }, row.getValue('name')),
      h('div', { class: 'text-xs text-muted-foreground truncate max-w-[250px]' },
        row.original.description || 'Sin descripción'
      ),
    ]),
  },

  // Tipo
  {
    accessorKey: 'type',
    header: ({ column }) => h(DataTableColumnHeader, {
      column,
      title: 'Tipo',
    }),
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      return h(Badge, { variant: getTypeVariant(type) }, () => getTypeLabel(type))
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },

  // Año Académico
  {
    accessorKey: 'academicYear',
    header: ({ column }) => h(DataTableColumnHeader, {
      column,
      title: 'Año',
    }),
    cell: ({ row }) => h('div', { class: 'text-sm' }, row.getValue('academicYear')),
  },

  // Fechas
  {
    accessorKey: 'startDate',
    header: ({ column }) => h(DataTableColumnHeader, {
      column,
      title: 'Período',
    }),
    cell: ({ row }) => h('div', { class: 'text-sm whitespace-nowrap' }, [
      h('span', {}, formatDate(row.original.startDate)),
      h('span', { class: 'text-muted-foreground mx-1' }, '→'),
      h('span', {}, formatDate(row.original.endDate)),
    ]),
  },

  // Eventos
  {
    accessorKey: '_count.events',
    id: 'eventsCount',
    header: ({ column }) => h(DataTableColumnHeader, {
      column,
      title: 'Eventos',
    }),
    cell: ({ row }) => h('div', { class: 'text-center font-medium' },
      String(row.original._count?.events || 0)
    ),
  },

  // Creado por
  {
    accessorKey: 'createdBy',
    id: 'createdByName',
    header: ({ column }) => h(DataTableColumnHeader, {
      column,
      title: 'Creado por',
    }),
    cell: ({ row }) => {
      const createdBy = row.original.createdBy
      if (!createdBy) return h('div', { class: 'text-muted-foreground text-sm' }, '-')
      return h('div', { class: 'text-sm' }, `${createdBy.firstName} ${createdBy.lastName}`)
    },
  },

  // Estado Activo (con switch)
  {
    accessorKey: 'isActive',
    header: ({ column }) => h(DataTableColumnHeader, {
      column,
      title: 'Activo',
    }),
    cell: ({ row }) => h(Switch, {
      'modelValue': row.getValue('isActive'),
      'onUpdate:modelValue': () => {
        // Emitir evento para manejar el cambio en el componente padre
        row.original.isActive = !row.original.isActive
      },
      'class': 'data-[state=checked]:bg-amber-400 data-[state=unchecked]:bg-gray-200',
    }),
    enableSorting: false,
  },

  // Acciones
  {
    id: 'actions',
    header: () => h('div', { class: 'text-right' }, 'Acciones'),
    cell: ({ row }) => h(CalendarRowActions, {
      calendar: row.original,
      onEdit: (calendar) => {
        // Emitir evento que se manejará en el componente padre
        const event = new CustomEvent('calendar:edit', { detail: calendar })
        document.dispatchEvent(event)
      },
      onDelete: (calendar) => {
        const event = new CustomEvent('calendar:delete', { detail: calendar })
        document.dispatchEvent(event)
      },
      onClone: (calendar) => {
        const event = new CustomEvent('calendar:clone', { detail: calendar })
        document.dispatchEvent(event)
      },
      onToggleActive: (calendar) => {
        const event = new CustomEvent('calendar:toggle-active', { detail: calendar })
        document.dispatchEvent(event)
      },
    }),
    enableSorting: false,
    enableHiding: false,
  },
]
