<script setup lang="ts">
import { X, Send } from 'lucide-vue-next'
import { TIPOS_BAJA } from '~/composables/useSickLeaveRequests'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props {
  selectedDatesText: string
  tipoBaja: string
  observaciones: string
  submitting: boolean
  disabled?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:tipoBaja': [value: string]
  'update:observaciones': [value: string]
  submit: []
  cancel: []
}>()

const tipoBajaModel = computed({
  get: () => props.tipoBaja,
  set: (value) => emit('update:tipoBaja', value)
})

const observacionesModel = computed({
  get: () => props.observaciones,
  set: (value) => emit('update:observaciones', value)
})
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">Datos de la Baja</CardTitle>
      <CardDescription>
        Fechas seleccionadas: {{ selectedDatesText }}
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Tipo de baja -->
      <div class="space-y-2">
        <Label for="tipoBaja">Tipo de Baja *</Label>
        <Select v-model="tipoBajaModel">
          <SelectTrigger>
            <SelectValue placeholder="Selecciona el tipo de baja" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem 
              v-for="tipo in TIPOS_BAJA" 
              :key="tipo.value" 
              :value="tipo.value"
            >
              <div class="flex flex-col items-start">
                <span>{{ tipo.label }}</span>
                <span class="text-xs text-muted-foreground">{{ tipo.description }}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <!-- Observaciones -->
      <div class="space-y-2">
        <Label for="observaciones">Observaciones</Label>
        <Textarea
          id="observaciones"
          v-model="observacionesModel"
          placeholder="Añade cualquier información adicional relevante..."
          rows="3"
        />
      </div>
      
      <!-- Botón enviar -->
      <div class="flex justify-end gap-2">
        <Button variant="outline" @click="emit('cancel')">
          <X class="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button 
          @click="emit('submit')" 
          :disabled="!tipoBaja || submitting || disabled"
        >
          <Send class="w-4 h-4 mr-2" />
          Enviar Comunicación
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
