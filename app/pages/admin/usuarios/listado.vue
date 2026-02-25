<template>
  <div class="min-h-screen">
    <!-- Header -->
    <div class="px-6 py-4 border-b">
      <h1 class="text-xl font-semibold">Gestión de Usuarios</h1>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <!-- Acciones en lote -->
      <Card v-if="selectedUsers.length > 0" class="border-primary/50 bg-primary/5">
        <CardContent class="py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium">
                {{ selectedUsers.length }} usuario(s) seleccionado(s)
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

      <!-- Tabla de usuarios -->
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
              <Input
                v-model="searchQuery"
                placeholder="Buscar usuario..."
                class="w-64"
              />
              <Button variant="outline" size="icon" @click="refreshUsers" :disabled="isLoading">
                <Icon :name="isLoading ? 'lucide:loader-2' : 'lucide:refresh-cw'" 
                      :class="{ 'animate-spin': isLoading }" 
                      class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-12">
                    <Checkbox 
                      :checked="isAllSelected" 
                      @update:checked="toggleSelectAll"
                    />
                  </TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Fecha de Alta</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead class="w-24">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="user in paginatedUsers" :key="user.id" :class="{ 'bg-muted/50': isSelected(user.id) }">
                  <TableCell>
                    <Checkbox 
                      :checked="isSelected(user.id)" 
                      @update:checked="toggleSelect(user.id)"
                    />
                  </TableCell>
                  <TableCell>
                    <div class="flex items-center gap-3">
                      <Avatar class="h-8 w-8">
                        <AvatarFallback class="text-xs">
                          {{ getInitials(user.firstName, user.lastName) }}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p class="font-medium">{{ user.firstName }} {{ user.lastName }}</p>
                        <p class="text-xs text-muted-foreground">ID: {{ user.id.slice(0, 8) }}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{{ user.email }}</TableCell>
                  <TableCell>{{ formatDate(user.createdAt) }}</TableCell>
                  <TableCell>
                    <Select 
                      :model-value="user.role" 
                      @update:model-value="(role) => updateUserRole(user.id, role)"
                    >
                      <SelectTrigger class="w-36">
                        <Badge :variant="getRoleBadgeVariant(user.role)" class="font-normal">
                          {{ getRoleLabel(user.role) }}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="role in availableRoles" :key="role.value" :value="role.value">
                          {{ role.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <Switch 
                        :checked="user.isActive" 
                        @update:checked="(active) => updateUserStatus(user.id, active)"
                        :disabled="updatingUsers.has(user.id)"
                      />
                      <Badge 
                        :variant="user.isActive ? 'default' : 'destructive'" 
                        class="text-xs transition-colors duration-200"
                      >
                        {{ user.isActive ? 'Activo' : 'Bloqueado' }}
                      </Badge>
                      <Icon 
                        v-if="updatingUsers.has(user.id)" 
                        name="lucide:loader-2" 
                        class="h-4 w-4 animate-spin text-muted-foreground" 
                      />
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow v-if="paginatedUsers.length === 0">
                  <TableCell colspan="6" class="h-32 text-center">
                    <div class="flex flex-col items-center justify-center text-muted-foreground">
                      <Icon name="lucide:users" class="h-8 w-8 mb-2" />
                      <p>No se encontraron usuarios</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <!-- Controles de paginación -->
          <div class="flex items-center justify-between mt-4">
            <div class="text-sm text-muted-foreground">
              Mostrando {{ paginatedUsers.length }} de {{ pagination.total }} usuarios
              <span v-if="pagination.totalPages > 1">
                (Página {{ pagination.page }} de {{ pagination.totalPages }})
              </span>
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
import { toast } from 'vue-sonner'

// Tipos
interface User {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

type RoleValue = 'USER' | 'PROFESOR' | 'EXPERTO' | 'JEFE_DEPT' | 'ADMIN' | 'ROOT'

// Configuración de la página
definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

// Estados
const users = ref<User[]>([])
const selectedUsers = ref<string[]>([])
const searchQuery = ref('')
const isLoading = ref(false)
const isApplyingBulk = ref(false)
const bulkActionRole = ref<RoleValue | ''>('')

// Usuarios en proceso de actualización
const updatingUsers = ref<Set<string>>(new Set())

// Paginación
const pagination = ref<Pagination>({
  page: 1,
  limit: 15,
  total: 0,
  totalPages: 0,
})

// Roles disponibles
const availableRoles = [
  { value: 'USER', label: 'Usuario' },
  { value: 'PROFESOR', label: 'Profesor' },
  { value: 'EXPERTO', label: 'Experto' },
  { value: 'JEFE_DEPT', label: 'Jefe Dept.' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'ROOT', label: 'Root' },
] as const

// Usuarios filtrados por búsqueda (client-side)
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user => 
    user.firstName?.toLowerCase().includes(query) ||
    user.lastName?.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query)
  )
})

