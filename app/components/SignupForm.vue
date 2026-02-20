<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { toast } from 'vue-sonner'
import { useRouter } from '#app'
import { z } from 'zod'
import { Loader2 } from 'lucide-vue-next'

const router = useRouter()

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  dni: '',
  phone: '',
  birthDate: '',
  addressLine: '',
  floorDoor: '',
  postalCode: '',
  locality: '',
  province: '',
  region: ''
})

const errors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  dni: '',
  phone: '',
  birthDate: '',
  postalCode: '',
  locality: '',
  province: ''
})

const loading = ref(false)

const signupSchema = z.object({
  firstName: z.string().min(2, 'Nombre muy corto'),
  lastName: z.string().min(2, 'Apellidos muy cortos'),
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
  dni: z.string().regex(/^[0-9]{8}[A-Z]$/, 'DNI inválido (8 números + letra)'),
  phone: z.string().regex(/^[679][0-9]{8}$/, 'Teléfono inválido (9 dígitos)'),
  birthDate: z.string().refine(date => new Date(date) < new Date(), 'Fecha inválida'),
  addressLine: z.string().min(5, 'Dirección muy corta'),
  floorDoor: z.string().optional(),
  postalCode: z.string().regex(/^[0-9]{5}$/, 'CP debe tener 5 dígitos'),
  locality: z.string().min(2, 'Localidad muy corta'),
  province: z.string().min(2, 'Provincia muy corta'),
  region: z.string().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
})

const validateField = (field: keyof typeof form) => {
  try {
    signupSchema.pick({ [field]: true }).parse({ [field]: form[field] })
    errors[field] = ''
  } catch (error: any) {
    errors[field] = error.errors[0]?.message || ''
  }
}

