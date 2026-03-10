<script setup lang="ts">
// Obtener contenido usando queryCollection en lugar de ContentList
const { data: articles } = await useAsyncData('index-articles', async () => {
  const collection = await queryCollection('content').all()
  return collection.filter(a => a.path !== '/').slice(0, 5)
})
</script>

<template>
  <div>
    <!-- Hero -->
    <div class="text-center py-12 border-b mb-8">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 text-sm mb-6">
        <UIcon name="i-lucide-sparkles" class="w-4 h-4" />
        <span>Nuxt 4 + Content v3</span>
      </div>
      
      <h1 class="text-4xl md:text-5xl font-bold mb-4">
        Intranet Campus Digital FP
      </h1>
      <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
        Documentación completa, referencias de API y guías para desarrolladores del sistema de gestión de FP.
      </p>
      
      <div class="flex gap-4 justify-center">
        <UButton to="/introduccion" size="lg" color="amber" icon="i-lucide-rocket">
          Empezar
        </UButton>
        <UButton to="/api" size="lg" variant="outline" icon="i-lucide-code">
          Referencia API
        </UButton>
      </div>
    </div>

    <!-- Features -->
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      <NuxtLink to="/introduccion">
        <UCard class="h-full hover:border-amber-500/50 transition-colors hover:shadow-md">
          <UIcon name="i-lucide-rocket" class="w-10 h-10 text-amber-500 mb-4" />
          <h3 class="text-lg font-semibold mb-2">Guías de inicio</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Aprende los conceptos básicos y configura tu entorno de desarrollo.
          </p>
        </UCard>
      </NuxtLink>

      <NuxtLink to="/api">
        <UCard class="h-full hover:border-amber-500/50 transition-colors hover:shadow-md">
          <UIcon name="i-lucide-code" class="w-10 h-10 text-amber-500 mb-4" />
          <h3 class="text-lg font-semibold mb-2">Referencia API</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Documentación completa de endpoints, tipos y ejemplos de código.
          </p>
        </UCard>
      </NuxtLink>

      <NuxtLink to="/arquitectura">
        <UCard class="h-full hover:border-amber-500/50 transition-colors hover:shadow-md">
          <UIcon name="i-lucide-building-2" class="w-10 h-10 text-amber-500 mb-4" />
          <h3 class="text-lg font-semibold mb-2">Arquitectura</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Entiende la estructura del proyecto y las decisiones técnicas.
          </p>
        </UCard>
      </NuxtLink>

      <NuxtLink to="/workflows">
        <UCard class="h-full hover:border-amber-500/50 transition-colors hover:shadow-md">
          <UIcon name="i-lucide-git-branch" class="w-10 h-10 text-amber-500 mb-4" />
          <h3 class="text-lg font-semibold mb-2">Workflows</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Sistema de workflows configurables para solicitudes y tareas.
          </p>
        </UCard>
      </NuxtLink>
    </div>

    <!-- Latest updates -->
    <div v-if="articles?.length" class="mt-12">
      <h2 class="text-2xl font-semibold mb-4">Últimas actualizaciones</h2>
      <div class="space-y-2">
        <NuxtLink
          v-for="article in articles" 
          :key="article.path"
          :to="article.path"
          class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div>
            <h3 class="font-medium hover:text-amber-600">{{ article.title }}</h3>
            <p v-if="article.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ article.description }}
            </p>
          </div>
          <UBadge v-if="article.category" color="neutral" variant="soft">
            {{ article.category }}
          </UBadge>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
