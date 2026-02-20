<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen flex items-center justify-center overflow-hidden">
    <div class="max-w-screen-xl w-full mx-auto flex flex-col items-center gap-10 px-6 py-12 lg:py-0">
      <h1 class="text-center max-w-xl text-4xl md:text-5xl lg:text-[2.75rem] xl:text-5xl font-bold !leading-[1.2] tracking-tight">
        Shadcn Vue Dev - Practical & Customizable Vue UI Components
      </h1>
      <p class="max-w-xl text-slate-700 text-center">
        Explore a versatile library of shadcn-vue based UI blocks. Easily copy, preview, and integrate modern Vue components with Tailwind CSS styles.
      </p>
      <div class="flex items-center gap-4">
        <Button size="lg" class-name="rounded-full text-base">
          Get Started <ArrowRight class-name="size-5!" />
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>