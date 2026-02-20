<!-- pages/index.vue (landing) -->
<template>
  <div class="flex flex-col items-center justify-center">
    <div class="relative w-full">
      <!-- Fondo difuminado -->
      <div
        class="absolute inset-0 bg-cover bg-center blur-[2px]"
        style="background-image: url('/images/old-page/fondo-1.png')"
      />
      <!-- Capa oscura semitransparente para mejorar legibilidad -->
      <div class="absolute inset-0 bg-black/40" />
      <PageHeader class="relative z-10">
        <PageHeaderHeading class="max-w-4xl text-white">
          Campus Virtual FP - Intranet
        </PageHeaderHeading>
        <PageHeaderDescription class="text-white/90">Aplicación para la gestión de tareas, horarios, etc.</PageHeaderDescription>
        <PageActions>
          <Button as-child size="sm">
            <a target="_blank" href="https://campusdigitalfp.com"> Web </a>
          </Button>         
        </PageActions>
      </PageHeader>
    </div>   
  </div>
</template>

