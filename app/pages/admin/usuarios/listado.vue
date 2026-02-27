<template>
  <div class="min-h-screen">
    <!-- Header -->
    <div class="px-6 py-4 border-b">
      <h1 class="text-xl font-semibold">Gestión de Usuarios</h1>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <!-- Acciones en lote -->
      <Card v-if="selectedRows.length > 0" class="border-primary/50 bg-primary/5">
        <CardContent class="py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium">
                {{ selectedRows.length }} usuario(s) seleccionado(s)
              </span>
            </div>
            <div class="flex items-center gap-2">
              <Select v-model="bulkActionRole">
                <SelectTrigger class="w-40">
                  <SelectValue placeholder="Cambiar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="role in availableRoles" :key="role.value" :value="role.value">
                    {{ role.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                @click="applyBulkRole"
                :disabled="!bulkActionRole || isApplyingBulk"
              >
                <Icon v-if="isApplyingBulk" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
                Aplicar Rol
              </Button>
              <Separator orientation="vertical" class="h-6" />
              <Button
                variant="outline"
                size="sm"
                @click="bulkActivate(true)"
                :disabled="isApplyingBulk"
              >
                <Icon name="lucide:check-circle" class="mr-2 h-4 w-4" />
                Activar
              </Button>
              <Button
                variant="outline"
                size="sm"
                @click="bulkActivate(false)"
                :disabled="isApplyingBulk"
              >
                <Icon name="lucide:x-circle" class="mr-2 h-4 w-4" />
                Desactivar
              </Button>
              <Button variant="ghost" size="sm" @click="clearSelection">
                <Icon name="lucide:x" class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- DataTable de Usuarios -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Listado de Usuarios</CardTitle>
              <CardDescription>
                Total: {{ pagination.total }} usuarios
              </CardDescription>
            </div>
            <div class="flex items-center gap-2">
              <!-- Filtro de búsqueda -->
              <Input
                placeholder="Buscar usuario..."
                class="w-64 h-8"
                :model-value="(table?.getColumn('user')?.getFilterValue() as string) ?? ''"
                @update:model-value="table?.getColumn('user')?.setFilterValue($event)"
              />

              <!-- Filtro por rol -->
              <Select
                :model-value="(table?.getColumn('role')?.getFilterValue() as string[]) ?? []"
                @update:model-value="handleRoleFilterChange"
              >
                <SelectTrigger class="h-8 w-[140px]">
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los roles</SelectItem>
                  <SelectItem v-for="role in availableRoles" :key="role.value" :value="role.value">
                    {{ role.label }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <!-- Botón refrescar -->
              <Button variant="outline" size="icon" @click="refreshUsers" :disabled="isLoading">
                <Icon :name="isLoading ? 'lucide:loader-2' : 'lucide:refresh-cw'"
                      :class="{ 'animate-spin': isLoading }"
                      class="h-4 w-4" />
              </Button>

              <!-- Selector de columnas -->
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="outline"
                    size="sm"
                    class="hidden h-8 lg:flex"
                  >
                    <Icon name="lucide:sliders-horizontal" class="mr-2 h-4 w-4" />
                    Ver
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-[180px]">
                  <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    v-for="column in table?.getAllColumns().filter((col) => col.getCanHide())"
                    :key="column.id"
                    class="capitalize"
                    :model-value="column.getIsVisible()"
                    @update:model-value="(value) => column.toggleVisibility(!!value)"
                  >
                    {{ columnNames[column.id] || column.id }}
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <!-- Loading -->
          <div v-if="isLoading && !users.length" class="flex items-center justify-center py-12">
            <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
          </div>

          <!-- Tabla -->
          <DataTable
            v-else
            ref="dataTableRef"
            :columns="columns"
            :data="users"
            :manual-pagination="true"
            :page-count="pagination.totalPages"
            :row-count="pagination.total"
            :enable-row-selection="true"
            @pagination-change="handlePaginationChange"
            @row-selection-change="handleRowSelectionChange"
          />

          <!-- Controles de paginación manuales (si se necesitan) -->
          <div v-if="pagination.totalPages > 1" class="flex items-center justify-between mt-4">
            <div class="text-sm text-muted-foreground">
              Mostrando {{ users.length }} de {{ pagination.total }} usuarios
              <span>(Página {{ pagination.page }} de {{ pagination.totalPages }})</span>
            </div>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                :disabled="pagination.page <= 1 || isLoading"
                @click="goToPage(pagination.page - 1)"
              >
                <Icon name="lucide:chevron-left" class="h-4 w-4 mr-1" />
                Anterior
              </Button>

              <div class="flex items-center gap-1">
                <Button
                  v-for="pageNum in visiblePages"
                  :key="pageNum"
                  variant="outline"
                  size="sm"
                  :class="{ 'bg-primary text-primary-foreground hover:bg-primary/90': pageNum === pagination.page }"
                  @click="goToPage(pageNum)"
                >
                  {{ pageNum }}
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                :disabled="pagination.page >= pagination.totalPages || isLoading"
                @click="goToPage(pagination.page + 1)"
              >
                Siguiente
                <Icon name="lucide:chevron-right" class="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Table, PaginationState, RowSelectionState } from '@tanstack/vue-table'
import DataTable from '~/components/data-table/DataTable.vue'
import { getColumns, availableRoles, columnNames, type User } from '~/components/users/columns'

// Configuración de la página
definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

// Tipos
interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

type RoleValue = 'USER' | 'PROFESOR' | 'EXPERTO' | 'JEFE_DEPT' | 'ADMIN' | 'ROOT'

// Estados
const users = ref<User[]>([])
const isLoading = ref(false)
const isApplyingBulk = ref(false)
const bulkActionRole = ref<RoleValue | ''>('')
const updatingUsers = ref<Set<string>>(new Set())
const dataTableRef = ref<{ table: Table<User> } | null>(null)
const table = computed(() => dataTableRef.value?.table)

// Computed para filas seleccionadas
const selectedRows = computed(() => {
  if (!table.value) return []
  return table.value.getSelectedRowModel().rows.map(row => row.original)
})

// Paginación
const pagination = ref<Pagination>({
  page: 1,
  limit: 15,
  total: 0,
  totalPages: 0,
})

// Columnas
const columns = computed(() =>
  getColumns({
    onRoleChange: updateUserRole,
    onStatusChange: updateUserStatus,
    updatingUsers: updatingUsers.value,
  })
)

// Páginas visibles (máximo 5 números)
const visiblePages = computed(() => {
  const total = pagination.value.totalPages
  const current = pagination.value.page

  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  if (current <= 3) {
    return [1, 2, 3, 4, 5]
  }

  if (current >= total - 2) {
    return [total - 4, total - 3, total - 2, total - 1, total]
  }

  return [current - 2, current - 1, current, current + 1, current + 2]
})

// Handlers de eventos de la tabla
function handlePaginationChange(state: PaginationState) {
  pagination.value.page = state.pageIndex + 1
  pagination.value.limit = state.pageSize
  refreshUsers()
}

function handleRowSelectionChange(state: RowSelectionState) {
  // El estado se maneja internamente por TanStack Table
  // pero podemos hacer acciones adicionales aquí si es necesario
}

function handleRoleFilterChange(value: string | string[]) {
  // Si es 'ALL' o array vacío, limpiar el filtro
  if (value === 'ALL' || (Array.isArray(value) && value.length === 0)) {
    table.value?.getColumn('role')?.setFilterValue(undefined)
  } else if (Array.isArray(value)) {
    table.value?.getColumn('role')?.setFilterValue(value)
  } else {
    table.value?.getColumn('role')?.setFilterValue([value])
  }
}

function clearSelection() {
  table.value?.toggleAllPageRowsSelected(false)
  bulkActionRole.value = ''
}

// API Calls
const refreshUsers = async () => {
  isLoading.value = true
  try {
    const data = await $fetch<{ users: User[], pagination: Pagination }>('/api/users', {
      query: {
        page: pagination.value.page,
        limit: pagination.value.limit,
      }
    })

    users.value = data.users
    pagination.value = data.pagination
  } catch (error) {
    toast.error('Error', {
      description: 'No se pudieron cargar los usuarios',
    })
  } finally {
    isLoading.value = false
  }
}

const updateUserRole = async (userId: string, newRole: string) => {
  try {
    await $fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      body: { role: newRole }
    })

    const user = users.value.find(u => u.id === userId)
    if (user) user.role = newRole as RoleValue

    toast.success('Éxito', {
      description: 'Rol actualizado correctamente',
    })
  } catch (error) {
    toast.error('Error', {
      description: 'No se pudo actualizar el rol',
    })
    refreshUsers()
  }
}

const updateUserStatus = async (userId: string, isActive: boolean) => {
  updatingUsers.value.add(userId)

  const user = users.value.find(u => u.id === userId)
  const previousState = user?.isActive
  if (user) user.isActive = isActive

  try {
    await $fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      body: { isActive }
    })

    toast.success('Éxito', {
      description: `Usuario ${isActive ? 'activado' : 'desactivado'} correctamente`,
    })
  } catch (error) {
    if (user) user.isActive = previousState

    toast.error('Error', {
      description: 'No se pudo actualizar el estado',
    })
  } finally {
    updatingUsers.value.delete(userId)
  }
}

