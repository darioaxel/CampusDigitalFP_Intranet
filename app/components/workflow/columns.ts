import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import { Badge } from '@/components/ui/badge'
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader.vue'

// Tipo de item workflow
export interface WorkflowItem {
  id: string
  type: 'Solicitud' | 'Tarea'
  subType: string
  title: string
  createdAt: string
  createdBy: string
  status: string
  statusCode: string
  statusColor: string
  completedAt: string | null
  role: 'Creador' | 'Validador' | 'Asignado'
}

// Mapa de nombres de columnas
export const columnNames: Record<string, string> = {
  'type': 'Tipo',
  'subType': 'Tipo específico',
  'title': 'Título',
  'createdBy': 'Creado por',
  'createdAt': 'Fecha creación',
  'status': 'Estado',
  'completedAt': 'Finalización',
  'role': 'Mi rol',
}

// Helpers
export function formatSubType(subType: string): string {
  const types: Record<string, string> = {
    // Request types
    FREE_DAY: 'Día libre',
    MEDICAL_APPOINTMENT: 'Médica',
    LEAVE: 'Permiso',
    TRAINING: 'Formación',
    OTHER: 'Otro',
    NEW_USER: 'Nuevo usuario',
    SCHEDULE_VALIDATION: 'Validación horario',
    // Task types
    SYLLABUS_CREATION: 'Programación',
    MEETING: 'Reunión',
    VOTE: 'Votación',
    REVIEW: 'Revisión',
  }
  return types[subType] || subType
}

export function getSubTypeColor(subType: string): string {
  const colors: Record<string, string> = {
    // Request types - tonos azules/verdes
    FREE_DAY: '#3b82f6',
    MEDICAL_APPOINTMENT: '#06b6d4',
    LEAVE: '#8b5cf6',
    TRAINING: '#10b981',
    OTHER: '#6b7280',
    NEW_USER: '#f59e0b',
    SCHEDULE_VALIDATION: '#ec4899',
    // Task types - tonos naranjas/rojos
    SYLLABUS_CREATION: '#ef4444',
    MEETING: '#6366f1',
    VOTE: '#14b8a6',
    REVIEW: '#f97316',
  }
  return colors[subType] || '#6b7280'
}

export function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    // Estados comunes de workflow
    'Pendiente': 'secondary',
    'Por hacer': 'secondary',
    'En progreso': 'outline',
    'En revisión': 'outline',
    // Estados finales positivos
    'Aprobado': 'default',
    'Aprobada': 'default',
    'Completada': 'default',
    'Completado': 'default',
    'Validada': 'default',
    // Estados finales negativos
    'Rechazado': 'destructive',
    'Rechazada': 'destructive',
    'Cancelado': 'destructive',
    'Cancelada': 'destructive',
  }
  return variants[status] || 'outline'
}

export function parseDate(dateStr: string): Date {
  // Parsear formato DD/MM/YYYY o similar
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number)
    return new Date(year, month - 1, day)
  }
  // Fallback: intentar parseo directo
  return new Date(dateStr)
}

// Columnas de la tabla
export const columns: ColumnDef<WorkflowItem>[] = [
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

  // Título
  {
    accessorKey: 'title',
    header: ({ column }) => h(DataTableColumnHeader, {
      column,
      title: 'Título',
    }),
    cell: ({ row }) => {
      const title = row.getValue('title') as string
      return h('div', { 
        class: 'font-medium max-w-[250px] truncate',
        title: title
      }, title)
    },
  },

  // Creado por
  {
    accessorKey: 'createdBy',
    header: ({ column }) => h(DataTableColumnHeader, {
      column,
      title: 'Creado por',
    }),
    cell: ({ row }) => h('div', { class: 'text-sm' }, row.getValue('createdBy')),
  },

  // Fecha de creación
  {
    accessorKey: 'createdAt',
    header: ({ column }) => h(DataTableColumnHeader, {
      column,
      title: 'Fecha creación',
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

  // Mi rol
  {
    accessorKey: 'role',
    header: ({ column }) => h(DataTableColumnHeader, {
      column,
      title: 'Mi rol',
    }),
    cell: ({ row }) => {
      const role = row.getValue('role') as string
      return h('div', { class: 'text-sm text-muted-foreground' }, role)
    },
    filterFn: (row, id, value) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return true
      return (value as string[]).includes(row.getValue(id))
    },
  },

  // Finalización
  {
    accessorKey: 'completedAt',
    header: ({ column }) => h(DataTableColumnHeader, {
      column,
      title: 'Finalización',
    }),
    cell: ({ row }) => {
      const completedAt = row.getValue('completedAt') as string | null
      if (completedAt && completedAt !== '-') {
        return h('span', { class: 'text-sm text-green-600 whitespace-nowrap' }, completedAt)
      }
      return h('span', { class: 'text-sm text-muted-foreground' }, '-')
    },
  },
]
