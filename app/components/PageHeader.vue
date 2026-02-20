<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <section :class="cn('border-grid h[100vh] md:h-[50vh] border-grid', props.class)">
      <div class="flex flex-col items-center gap-2 py-8 text-center md:py-16 lg:py-20 xl:gap-4">       
        <slot />
      </div>    
  </section>
</template>