// Paginación
const goToPage = async (page: number) => {
  if (page < 1 || page > pagination.value.totalPages) return
  pagination.value.page = page
  clearSelection()
  await refreshUsers()
}

// Acciones en lote
const applyBulkRole = async () => {
  if (!bulkActionRole.value || selectedRows.value.length === 0) return

  isApplyingBulk.value = true
  try {
    await $fetch('/api/users/bulk', {
      method: 'PATCH',
      body: {
        userIds: selectedRows.value.map(u => u.id),
        role: bulkActionRole.value
      }
    })

    users.value.forEach(user => {
      if (selectedRows.value.find(u => u.id === user.id)) {
        user.role = bulkActionRole.value as RoleValue
      }
    })

    toast.success('Éxito', {
      description: `Rol actualizado en ${selectedRows.value.length} usuario(s)`,
    })
    clearSelection()
  } catch (error) {
    toast.error('Error', {
      description: 'No se pudieron actualizar los roles',
    })
  } finally {
    isApplyingBulk.value = false
  }
}

const bulkActivate = async (isActive: boolean) => {
  if (selectedRows.value.length === 0) return

  isApplyingBulk.value = true
  try {
    await $fetch('/api/users/bulk', {
      method: 'PATCH',
      body: {
        userIds: selectedRows.value.map(u => u.id),
        isActive
      }
    })

    users.value.forEach(user => {
      if (selectedRows.value.find(u => u.id === user.id)) {
        user.isActive = isActive
      }
    })

    toast.success('Éxito', {
      description: `${selectedRows.value.length} usuario(s) ${isActive ? 'activado(s)' : 'desactivado(s)'}`,
    })
    clearSelection()
  } catch (error) {
    toast.error('Error', {
      description: 'No se pudieron actualizar los estados',
    })
  } finally {
    isApplyingBulk.value = false
  }
}

// Cargar usuarios al montar
onMounted(() => {
  refreshUsers()
})
</script>
