<script setup lang="ts">
import AppSidebar from '~/components/dashboard/AppSidebar.vue'
import ChartAreaInteractive from '~/components/dashboard/ChartAreaInteractive.vue'
import DataTable from '~/components/dashboard/DataTable.vue'
import SectionCards from '~/components/dashboard/SectionCards.vue'
import SiteHeader from '~/components/dashboard/SiteHeader.vue'
import data from '~/components/dashboard/data.json'

import {
  SidebarInset,
  SidebarProvider,
} from '~/components/ui/sidebar'
</script>

<template>
  <div class="md:hidden">
    <img
      src="/examples/dashboard-light.png"
      width="1280"
      height="843"
      alt="Dashboard"
      class="block dark:hidden"
    />
    <img
      src="/examples/dashboard-dark.png"
      width="1280"
      height="843"
      alt="Dashboard"
      class="hidden dark:block"
    />
  </div>
  <SidebarProvider
    class="hidden md:flex"
    :style="{
      '--sidebar-width': 'calc(var(--spacing) * 64)',
      '--header-height': 'calc(var(--spacing) * 12 + 1px)',
    }"
  >
    <AppSidebar variant="sidebar" />
    <SidebarInset>
      <SiteHeader />
      <div class="flex flex-1 flex-col">
        <div class="@container/main flex flex-1 flex-col gap-2">
          <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <div class="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            <DataTable :data="data" />
          </div>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
