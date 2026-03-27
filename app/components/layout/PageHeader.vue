<script setup lang="ts">
interface Props {
  title: string
  description?: string
  backLabel?: string
  backTo?: string
  loading?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  back: []
  refresh: []
}>()

const handleBack = () => {
  if (props.backTo) {
    navigateTo(props.backTo)
  } else {
    emit('back')
  }
}
</script>

<template>
  <div class="mb-6 flex items-start justify-between">
    <div>
      <!-- Botón volver (opcional) -->
      <Button
        v-if="backLabel || backTo"
        variant="ghost"
        size="sm"
        class="mb-2 -ml-2"
        @click="handleBack"
      >
        <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
        {{ backLabel || 'Volver' }}
      </Button>

      <!-- Título principal -->
      <h1 class="text-xl font-semibold tracking-tight text-foreground">
        {{ title }}
      </h1>

      <!-- Descripción/subtítulo -->
      <p v-if="description" class="text-sm text-muted-foreground mt-1">
        <slot name="description">
          {{ description }}
        </slot>
      </p>
    </div>

    <!-- Acciones de la derecha -->
    <div v-if="$slots.actions || loading !== undefined" class="flex gap-2">
      <slot name="actions">
        <!-- Botón refresh por defecto si se pasa loading -->
        <Button
          v-if="loading !== undefined"
          variant="ghost"
          size="sm"
          :disabled="loading"
          class="h-8 w-8 p-0"
          @click="$emit('refresh')"
        >
          <Icon
            name="lucide:refresh-cw"
            class="h-4 w-4"
            :class="{ 'animate-spin': loading }"
          />
        </Button>
      </slot>
    </div>
  </div>
</template>