// Usuarios paginados (si hay búsqueda, paginamos en cliente, si no mostramos todos los de la página actual)
const paginatedUsers = computed(() => {
  // Si hay búsqueda, aplicamos paginación client-side sobre los resultados filtrados
  if (searchQuery.value) {
    const start = (pagination.value.page - 1) * pagination.value.limit
    const end = start + pagination.value.limit
    return filteredUsers.value.slice(start, end)
  }
  // Sin búsqueda, mostramos los usuarios de la página actual (ya vienen paginados del servidor)
  return users.value
})

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

// Lógica de selección
const isAllSelected = computed(() => {
  return paginatedUsers.value.length > 0 && paginatedUsers.value.every(u => isSelected(u.id))
})

const isSelected = (userId: string) => selectedUsers.value.includes(userId)

const toggleSelect = (userId: string) => {
  const index = selectedUsers.value.indexOf(userId)
  if (index === -1) {
    selectedUsers.value.push(userId)
  } else {
    selectedUsers.value.splice(index, 1)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedUsers.value = selectedUsers.value.filter(id => !paginatedUsers.value.find(u => u.id === id))
  } else {
    const newSelections = paginatedUsers.value.filter(u => !isSelected(u.id)).map(u => u.id)
    selectedUsers.value.push(...newSelections)
  }
}

const clearSelection = () => {
  selectedUsers.value = []
  bulkActionRole.value = ''
}

// Helpers
const getInitials = (firstName: string | null, lastName: string | null) => {
  const first = firstName?.charAt(0) || ''
  const last = lastName?.charAt(0) || ''
  return (first + last).toUpperCase() || 'U'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const getRoleLabel = (role: string) => {
  return availableRoles.find(r => r.value === role)?.label || role
}

const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
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

// Paginación
const goToPage = async (page: number) => {
  if (page < 1 || page > pagination.value.totalPages) return
  pagination.value.page = page
  clearSelection()
  await refreshUsers()
}

// API Calls
const refreshUsers = async () => {
  isLoading.value = true
  try {
    // Si hay búsqueda activa, cargamos más datos o todos para filtrar en cliente
    const limit = searchQuery.value ? 1000 : pagination.value.limit
    const page = searchQuery.value ? 1 : pagination.value.page
    
    const data = await $fetch<{ users: User[], pagination: Pagination }>('/api/users', {
      query: {
        page,
        limit,
      }
    })
    
    users.value = data.users
    
    // Solo actualizamos la paginación si no hay búsqueda activa
    if (!searchQuery.value) {
      pagination.value = data.pagination
    } else {
      // Con búsqueda, recalculamos la paginación basada en resultados filtrados
      const filtered = filteredUsers.value
      pagination.value.total = filtered.length
      pagination.value.totalPages = Math.ceil(filtered.length / pagination.value.limit)
      // Aseguramos que la página actual sea válida
      if (pagination.value.page > pagination.value.totalPages) {
        pagination.value.page = Math.max(1, pagination.value.totalPages)
      }
    }
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
    if (user) user.role = newRole
    
    toast.success('Éxito', {
      description: 'Rol actualizado correctamente',
    })
  } catch (error) {
    toast.error('Error', {
      description: 'No se pudo actualizar el rol',
    })
    // Revertir cambio en UI
    refreshUsers()
  }
}

const updateUserStatus = async (userId: string, isActive: boolean) => {
  // Marcar usuario como en actualización
  updatingUsers.value.add(userId)
  
  // Actualización optimista de la UI
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
    // Revertir cambio en UI si falla
    if (user) user.isActive = previousState
    
    toast.error('Error', {
      description: 'No se pudo actualizar el estado',
    })
  } finally {
    updatingUsers.value.delete(userId)
  }
}

// Acciones en lote
const applyBulkRole = async () => {
  if (!bulkActionRole.value || selectedUsers.value.length === 0) return
  
  isApplyingBulk.value = true
  try {
    await $fetch('/api/users/bulk', {
      method: 'PATCH',
      body: {
        userIds: selectedUsers.value,
        role: bulkActionRole.value
      }
    })
    
    // Actualizar usuarios localmente
    users.value.forEach(user => {
      if (selectedUsers.value.includes(user.id)) {
        user.role = bulkActionRole.value
      }
    })
    
    toast.success('Éxito', {
      description: `Rol actualizado en ${selectedUsers.value.length} usuario(s)`,
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
  if (selectedUsers.value.length === 0) return
  
  isApplyingBulk.value = true
  try {
    await $fetch('/api/users/bulk', {
      method: 'PATCH',
      body: {
        userIds: selectedUsers.value,
        isActive
      }
    })
    
    // Actualizar usuarios localmente
    users.value.forEach(user => {
      if (selectedUsers.value.includes(user.id)) {
        user.isActive = isActive
      }
    })
    
    toast.success('Éxito', {
      description: `${selectedUsers.value.length} usuario(s) ${isActive ? 'activado(s)' : 'desactivado(s)'}`,
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

// Watch para búsqueda - resetear a página 1 cuando se busca
watch(searchQuery, () => {
  pagination.value.page = 1
  refreshUsers()
})

// Cargar usuarios al montar
onMounted(() => {
  refreshUsers()
})
</script>
