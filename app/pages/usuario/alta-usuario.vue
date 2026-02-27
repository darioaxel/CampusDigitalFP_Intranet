<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { toast } from 'vue-sonner'

definePageMeta({  
  auth: false
})

const router = useRouter()

// Estado del formulario
const form = reactive({
  // Datos del solicitante (la persona que está haciendo la solicitud)
  // En este caso, el mismo candidato
  requesterName: '',
  requesterEmail: '',
  requesterPhone: '',
  
  // Datos del usuario a dar de alta (el candidato)
  firstName: '',
  lastName: '',
  email: '',
  emailPersonal: '',
  dni: '',
  phone: '',
  birthDate: '',
  // Contraseña (la creará el usuario ahora)
  password: '',
  confirmPassword: '',
  
  // Dirección (opcional para la solicitud)
  addressLine: '',
  floorDoor: '',
  postalCode: '',
  locality: '',
  province: '',
  
  // Términos
  acceptTerms: false
})

const submitting = ref(false)
const showSuccess = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const errors = reactive<Record<string, string>>({})
const requestId = ref('')

// Validación DNI español
const validateDNI = (dni: string) => {
  const dniRegex = /^[0-9]{8}[A-Z]$/
  if (!dniRegex.test(dni)) return false
  
  const numero = dni.substring(0, 8)
  const letra = dni.substring(8, 9)
  const letras = 'TRWAGMYFPDXBNJZSQVHLCKET'
  const letraCalculada = letras[parseInt(numero) % 23]
  
  return letra === letraCalculada
}

// Validación código postal
const validatePostalCode = (cp: string) => {
  return /^[0-9]{5}$/.test(cp)
}

// Validación teléfono español
const validatePhone = (phone: string) => {
  return /^[0-9]{9}$/.test(phone.replace(/\s/g, ''))
}

const validateForm = () => {
  Object.keys(errors).forEach(key => delete errors[key])
  let isValid = true

  // Datos personales obligatorios
  if (!form.firstName.trim()) {
    errors.firstName = 'El nombre es obligatorio'
    isValid = false
  }
  
  if (!form.lastName.trim()) {
    errors.lastName = 'Los apellidos son obligatorios'
    isValid = false
  }
  
  if (!form.email.trim()) {
    errors.email = 'El email institucional es obligatorio'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Email inválido'
    isValid = false
  }

  // Email personal opcional pero validar formato si se rellena
  if (form.emailPersonal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailPersonal)) {
    errors.emailPersonal = 'Email personal inválido'
    isValid = false
  }
  
  if (!form.dni.trim()) {
    errors.dni = 'El DNI es obligatorio'
    isValid = false
  } else if (!validateDNI(form.dni.toUpperCase())) {
    errors.dni = 'DNI inválido (formato: 12345678A)'
    isValid = false
  }
  
  if (!form.phone.trim()) {
    errors.phone = 'El teléfono es obligatorio'
    isValid = false
  } else if (!validatePhone(form.phone)) {
    errors.phone = 'Teléfono inválido (9 dígitos)'
    isValid = false
  }

  if (!form.birthDate) {
    errors.birthDate = 'La fecha de nacimiento es obligatoria'
    isValid = false
  } else {
    const birth = new Date(form.birthDate)
    const today = new Date()
    const age = today.getFullYear() - birth.getFullYear()
    if (age < 16) {
      errors.birthDate = 'Debe ser mayor de 16 años'
      isValid = false
    }
  }

  // Contraseña
  if (!form.password) {
    errors.password = 'La contraseña es obligatoria'
    isValid = false
  } else if (form.password.length < 8) {
    errors.password = 'Mínimo 8 caracteres'
    isValid = false
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
    errors.password = 'Debe contener mayúscula, minúscula y número'
    isValid = false
  }

  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden'
    isValid = false
  }

  // Dirección (opcional pero recomendada)
  if (form.addressLine && !form.postalCode) {
    errors.postalCode = 'El código postal es obligatorio si indica dirección'
    isValid = false
  }
  
  if (form.postalCode && !validatePostalCode(form.postalCode)) {
    errors.postalCode = 'Código postal inválido (5 dígitos)'
    isValid = false
  }

  if (!form.acceptTerms) {
    errors.terms = 'Debe aceptar los términos'
    isValid = false
  }

  return isValid
}

