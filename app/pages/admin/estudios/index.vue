<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

const { data: ciclosResponse, pending } = await useFetch('/api/studies/ciclos')
const ciclos = computed(() => ciclosResponse.value?.data || [])

const getNivelLabel = (nivel: string) => {
  const labels: Record<string, string> = {
    'GRADO_MEDIO': 'Grado Medio',
    'GRADO_SUPERIOR': 'Grado Superior',
    'FP_BASICA': 'FP Básica'
  }
  return labels[nivel] || nivel
}

const getFamiliaLabel = (familia: string) => {
  const labels: Record<string, string> = {
    'INFORMATICA_COMUNICACIONES': 'Informática y Comunicaciones',
    'ADMINISTRACION_GESTION': 'Administración y Gestión'
  }
  return labels[familia] || familia
}
</script>

<template>
  <div class="min-h-screen bg-background p-4">
    <div class="mx-auto max-w-7xl">
      <!-- Cabecera -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-foreground">
            Estudios FP
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            Gestión de ciclos formativos, módulos y currículo
          </p>
        </div>
        <Button>
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          Nuevo Ciclo
        </Button>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="flex items-center justify-center py-12">
        <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin text-muted-foreground" />
      </div>

      <!-- Grid de Ciclos -->
      <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="ciclo in ciclos"
          :key="ciclo.id"
          :to="`/admin/estudios/ciclos/${ciclo.id}`"
          class="block"
        >
        <Card class="cursor-pointer hover:border-primary transition-colors h-full">
          <CardHeader class="pb-3">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <div class="bg-primary/10 p-2 rounded-lg">
                  <Icon name="lucide:graduation-cap" class="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle class="text-base">{{ ciclo.nombre }}</CardTitle>
                  <CardDescription class="text-xs">
                    {{ ciclo.codigo }}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" class="text-xs">
                {{ ciclo._count?.modulos || 0 }} módulos
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent class="pt-0">
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Nivel:</span>
                <Badge variant="secondary" class="text-xs">
                  {{ getNivelLabel(ciclo.nivel) }}
                </Badge>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Familia:</span>
                <span class="text-xs">{{ getFamiliaLabel(ciclo.familia) }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Horas:</span>
                <span class="text-xs">{{ ciclo.horasTotales }}h</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Duración:</span>
                <span class="text-xs">{{ ciclo.duracion }}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        </NuxtLink>
      </div>

      <!-- Empty state -->
      <div v-if="!pending && ciclos.length === 0" class="flex flex-col items-center justify-center py-12">
        <Icon name="lucide:book-open" class="h-12 w-12 text-muted-foreground opacity-50" />
        <p class="mt-4 text-muted-foreground">No hay ciclos formativos configurados</p>
        <Button class="mt-4" variant="outline">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          Crear primer ciclo
        </Button>
      </div>
    </div>
  </div>
</template>
