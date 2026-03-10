<script setup lang="ts">
const { data: nav } = await useAsyncData('nav-default', () => {
  return queryCollectionNavigation('content')
})

const isOpen = ref(false)

// Dark mode toggle manual
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const toggleDark = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Header -->
    <header class="sticky top-0 z-50 border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur">
      <div class="container mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <!-- Mobile menu -->
          <UButton
            icon="i-lucide-menu"
            color="neutral"
            variant="ghost"
            class="lg:hidden"
            @click="isOpen = true"
          />
          
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-2">
            <div class="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">CD</span>
            </div>
            <span class="font-semibold hidden sm:inline">Campus Digital</span>
          </NuxtLink>
        </div>
        
        <!-- Desktop nav -->
        <nav class="hidden lg:flex items-center gap-1">
          <NuxtLink 
            v-for="item in nav" 
            :key="item.path"
            :to="item.path"
            class="px-3 py-1.5 text-sm rounded-md transition-colors"
            :class="$route.path === item.path 
              ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'"
          >
            {{ item.title }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-github"
            color="neutral"
            variant="ghost"
            to="https://github.com"
            target="_blank"
          />
          <!-- Dark mode toggle manual -->
          <UButton
            :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
            color="neutral"
            variant="ghost"
            @click="toggleDark"
          />
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- Sidebar Desktop -->
      <aside class="w-64 fixed left-0 top-14 bottom-0 border-r overflow-y-auto hidden lg:block bg-gray-50 dark:bg-gray-800/50">
        <div class="p-4">
          <DocsNavigation />
        </div>
      </aside>

      <!-- Mobile Sidebar -->
      <USlideover v-model:open="isOpen" side="left" class="lg:hidden">
        <div class="p-4 h-full bg-white dark:bg-gray-900">
          <div class="flex items-center justify-between mb-4">
            <span class="font-semibold">Navegación</span>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              @click="isOpen = false"
            />
          </div>
          <DocsNavigation @select="isOpen = false" />
        </div>
      </USlideover>

      <!-- Main Content -->
      <main class="flex-1 lg:ml-64">
        <div class="container mx-auto px-4 py-8 max-w-4xl">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
