<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

const route = useRoute()
const cicloId = route.params.id as string

const { data: cicloResponse, pending } = await useFetch(() => `/api/studies/ciclos/${cicloId}`)
const ciclo = computed(() => cicloResponse.value?.data)

// Agrupar módulos por curso
const modulosPorCurso = computed(() => {
  if (!ciclo.value?.modulos) return {}
  
  return ciclo.value.modulos.reduce((acc: any, modulo: any) => {
    const curso = modulo.curso
    if (!acc[curso]) acc[curso] = []
    acc[curso].push(modulo)
    return acc
  }, {})
})

const getNivelLabel = (nivel: string) => {
  const labels: Record<string, string> = {
    'GRADO_MEDIO': 'Grado Medio',
    'GRADO_SUPERIOR': 'Grado Superior',
    'FP_BASICA': 'FP Básica'
  }
  return labels[nivel] || nivel
}
</script>

<template>
  <div class="min-h-screen bg-background p-4">
    <div class="mx-auto max-w-7xl" v-if="ciclo">
      <!-- Cabecera -->
      <div class="mb-6">
        <Button variant="ghost" size="sm" class="mb-4" as-child>
          <NuxtLink to="/admin/estudios">
            <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
            Volver a estudios
          </NuxtLink>
        </Button>
        
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-semibold tracking-tight text-foreground">
                {{ ciclo.nombre }}
              </h1>
              <Badge variant="secondary">{{ ciclo.codigo }}</Badge>
            </div>
            <p class="text-sm text-muted-foreground mt-1">
              {{ getNivelLabel(ciclo.nivel) }} • {{ ciclo.horasTotales }} horas • {{ ciclo.duracion }}
            </p>
          </div>
          <div class="flex gap-2">
            <Button variant="outline" size="sm">
              <Icon name="lucide:edit" class="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>
      </div>

      <!-- Módulos por curso -->
      <div v-for="(modulos, curso) in modulosPorCurso" :key="curso" class="mb-8">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="lucide:book-marked" class="h-5 w-5" />
          {{ curso }}º Curso
          <Badge variant="outline" class="text-xs">{{ modulos.length }} módulos</Badge>
        </h2>

        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card 
            v-for="modulo in modulos"
            :key="modulo.id"
            class="cursor-pointer hover:border-primary transition-colors h-full"
            as-child
          >
            <NuxtLink
              :to="`/admin/estudios/modulos/${modulo.id}`"
              class="block"
            >
              <CardHeader class="pb-3">
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-2">
                    <div 
                      class="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold"
                      :style="{ backgroundColor: modulo.color || '#3b82f6', color: 'white' }"
                    >
                      {{ modulo.siglas || modulo.codigo }}
                    </div>
                    <div>
                      <CardTitle class="text-sm">{{ modulo.nombre }}</CardTitle>
                      <CardDescription class="text-xs">
                        Código: {{ modulo.codigo }}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent class="pt-0">
                <div class="space-y-2 text-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-muted-foreground">Horas:</span>
                    <span>{{ modulo.horasTotales }}h</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-muted-foreground">RAs:</span>
                    <Badge variant="outline" class="text-xs">
                      {{ modulo._count?.resultadosAprendizaje || 0 }}
                    </Badge>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-muted-foreground">Temas:</span>
                    <Badge variant="outline" class="text-xs">
                      {{ modulo._count?.temas || 0 }}
                    </Badge>
                  </div>
                  <div v-if="modulo.docente" class="flex items-center justify-between">
                    <span class="text-muted-foreground">Docente:</span>
                    <span class="text-xs">{{ modulo.docente.firstName }} {{ modulo.docente.lastName }}</span>
                  </div>
                </div>
              </CardContent>
            </NuxtLink>
          </Card>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-else-if="pending" class="flex items-center justify-center py-12">
      <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <!-- Not found -->
    <div v-else class="flex flex-col items-center justify-center py-12">
      <Icon name="lucide:alert-circle" class="h-12 w-12 text-muted-foreground opacity-50" />
      <p class="mt-4 text-muted-foreground">Ciclo formativo no encontrado</p>
    </div>
  </div>
</template>
