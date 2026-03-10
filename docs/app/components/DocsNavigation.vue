<script setup lang="ts">
defineEmits<{
  select: []
}>()

const { data: nav } = await useAsyncData('nav-sidebar', () => {
  return queryCollectionNavigation('content')
})

const route = useRoute()
</script>

<template>
  <nav class="space-y-6">
    <div v-if="nav?.length">
      <div v-for="section in nav" :key="section.path" class="mb-4">
        <!-- Section title -->
        <h3 class="font-semibold text-sm mb-2 px-2 text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {{ section.title }}
        </h3>
        
        <!-- Items -->
        <ul class="space-y-0.5">
          <li v-for="item in section.children || [section]" :key="item.path">
            <NuxtLink
              :to="item.path"
              class="block px-2 py-1.5 text-sm rounded-md transition-colors"
              :class="route.path === item.path 
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100 font-medium' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'"
              @click="$emit('select')"
            >
              <div class="flex items-center gap-2">
                <UIcon v-if="item.icon" :name="item.icon" class="w-4 h-4" />
                <span>{{ item.title }}</span>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <div v-else class="text-sm text-gray-500 dark:text-gray-400">
      Cargando navegación...
    </div>
  </nav>
</template>
