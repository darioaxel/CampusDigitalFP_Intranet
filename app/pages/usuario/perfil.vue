<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

const { user } = await useUserSession()
const router = useRouter()
const isEditing = ref(false)
const isLoading = ref(false)
const isSaving = ref(false)
import { toast } from 'vue-sonner'
import { Pencil, LogOut, Loader2, Lock, Eye, EyeOff } from 'lucide-vue-next'

// Formulario con datos del usuario
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dni: '',
  birthDate: '',
  addressLine: '',
  floorDoor: '',
  postalCode: '',
  locality: '',
  province: '',  
})

// Formulario de cambio de contraseña
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const isChangingPassword = ref(false)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Cargar datos del usuario logueado
const loadUserData = async () => {
  console.log('📋 Cargando datos para usuario:', user.value?.id)

  try {
    const data = await $fetch('/api/user/profile')
    console.log('✅ Datos recibidos:', data)
    
    // Asignar datos al formulario
    Object.assign(form, data)
    
  } catch (error: any) {
    console.error('❌ Error al cargar datos:', error)
    toast.error('Error al cargar datos del perfil')
    
    if (error.statusCode === 401) {
      await navigateTo('/login')
    }
  } finally {
    isLoading.value = false
  }
}
// Activar modo edición
const startEdit = () => {
  isEditing.value = true
}

// Cancelar edición
const cancelEdit = () => {
  isEditing.value = false
  loadUserData() // Recargar datos originales
}

// Guardar cambios
const saveProfile = async () => {
  isSaving.value = true
  try {
    await $fetch('/api/user/profile', {
      method: 'PUT',
      body: form
    })
    
    await refresh() // Actualizar sesión
    toast.success('Perfil actualizado')
    isEditing.value = false
    
  } catch (error: any) {
    toast.error(error.data?.message || 'Error al guardar')
  } finally {
    isSaving.value = false
  }
}

// Cambiar contraseña
const changePassword = async () => {
  // Validaciones básicas
  if (passwordForm.newPassword.length < 8) {
    toast.error('La nueva contraseña debe tener al menos 8 caracteres')
    return
  }
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toast.error('Las contraseñas no coinciden')
    return
  }

  isChangingPassword.value = true
  try {
    await $fetch('/api/user/change-password', {
      method: 'POST',
      body: {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      }
    })
    
    toast.success('Contraseña actualizada correctamente')
    
    // Limpiar formulario
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    
  } catch (error: any) {
    toast.error(error.data?.message || 'Error al cambiar la contraseña')
  } finally {
    isChangingPassword.value = false
  }
}

// Cerrar sesión
const handleLogout = async () => {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clearUserSession()
  await navigateTo('/login')
}

// Cargar datos al montar
onMounted(() => {
  loadUserData()
})
</script>

