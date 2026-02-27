import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader.vue'
import UserRoleSelect from './UserRoleSelect.vue'

// Tipo de usuario
export interface User {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  role: 'USER' | 'PROFESOR' | 'EXPERTO' | 'JEFE_DEPT' | 'ADMIN' | 'ROOT'
  isActive: boolean
  createdAt: string
}

// Roles disponibles
export const availableRoles = [
  { value: 'USER', label: 'Usuario' },
  { value: 'PROFESOR', label: 'Profesor' },
  { value: 'EXPERTO', label: 'Experto' },
  { value: 'JEFE_DEPT', label: 'Jefe Dept.' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'ROOT', label: 'Root' },
] as const

// Mapa de nombres de columnas
export const columnNames: Record<string, string> = {
  'select': 'Seleccionar',
  'user': 'Usuario',
  'email': 'Email',
  'createdAt': 'Fecha de Alta',
  'role': 'Rol',
  'isActive': 'Estado',
}

// Helpers
export function getInitials(firstName: string | null, lastName: string | null): string {
  const first = firstName?.charAt(0) || ''
  const last = lastName?.charAt(0) || ''
  return (first + last).toUpperCase() || 'U'
}

export function getRoleLabel(role: string): string {
  return availableRoles.find(r => r.value === role)?.label || role
}

export function getRoleBadgeVariant(role: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'ROOT': 'destructive',
    'ADMIN': 'default',
    'JEFE_DEPT': 'secondary',
    'EXPERTO': 'outline',
    'PROFESOR': 'outline',
    'USER': 'secondary',
  }
  return variants[role] || 'secondary'
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Props para las columnas
interface ColumnsProps {
  onRoleChange: (userId: string, newRole: string) => void
  onStatusChange: (userId: string, isActive: boolean) => void
  updatingUsers: Set<string>
}

// Factory de columnas
export function getColumns(props: ColumnsProps): ColumnDef<User>[] {
  const { onRoleChange, onStatusChange, updatingUsers } = props

  return [
    // Checkbox de selección
    {
      id: 'select',
      header: ({ table }) => h(Checkbox, {
        'checked': table.getIsAllPageRowsSelected(),
        'onUpdate:checked': (value: boolean) => table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Seleccionar todo',
      }),
      cell: ({ row }) => h(Checkbox, {
        'checked': row.getIsSelected(),
        'onUpdate:checked': (value: boolean) => row.toggleSelected(!!value),
        'ariaLabel': 'Seleccionar fila',
      }),
      enableSorting: false,
      enableHiding: false,
    },

    // Usuario (nombre + avatar)
    {
      accessorKey: 'firstName',
      id: 'user',
      header: ({ column }) => h(DataTableColumnHeader, {
        column,
        title: 'Usuario',
      }),
      cell: ({ row }) => {
        const user = row.original
        const initials = getInitials(user.firstName, user.lastName)
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Sin nombre'

        return h('div', { class: 'flex items-center gap-3' }, [
          h(Avatar, { class: 'h-8 w-8' }, () =>
            h(AvatarFallback, { class: 'text-xs' }, () => initials)
          ),
          h('div', {}, [
            h('p', { class: 'font-medium' }, fullName),
            h('p', { class: 'text-xs text-muted-foreground' }, `ID: ${user.id.slice(0, 8)}`),
          ]),
        ])
      },
      filterFn: (row, id, value) => {
        const user = row.original
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase()
        return fullName.includes((value as string).toLowerCase())
      },
    },

    // Email
    {
      accessorKey: 'email',
      header: ({ column }) => h(DataTableColumnHeader, {
        column,
        title: 'Email',
      }),
      cell: ({ row }) => h('div', { class: 'text-sm' }, row.getValue('email')),
    },

    // Fecha de Alta
    {
      accessorKey: 'createdAt',
      header: ({ column }) => h(DataTableColumnHeader, {
        column,
        title: 'Fecha de Alta',
      }),
      cell: ({ row }) => h('div', { class: 'text-sm whitespace-nowrap' },
        formatDate(row.getValue('createdAt'))
      ),
    },

    // Rol (con Select)
    {
      accessorKey: 'role',
      header: ({ column }) => h(DataTableColumnHeader, {
        column,
        title: 'Rol',
      }),
      cell: ({ row }) => h(UserRoleSelect, {
        role: row.original.role,
        userId: row.original.id,
        onChange: onRoleChange,
      }),
      filterFn: (row, id, value) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return true
        return (value as string[]).includes(row.getValue(id))
      },
    },

    // Estado (con Switch)
    {
      accessorKey: 'isActive',
      header: ({ column }) => h(DataTableColumnHeader, {
        column,
        title: 'Estado',
      }),
      cell: ({ row }) => {
        const user = row.original
        const isUpdating = updatingUsers.has(user.id)

        return h('div', { class: 'flex items-center gap-2' }, [
          h(Switch, {
            'modelValue': user.isActive,
            'onUpdate:modelValue': (value: boolean) => onStatusChange(user.id, value),
            'disabled': isUpdating,
          }),
          h(Badge, {
            variant: user.isActive ? 'default' : 'destructive',
            class: 'text-xs transition-colors duration-200'
          }, () => user.isActive ? 'Activo' : 'Bloqueado'),
          isUpdating ? h('div', {
            class: 'h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent'
          }) : null,
        ])
      },
      enableSorting: false,
    },
  ]
}