const validateForm = (): boolean => {
  try {
    signupSchema.parse(form)
    Object.keys(errors).forEach(key => errors[key as keyof typeof errors] = '')
    return true
  } catch (error: any) {
    error.errors.forEach((err: any) => {
      if (err.path[0]) errors[err.path[0] as keyof typeof errors] = err.message
    })
    return false
  }
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    const response = await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        dni: form.dni,
        phone: form.phone,
        birthDate: form.birthDate,
        address: {
          addressLine: form.addressLine,
          floorDoor: form.floorDoor,
          postalCode: form.postalCode,
          locality: form.locality,
          province: form.province,
          region: form.region
        }
      }
    })

    toast.success('¡Cuenta creada!', {
      description: 'Tu cuenta ha sido creada exitosamente'
    })
    
    await navigateTo('/login')
    
  } catch (error: any) {
    if (error.data?.message?.includes('email')) {
      errors.email = 'Este email ya está registrado'
    } else if (error.data?.message?.includes('dni')) {
      errors.dni = 'Este DNI ya está registrado'
    } else {
      toast.error('Error al crear cuenta', {
        description: error.data?.message || 'Inténtalo de nuevo'
      })
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Crear una cuenta</CardTitle>
      <CardDescription>
        Introduce tu información a continuación para crear tu cuenta
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form @submit.prevent="handleSubmit">
        <FieldGroup>
          <!-- Datos personales - Nombre y apellidos en columnas separadas -->
          
            <Field>
              <FieldLabel for="firstName">Nombre</FieldLabel>
              <Input
                id="firstName"
                v-model="form.firstName"
                type="text"
                placeholder="Juan Antonio"
                :class="{ 'border-destructive': errors.firstName }"
                :disabled="loading"
                required
                @blur="validateField('firstName')"
              />
              <p v-if="errors.firstName" class="text-sm text-destructive">{{ errors.firstName }}</p>
            </Field>

            <Field>
              <FieldLabel for="lastName">Apellidos</FieldLabel>
              <Input
                id="lastName"
                v-model="form.lastName"
                type="text"
                placeholder="García López"
                :class="{ 'border-destructive': errors.lastName }"
                :disabled="loading"
                required
                @blur="validateField('lastName')"
              />
              <p v-if="errors.lastName" class="text-sm text-destructive">{{ errors.lastName }}</p>
            </Field>
     

          <!-- Email ocupando ancho completo -->
          <Field>
            <FieldLabel for="email">Correo electrónico</FieldLabel>
            <Input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="m@ejemplo.com"
              :class="{ 'border-destructive': errors.email }"
              :disabled="loading"
              required
              @blur="validateField('email')"
            />
            <FieldDescription>
              Usaremos este correo para contactar contigo. No lo compartiremos
              con nadie más.
            </FieldDescription>
            <p v-if="errors.email" class="text-sm text-destructive">{{ errors.email }}</p>
          </Field>

          <!-- Resto de campos organizados en columnas -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel for="dni">DNI</FieldLabel>
              <Input
                id="dni"
                v-model="form.dni"
                type="text"
                placeholder="12345678A"
                :class="{ 'border-destructive': errors.dni }"
                :disabled="loading"
                required
                @blur="validateField('dni')"
              />
              <p v-if="errors.dni" class="text-sm text-destructive">{{ errors.dni }}</p>
            </Field>
 <Field>
              <FieldLabel for="birthDate">Fecha de nacimiento</FieldLabel>
              <Input
                id="birthDate"
                v-model="form.birthDate"
                type="date"
                :class="{ 'border-destructive': errors.birthDate }"
                :disabled="loading"
                required
                @blur="validateField('birthDate')"
              />
              <p v-if="errors.birthDate" class="text-sm text-destructive">{{ errors.birthDate }}</p>
            </Field>           
          </div>
<Field>
              <FieldLabel for="phone">Teléfono</FieldLabel>
              <Input
                id="phone"
                v-model="form.phone"
                type="tel"
                placeholder="612345678"
                :class="{ 'border-destructive': errors.phone }"
                :disabled="loading"
                required
                @blur="validateField('phone')"
              />
              <p v-if="errors.phone" class="text-sm text-destructive">{{ errors.phone }}</p>
            </Field>
          <!-- Contraseñas -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel for="password">Contraseña</FieldLabel>
              <Input
                id="password"
                v-model="form.password"
                type="password"
                :class="{ 'border-destructive': errors.password }"
                :disabled="loading"
                required
                @blur="validateField('password')"
              />
              <FieldDescription>Debe tener al menos 8 caracteres.</FieldDescription>
              <p v-if="errors.password" class="text-sm text-destructive">{{ errors.password }}</p>
            </Field>

            <Field>
              <FieldLabel for="confirmPassword">Confirmar contraseña</FieldLabel>
              <Input
                id="confirmPassword"
                v-model="form.confirmPassword"
                type="password"
                :class="{ 'border-destructive': errors.confirmPassword }"
                :disabled="loading"
                required
                @blur="validateField('confirmPassword')"
              />
              <FieldDescription>Por favor, confirma tu contraseña.</FieldDescription>
              <p v-if="errors.confirmPassword" class="text-sm text-destructive">{{ errors.confirmPassword }}</p>
            </Field>
          </div>

          <!-- Dirección -->
          <div class="border rounded-lg p-4 space-y-4">         
            <Field>
              <FieldLabel for="addressLine">Dirección</FieldLabel>
              <Input
                id="addressLine"
                v-model="form.addressLine"
                type="text"
                placeholder="Calle Mayor 123"
                :class="{ 'border-destructive': errors.addressLine }"
                :disabled="loading"
                required
                @blur="validateField('addressLine')"
              />
              <p v-if="errors.addressLine" class="text-sm text-destructive">{{ errors.addressLine }}</p>
            </Field>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel for="floorDoor">Piso/Puerta (opcional)</FieldLabel>
                <Input
                  id="floorDoor"
                  v-model="form.floorDoor"
                  type="text"
                  placeholder="2º B"
                  :disabled="loading"
                />
              </Field>

              <Field>
                <FieldLabel for="postalCode">Código postal</FieldLabel>
                <Input
                  id="postalCode"
                  v-model="form.postalCode"
                  type="text"
                  placeholder="28001"
                  :class="{ 'border-destructive': errors.postalCode }"
                  :disabled="loading"
                  required
                  @blur="validateField('postalCode')"
                />
                <p v-if="errors.postalCode" class="text-sm text-destructive">{{ errors.postalCode }}</p>
              </Field>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel for="locality">Localidad</FieldLabel>
                <Input
                  id="locality"
                  v-model="form.locality"
                  type="text"
                  placeholder="Madrid"
                  :class="{ 'border-destructive': errors.locality }"
                  :disabled="loading"
                  required
                  @blur="validateField('locality')"
                />
                <p v-if="errors.locality" class="text-sm text-destructive">{{ errors.locality }}</p>
              </Field>

              <Field>
                <FieldLabel for="province">Provincia</FieldLabel>
                <Input
                  id="province"
                  v-model="form.province"
                  type="text"
                  placeholder="Madrid"
                  :class="{ 'border-destructive': errors.province }"
                  :disabled="loading"
                  required
                  @blur="validateField('province')"
                />
                <p v-if="errors.province" class="text-sm text-destructive">{{ errors.province }}</p>
              </Field>

             
            </div>
          </div>

          <!-- Botones -->
          <FieldGroup>
            <Field>
              <Button type="submit" class="w-full" :disabled="loading">
                <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
              </Button>
              
              <Button variant="outline" type="button" class="w-full">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4 mr-2">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                Registrarse con Google
              </Button>
              
              <FieldDescription class="px-6 text-center">
                ¿Ya tienes una cuenta? <NuxtLink to="/login" class="text-primary hover:underline">Inicia sesión</NuxtLink>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </FieldGroup>
      </form>
    </CardContent>
  </Card>
</template>