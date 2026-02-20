<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import DynamicBreadCrumb from '@/components/layout/dashboard/DynamicBreadCrumb.vue'

definePageMeta({
  middleware: ['auth'], // usa app/middleware/auth.ts
})
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div class="flex items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator
            orientation="vertical"
            class="mr-2 data-[orientation=vertical]:h-4"
          />
          <DynamicBreadCrumb :url="useRoute().path" />
            
        </div>
      </header>
       <main class="flex-1">
      <slot />
    </main>
    </SidebarInset>
  </SidebarProvider>
  <LayoutMainFooter />
</template>