<template>
  <div class="container mx-auto py-8 px-4 max-w-4xl">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">Mi Perfil</h1>
      <div class="space-x-4">
        <Button 
          v-if="!isEditing" 
          @click="startEdit" 
          variant="outline"
        >
          <Pencil class="w-4 h-4 mr-2" />
          Editar perfil
        </Button>
        <Button 
          variant="outline" 
          @click="handleLogout"
        >
          <LogOut class="w-4 h-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin" />
    </div>

    <div v-else class="space-y-6">
      <!-- Formulario de perfil -->
      <Card>
        <CardHeader>
          <CardTitle>Información personal</CardTitle>
          <CardDescription>
            Datos de tu cuenta en la asociación
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form @submit.prevent="saveProfile">
            <FieldGroup>
              <!-- Datos personales -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Nombre</FieldLabel>
                  <Input 
                    v-model="form.firstName" 
                    :disabled="!isEditing"
                    placeholder="Tu nombre"
                  />
                </Field>

                <Field>
                  <FieldLabel>Apellidos</FieldLabel>
                  <Input 
                    v-model="form.lastName" 
                    :disabled="!isEditing"
                    placeholder="Tus apellidos"
                  />
                </Field>
              </div>

              <!-- Email ancho completo -->
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input 
                  v-model="form.email" 
                  type="email"
                  :disabled="!isEditing"
                  placeholder="tu@email.com"
                />
                <FieldDescription>
                  Usamos este email para contactarte
                </FieldDescription>
              </Field>

              <!-- Documentación -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field>
                  <FieldLabel>DNI</FieldLabel>
                  <Input 
                    v-model="form.dni" 
                    :disabled="!isEditing"
                    placeholder="12345678A"
                  />
                </Field>

                <Field>
                  <FieldLabel>Teléfono</FieldLabel>
                  <Input 
                    v-model="form.phone" 
                    type="tel"
                    :disabled="!isEditing"
                    placeholder="612345678"
                  />
                </Field>

                <Field>
                  <FieldLabel>Fecha de nacimiento</FieldLabel>
                  <Input 
                    v-model="form.birthDate" 
                    type="date"
                    :disabled="!isEditing"
                  />
                </Field>
              </div>

              <!-- Dirección -->
              <div class="border rounded-lg p-4 mt-4">
                <h3 class="text-lg font-medium mb-4">Dirección</h3>
                
                <Field>
                  <FieldLabel>Dirección</FieldLabel>
                  <Input 
                    v-model="form.addressLine" 
                    :disabled="!isEditing"
                    placeholder="Calle Mayor 123"
                  />
                </Field>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Field>
                    <FieldLabel>Piso/Puerta</FieldLabel>
                    <Input 
                      v-model="form.floorDoor" 
                      :disabled="!isEditing"
                      placeholder="2º B"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Código postal</FieldLabel>
                    <Input 
                      v-model="form.postalCode" 
                      :disabled="!isEditing"
                      placeholder="28001"
                    />
                  </Field>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Field>
                    <FieldLabel>Localidad</FieldLabel>
                    <Input 
                      v-model="form.locality" 
                      :disabled="!isEditing"
                      placeholder="Madrid"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Provincia</FieldLabel>
                    <Input 
                      v-model="form.province" 
                      :disabled="!isEditing"
                      placeholder="Madrid"
                    />
                  </Field>             
                </div>
              </div>

              <!-- Botones de acción -->
              <div class="flex justify-end gap-4 mt-6">
                <Button 
                  v-if="isEditing" 
                  type="button"
                  variant="outline" 
                  @click="cancelEdit"
                >
                  Cancelar
                </Button>
                
                <Button 
                  v-if="isEditing" 
                  type="submit"
                  :disabled="isSaving"
                >
                  <Loader2 v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
                  {{ isSaving ? 'Guardando...' : 'Guardar cambios' }}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <!-- Cambio de contraseña -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Lock class="w-5 h-5" />
            Cambiar contraseña
          </CardTitle>
          <CardDescription>
            Actualiza tu contraseña de acceso a la aplicación
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form @submit.prevent="changePassword" class="space-y-4">
            <!-- Contraseña actual -->
            <Field>
              <FieldLabel>Contraseña actual</FieldLabel>
              <div class="relative">
                <Input 
                  v-model="passwordForm.currentPassword" 
                  :type="showCurrentPassword ? 'text' : 'password'"
                  placeholder="Tu contraseña actual"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  @click="showCurrentPassword = !showCurrentPassword"
                >
                  <Eye v-if="!showCurrentPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </Button>
              </div>
            </Field>

            <!-- Nueva contraseña -->
            <Field>
              <FieldLabel>Nueva contraseña</FieldLabel>
              <div class="relative">
                <Input 
                  v-model="passwordForm.newPassword" 
                  :type="showNewPassword ? 'text' : 'password'"
                  placeholder="Mínimo 8 caracteres"
                  required
                  minlength="8"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  @click="showNewPassword = !showNewPassword"
                >
                  <Eye v-if="!showNewPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </Button>
              </div>
              <FieldDescription>
                Debe tener al menos 8 caracteres
              </FieldDescription>
            </Field>

            <!-- Confirmar nueva contraseña -->
            <Field>
              <FieldLabel>Confirmar nueva contraseña</FieldLabel>
              <div class="relative">
                <Input 
                  v-model="passwordForm.confirmPassword" 
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="Repite la nueva contraseña"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <Eye v-if="!showConfirmPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </Button>
              </div>
            </Field>

            <!-- Botón cambiar -->
            <div class="flex justify-end pt-2">
              <Button 
                type="submit"
                :disabled="isChangingPassword"
              >
                <Loader2 v-if="isChangingPassword" class="w-4 h-4 mr-2 animate-spin" />
                {{ isChangingPassword ? 'Cambiando...' : 'Cambiar contraseña' }}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
