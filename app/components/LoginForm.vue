<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { ref, reactive } from 'vue'
import { useRouter } from '#app'
import { toast } from 'vue-sonner'
import { cn } from "@/lib/utils"
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
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { AlertCircle, Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()

const router = useRouter()

const form = reactive({
  email: '',
  password: '',
})

const errors = reactive({
  email: '',
  password: '',
})

const loading = ref(false)

const validateForm = (): boolean => {
  errors.email = ''
  errors.password = ''
  
  if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = 'Email inválido'
  }
  
  if (!form.password || form.password.length < 8) {
    errors.password = 'Mínimo 8 caracteres'
  }
  
  return !errors.email && !errors.password
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: form,
    })
    console.log('✅ Respuesta:', response)
    if (response.success) {
      toast.success('¡Bienvenido!', {
        description: 'Has iniciado sesión correctamente',
      })
      
      // Redirigir según rol
      const { user } = await useUserSession()
      if (user?.role === 'ROOT') {
        await navigateTo('/admin/')
      } else if (user?.role === 'ADMIN') {
        await navigateTo('/admin/')
      } else {
        await navigateTo('/usuario/')
      }
    }
  } catch (error: any) {
    console.log('❌ Error completo:', error)
    console.log('📋 Datos del error:', {
      status: error.status,
      statusText: error.statusText,
      data: error.data,
      message: error.message
    })

    toast.error('Error de autenticación', {
      description: error.data?.message || 'Credenciales inválidas',
    })
    
    // Limpiar password en error
    form.password = ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <Card>
      <CardHeader class="text-center">
        <CardTitle class="text-xl">
          Bienvenido de nuevo
        </CardTitle>
        <CardDescription>
          Inicia sesión con tu cuenta de socio o mediante Google
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit">
          <FieldGroup>
            <Field>
              <FieldLabel for="email">
                Correo electrónico
              </FieldLabel>
              <Input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="m@ejemplo.com"
                :class="{ 'border-destructive': errors.email }"
                :disabled="loading"
                required
              />
              <p v-if="errors.email" class="text-sm text-destructive flex items-center gap-1 mt-1">
                <AlertCircle class="w-4 h-4" />
                {{ errors.email }}
              </p>
            </Field>
            
            <Field>
              <div class="flex items-center">
                <FieldLabel for="password">
                  Contraseña
                </FieldLabel>
                <a
                  href="#"
                  class="ml-auto text-sm underline-offset-4 hover:underline"
                >
                  ¿Has olvidado tu contraseña?
                </a>
              </div>
              <Input 
                id="password" 
                v-model="form.password"
                type="password" 
                :class="{ 'border-destructive': errors.password }"
                :disabled="loading"
                required 
              />
              <p v-if="errors.password" class="text-sm text-destructive flex items-center gap-1 mt-1">
                <AlertCircle class="w-4 h-4" />
                {{ errors.password }}
              </p>
            </Field>
            
            <FieldSeparator class="*:data-[slot=field-separator-content]:bg-card">
              O continuar con
            </FieldSeparator>
            
            <Field>             
              <Button variant="outline" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                Iniciar sesión con Google
              </Button>
            </Field>
            
            <Field>
              <Button type="submit" :disabled="loading">
                <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                {{ loading ? 'Ingresando...' : 'Iniciar sesión' }}
              </Button>
              
              <FieldDescription class="text-center">
                ¿No tienes una cuenta?
                <NuxtLink to="/signup" class="text-primary hover:underline">
                  Regístrate
                </NuxtLink>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
    
    <FieldDescription class="px-6 text-center">
      Al continuar, aceptas nuestros <a href="#">Términos de servicio</a>
      y <a href="#">Política de privacidad</a>.
    </FieldDescription>
  </div>
</template>