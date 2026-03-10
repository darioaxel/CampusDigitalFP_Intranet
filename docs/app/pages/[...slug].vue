<script setup lang="ts">
const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection('content').path(route.path).first()
})

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Página no encontrada' })
}

useHead({
  title: page.value?.title,
  meta: [
    { name: 'description', content: page.value?.description }
  ]
})

// Get surround pages for prev/next
const { data: surround } = await useAsyncData(`${route.path}-surround`, () => {
  return queryCollectionItemSurroundings('content', route.path)
})
</script>

<template>
  <div v-if="page">
    <!-- Breadcrumbs -->
    <nav class="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      <NuxtLink to="/" class="hover:text-foreground">Inicio</NuxtLink>
      <UIcon name="i-lucide-chevron-right" class="w-4 h-4" />
      <span class="text-foreground">{{ page.title }}</span>
    </nav>

    <!-- Header -->
    <header class="mb-8 pb-6 border-b">
      <div class="flex items-center gap-3 mb-2">
        <UIcon v-if="page.icon" :name="page.icon" class="w-8 h-8 text-amber-500" />
        <h1 class="text-4xl font-bold">{{ page.title }}</h1>
      </div>
      <p v-if="page.description" class="text-xl text-muted-foreground">
        {{ page.description }}
      </p>
      <div class="flex gap-4 mt-4 text-sm text-muted-foreground">
        <span v-if="page.date" class="flex items-center gap-1">
          <UIcon name="i-lucide-calendar" class="w-4 h-4" />
          {{ new Date(page.date).toLocaleDateString('es-ES') }}
        </span>
      </div>
    </header>

    <!-- Content -->
    <article class="prose prose-lg dark:prose-invert max-w-none">
      <ContentRenderer :value="page" />
    </article>

    <!-- Prev/Next navigation -->
    <footer v-if="surround?.length" class="mt-12 pt-6 border-t">
      <div class="flex justify-between items-center gap-4">
        <NuxtLink 
          v-if="surround[0]" 
          :to="surround[0].path"
          class="flex items-center gap-2 text-sm hover:text-amber-600"
        >
          <UIcon name="i-lucide-arrow-left" />
          <div class="text-left">
            <div class="text-xs text-muted-foreground">Anterior</div>
            <div class="font-medium">{{ surround[0].title }}</div>
          </div>
        </NuxtLink>
        <div v-else />
        
        <NuxtLink 
          v-if="surround[1]" 
          :to="surround[1].path"
          class="flex items-center gap-2 text-sm hover:text-amber-600"
        >
          <div class="text-right">
            <div class="text-xs text-muted-foreground">Siguiente</div>
            <div class="font-medium">{{ surround[1].title }}</div>
          </div>
          <UIcon name="i-lucide-arrow-right" />
        </NuxtLink>
      </div>
    </footer>
  </div>
</template>
