<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

const route = useRoute()
const moduloId = route.params.id as string
const activeTab = ref('ras')

const { data: moduloResponse, pending } = await useFetch(() => `/api/studies/modulos/${moduloId}`)
const modulo = computed(() => moduloResponse.value?.data)
</script>

<template>
  <div class="min-h-screen bg-background p-4">
    <div class="mx-auto max-w-7xl" v-if="modulo">
      <!-- Cabecera -->
      <div class="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          @click="navigateTo(`/admin/estudios/ciclos/${modulo.ciclo.id}`)" 
          class="mb-4"
        >
          <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
          Volver a {{ modulo.ciclo.nombre }}
        </Button>
        
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3">
              <div 
                class="h-10 w-10 rounded-lg flex items-center justify-center font-bold"
                :style="{ backgroundColor: modulo.color || '#3b82f6', color: 'white' }"
              >
                {{ modulo.siglas || modulo.codigo }}
              </div>
              <div>
                <h1 class="text-2xl font-semibold tracking-tight text-foreground">
                  {{ modulo.nombre }}
                </h1>
                <p class="text-sm text-muted-foreground">
                  {{ modulo.ciclo.nombre }} • {{ modulo.horasTotales }} horas
                </p>
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <Button variant="outline" size="sm">
              <Icon name="lucide:edit" class="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <Tabs v-model="activeTab" class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="ras">
            <Icon name="lucide:target" class="mr-2 h-4 w-4" />
            Resultados de Aprendizaje
            <Badge variant="secondary" class="ml-2 text-xs">
              {{ modulo.resultadosAprendizaje?.length || 0 }}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="temas">
            <Icon name="lucide:book-open" class="mr-2 h-4 w-4" />
            Temas / Unidades
            <Badge variant="secondary" class="ml-2 text-xs">
              {{ modulo.temas?.length || 0 }}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <!-- Tab Resultados de Aprendizaje -->
        <TabsContent value="ras" class="space-y-4">
          <Card v-for="ra in modulo.resultadosAprendizaje" :key="ra.id">
            <CardHeader class="pb-3">
              <div class="flex items-start gap-3">
                <div class="bg-primary/10 h-8 w-8 rounded-full flex items-center justify-center shrink-0">
                  <span class="text-sm font-bold text-primary">RA{{ ra.numero }}</span>
                </div>
                <div class="flex-1">
                  <CardTitle class="text-base">{{ ra.descripcion }}</CardTitle>
                  <CardDescription v-if="ra.duracion" class="mt-1">
                    Duración: {{ ra.duracion }}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent v-if="ra.criteriosEvaluacion?.length > 0" class="pt-0">
              <div class="border-t pt-4">
                <h4 class="text-sm font-medium mb-2 flex items-center gap-2">
                  <Icon name="lucide:check-square" class="h-4 w-4" />
                  Criterios de Evaluación
                </h4>
                <div class="space-y-2">
                  <div 
                    v-for="ce in ra.criteriosEvaluacion" 
                    :key="ce.id"
                    class="flex items-start gap-3 p-2 rounded bg-muted/50"
                  >
                    <Badge variant="outline" class="shrink-0 text-xs">{{ ce.numero }}</Badge>
                    <div class="flex-1">
                      <p class="text-sm">{{ ce.descripcion }}</p>
                      <div v-if="ce.instrumentos?.length" class="flex gap-1 mt-1 flex-wrap">
                        <Badge 
                          v-for="inst in ce.instrumentos" 
                          :key="inst"
                          variant="secondary" 
                          class="text-[10px]"
                        >
                          {{ inst }}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Tab Temas -->
        <TabsContent value="temas" class="space-y-4">
          <Card v-for="tema in modulo.temas" :key="tema.id">
            <CardHeader class="pb-3">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div class="bg-primary/10 h-8 w-8 rounded-full flex items-center justify-center shrink-0">
                    <span class="text-sm font-bold text-primary">T{{ tema.numero }}</span>
                  </div>
                  <div>
                    <CardTitle class="text-base">{{ tema.titulo }}</CardTitle>
                    <CardDescription v-if="tema.duracion" class="mt-1">
                      Duración: {{ tema.duracion }}
                    </CardDescription>
                  </div>
                </div>
                <div class="flex gap-1 flex-wrap justify-end max-w-[200px]">
                  <Badge 
                    v-for="ra in tema.resultadosAprendizaje" 
                    :key="ra.id"
                    variant="outline" 
                    class="text-xs"
                  >
                    RA{{ ra.numero }}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent v-if="tema.descripcion || tema.contenidos?.length > 0" class="pt-0">
              <p v-if="tema.descripcion" class="text-sm text-muted-foreground mb-4">
                {{ tema.descripcion }}
              </p>
              
              <div v-if="tema.contenidos?.length > 0" class="border-t pt-4">
                <h4 class="text-sm font-medium mb-2">Contenidos</h4>
                <div class="space-y-1">
                  <div 
                    v-for="contenido in tema.contenidos" 
                    :key="contenido.id"
                    class="flex items-start gap-2"
                  >
                    <span class="text-xs font-medium text-muted-foreground shrink-0">{{ contenido.numero }}</span>
                    <div>
                      <p class="text-sm font-medium">{{ contenido.titulo }}</p>
                      <p v-if="contenido.descripcion" class="text-xs text-muted-foreground">
                        {{ contenido.descripcion }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>

    <!-- Loading -->
    <div v-else-if="pending" class="flex items-center justify-center py-12">
      <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <!-- Not found -->
    <div v-else class="flex flex-col items-center justify-center py-12">
      <Icon name="lucide:alert-circle" class="h-12 w-12 text-muted-foreground opacity-50" />
      <p class="mt-4 text-muted-foreground">Módulo no encontrado</p>
    </div>
  </div>
</template>
