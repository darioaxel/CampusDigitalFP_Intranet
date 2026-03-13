<template>
  <footer class="border-t bg-background py-6">
    <div class="container mx-auto px-4">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <!-- Logo y copyright -->
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon name="lucide:graduation-cap" class="h-5 w-5 text-tyto-primary" />
          <span>Campus Digital FP - Intranet</span>
        </div>

        <!-- Links -->
        <div class="flex items-center gap-6 text-sm text-muted-foreground">
          <NuxtLink to="/" class="hover:text-foreground transition-colors">
            Inicio
          </NuxtLink>
          <NuxtLink to="/login" class="hover:text-foreground transition-colors">
            Acceso
          </NuxtLink>
        </div>

        <!-- Año -->
        <div class="text-sm text-muted-foreground">
          © {{ new Date().getFullYear() }}
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { Icon } from '#components'
</script>
