<!-- pages/dashboard/index.vue -->
<template>
  <div class="min-h-screen">
    <!-- Header con imagen de fondo -->
    <PageHeader class="relative bg-cover bg-center bg-no-repeat" style="background-image: url('/images/old-page/socios.jpg');">
      <!-- Overlay oscuro para mejorar legibilidad -->
      <div class="absolute inset-0 bg-black/40"></div>
      <PageHeaderHeading class="relative z-10 text-white drop-shadow-lg">
        ¡Hola {{ userName }}! 👋
      </PageHeaderHeading>
      <PageHeaderDescription class="relative z-10 text-white/90 drop-shadow-md">
        Bienvenido a tu portal de Campus Digital FP.
      </PageHeaderDescription>
    </PageHeader>

    <div class="max-w-7xl mx-auto px-6 py-8 space-y-8">

  
  </div>
</div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
})

/* ----------  usuario  ---------- */
const { user } = await useUserSession()
const userName = computed(() => {
  if (!user.value) return 'Usuario'
  return `${user.value.firstName || ''} ${user.value.lastName || ''}`.trim() || user.value.email
})
</script>