const submitApplication = async () => {
  if (!validateForm()) {
    toast.error('Por favor, revise los campos marcados')
    return
  }

  submitting.value = true
  
  try {
    // Preparar el payload según el formato esperado por el endpoint
    const payload = {
      type: 'NEW_USER' as const,
      title: `Solicitud de alta - ${form.firstName} ${form.lastName}`,
      description: `Solicitud de alta de usuario`,
      
      // Datos del solicitante (en este caso, el mismo candidato)
      requesterName: `${form.firstName} ${form.lastName}`,
      requesterEmail: form.emailPersonal || form.email,
      requesterPhone: form.phone,
      
      // Datos del usuario a dar de alta
      userData: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        dni: form.dni.toUpperCase(),
        phone: form.phone,
        // Incluimos la contraseña para que el admin pueda crear el usuario con ella
        password: form.password,
        birthDate: form.birthDate,
        emailPersonal: form.emailPersonal || null
      },
      
    }

    const { data, error } = await useFetch('/api/requests', {
      method: 'POST',
      body: payload
    })

    if (error.value) throw error.value

    // Guardar el ID de la solicitud para mostrarlo
    requestId.value = data.value?.data?.id || ''
    showSuccess.value = true
    
  } catch (err: any) {
    toast.error(err.message || 'Error al enviar la solicitud')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-muted/30 dark:bg-background flex items-center justify-center p-4 md:p-6">
    <div class="w-full max-w-2xl">
      <!-- Card principal -->
      <div class="bg-card text-card-foreground rounded-xl border shadow-sm">
        <!-- Header -->
        <div class="flex flex-col space-y-1.5 p-6 border-b bg-muted/50">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="lucide:user-plus" class="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 class="text-2xl font-semibold tracking-tight">Solicitud de Alta</h1>
              <p class="text-sm text-muted-foreground">
                Complete sus datos para solicitar acceso al sistema
              </p>
            </div>
          </div>
        </div>

        <!-- Formulario -->
        <div class="p-6 space-y-6">
          
          <!-- Sección: Datos Personales -->
          <div class="space-y-4">
            <h3 class="text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <Icon name="lucide:user" class="w-4 h-4 text-primary" />
              Datos Personales
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium">
                  Nombre <span class="text-destructive">*</span>
                </label>
                <input 
                  v-model="form.firstName"
                  type="text" 
                  placeholder="Ej: María"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  :class="{ 'border-destructive ring-1 ring-destructive': errors.firstName }"
                />
                <p v-if="errors.firstName" class="text-xs text-destructive flex items-center gap-1">
                  <Icon name="lucide:alert-circle" class="w-3 h-3" /> {{ errors.firstName }}
                </p>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium">
                  Apellidos <span class="text-destructive">*</span>
                </label>
                <input 
                  v-model="form.lastName"
                  type="text" 
                  placeholder="Ej: García López"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  :class="{ 'border-destructive ring-1 ring-destructive': errors.lastName }"
                />
                <p v-if="errors.lastName" class="text-xs text-destructive">{{ errors.lastName }}</p>
              </div>
            </div>

            <!-- Email institucional -->
            <div class="space-y-2">
              <label class="text-sm font-medium">
                Email institucional <span class="text-destructive">*</span>
              </label>
              <input 
                v-model="form.email"
                type="email" 
                placeholder="nombre@centro.edu"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                :class="{ 'border-destructive ring-1 ring-destructive': errors.email }"
              />
              <p v-if="errors.email" class="text-xs text-destructive">{{ errors.email }}</p>
            </div>

            <!-- Email personal -->
            <div class="space-y-2">
              <label class="text-sm font-medium">
                Email personal <span class="text-xs text-muted-foreground font-normal">(opcional)</span>
              </label>
              <input 
                v-model="form.emailPersonal"
                type="email" 
                placeholder="nombre@gmail.com"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                :class="{ 'border-destructive ring-1 ring-destructive': errors.emailPersonal }"
              />
              <p v-if="errors.emailPersonal" class="text-xs text-destructive">{{ errors.emailPersonal }}</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium">
                  DNI/NIE <span class="text-destructive">*</span>
                </label>
                <input 
                  v-model="form.dni"
                  type="text" 
                  placeholder="12345678A"
                  maxlength="9"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 uppercase"
                  :class="{ 'border-destructive ring-1 ring-destructive': errors.dni }"
                />
                <p v-if="errors.dni" class="text-xs text-destructive">{{ errors.dni }}</p>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium">
                  Teléfono <span class="text-destructive">*</span>
                </label>
                <input 
                  v-model="form.phone"
                  type="tel" 
                  placeholder="600000000"
                  maxlength="9"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  :class="{ 'border-destructive ring-1 ring-destructive': errors.phone }"
                />
                <p v-if="errors.phone" class="text-xs text-destructive">{{ errors.phone }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium">
                  Fecha de nacimiento <span class="text-destructive">*</span>
                </label>
                <input 
                  v-model="form.birthDate"
                  type="date" 
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  :class="{ 'border-destructive ring-1 ring-destructive': errors.birthDate }"
                />
                <p v-if="errors.birthDate" class="text-xs text-destructive">{{ errors.birthDate }}</p>
              </div>


            </div>
          </div>

          <!-- Sección: Contraseña -->
          <div class="space-y-4 pt-4 border-t">
            <h3 class="text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <Icon name="lucide:lock" class="w-4 h-4 text-primary" />
              Contraseña de acceso
            </h3>

            <div class="space-y-2">
              <label class="text-sm font-medium">
                Contraseña <span class="text-destructive">*</span>
              </label>
              <div class="relative">
                <input 
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'" 
                  placeholder="Mínimo 8 caracteres, mayúscula, minúscula y número"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  :class="{ 'border-destructive ring-1 ring-destructive': errors.password }"
                />
                <button 
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Icon :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
                </button>
              </div>
              <p v-if="errors.password" class="text-xs text-destructive">{{ errors.password }}</p>
              <p v-else class="text-xs text-muted-foreground">
                Debe contener al menos 8 caracteres, una mayúscula, una minúscula y un número
              </p>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium">
                Confirmar contraseña <span class="text-destructive">*</span>
              </label>
              <div class="relative">
                <input 
                  v-model="form.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'" 
                  placeholder="Repita la contraseña"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  :class="{ 'border-destructive ring-1 ring-destructive': errors.confirmPassword }"
                />
                <button 
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Icon :name="showConfirmPassword ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
                </button>
              </div>
              <p v-if="errors.confirmPassword" class="text-xs text-destructive">{{ errors.confirmPassword }}</p>
            </div>
          </div>

          <!-- Sección: Dirección -->
          <div class="space-y-4 pt-4 border-t">
            <h3 class="text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <Icon name="lucide:map-pin" class="w-4 h-4 text-primary" />
              Dirección <span class="text-xs text-muted-foreground font-normal">(opcional)</span>
            </h3>

            <div class="space-y-2">
              <label class="text-sm font-medium">Dirección</label>
              <input 
                v-model="form.addressLine"
                type="text" 
                placeholder="Calle, número, etc."
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium">Piso / Puerta</label>
              <input 
                v-model="form.floorDoor"
                type="text" 
                placeholder="Ej: 2º A, Bajo, etc."
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div class="space-y-2 col-span-2 md:col-span-1">
                <label class="text-sm font-medium">Código Postal</label>
                <input 
                  v-model="form.postalCode"
                  type="text" 
                  placeholder="28001"
                  maxlength="5"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  :class="{ 'border-destructive ring-1 ring-destructive': errors.postalCode }"
                />
                <p v-if="errors.postalCode" class="text-xs text-destructive">{{ errors.postalCode }}</p>
              </div>

              <div class="space-y-2 col-span-2 md:col-span-1">
                <label class="text-sm font-medium">Localidad</label>
                <input 
                  v-model="form.locality"
                  type="text" 
                  placeholder="Madrid"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div class="space-y-2 col-span-2 md:col-span-1">
                <label class="text-sm font-medium">Provincia</label>
                <input 
                  v-model="form.province"
                  type="text" 
                  placeholder="Madrid"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>
          </div>

          <!-- Términos -->
          <div class="pt-4 border-t">
            <div class="flex items-start gap-3">
              <input 
                id="terms"
                v-model="form.acceptTerms"
                type="checkbox"
                class="h-4 w-4 mt-0.5 rounded border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <div class="space-y-1">
                <label for="terms" class="text-sm font-medium leading-none cursor-pointer">
                  Acepto la política de privacidad y tratamiento de datos <span class="text-destructive">*</span>
                </label>
                <p class="text-xs text-muted-foreground leading-relaxed">
                  Sus datos personales serán tratados conforme al Reglamento (UE) 2016/679 (RGPD) y la LOPDGDD 
                  para la gestión de accesos al sistema educativo. Puede ejercer sus derechos de acceso, 
                  rectificación, supresión y oposición contactando con el administrador del sistema.
                </p>
                <p v-if="errors.terms" class="text-xs text-destructive">{{ errors.terms }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer con acciones -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t bg-muted/30">
          <NuxtLink 
            to="/login" 
            class="text-sm text-muted-foreground hover:text-foreground transition-colors order-2 sm:order-1"
          >
            ¿Ya tiene cuenta? <span class="underline">Inicie sesión</span>
          </NuxtLink>
          
          <button 
            @click="submitApplication"
            :disabled="submitting"
            class="w-full sm:w-auto inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 order-1 sm:order-2"
          >
            <Icon 
              v-if="submitting" 
              name="lucide:loader-2" 
              class="mr-2 h-4 w-4 animate-spin" 
            />
            <Icon v-else name="lucide:send" class="mr-2 h-4 w-4" />
            {{ submitting ? 'Enviando...' : 'Enviar Solicitud' }}
          </button>
        </div>
      </div>

      <!-- Footer página -->
      <p class="text-center text-xs text-muted-foreground mt-6">
        © {{ new Date().getFullYear() }} CampusDigitalFP. Protección de datos según RGPD.
      </p>
    </div>

    <!-- Modal de Éxito -->
    <Teleport to="body">
      <div v-if="showSuccess" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div class="bg-background rounded-xl border shadow-lg max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
          <div class="flex flex-col items-center text-center space-y-3">
            <div class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Icon name="lucide:check-circle" class="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            
            <div class="space-y-1">
              <h2 class="text-lg font-semibold">Solicitud enviada correctamente</h2>
              <p class="text-sm text-muted-foreground">
                Hemos recibido sus datos. Recibirá un correo en 
                <strong class="text-foreground">{{ form.email }}</strong> cuando su cuenta sea activada.
              </p>
            </div>
          </div>

          <div class="bg-muted rounded-lg p-3 text-xs space-y-2">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Referencia:</span>
              <span class="font-mono font-medium">{{ requestId.slice(-8).toUpperCase() || 'REG-' + Date.now().toString(36).toUpperCase().slice(-8) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Estado:</span>
              <span class="inline-flex items-center gap-1 text-amber-600">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Pendiente de revisión
              </span>
            </div>
          </div>

          <Button as-child class="w-full">
            <NuxtLink to="/">
              Volver al inicio
            </NuxtLink>
          </Button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
