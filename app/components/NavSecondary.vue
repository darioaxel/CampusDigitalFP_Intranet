<script setup lang="ts">
import { LogOutIcon, type LucideIcon } from "lucide-vue-next"


interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
}

defineProps<{ items: NavItem[] }>()
const { clear } = useUserSession()

async function onLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' }) // clearUserSession
  await clear()        // user → null, loggedIn → false 
  await navigateTo('/') 
}
</script>

<template>
  <SidebarGroup>
    <SidebarGroupContent>
      <SidebarMenu>
        <SidebarMenuItem v-for="item in items" :key="item.title">
          <SidebarMenuButton as-child>
            <NuxtLink :to="item.url">
              <Icon v-if="item.icon" :name="item.icon" class="h-4 w-4" />
              {{ item.title }}
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      
      <Button        
        class="bg-sidebar-primary text-sidebar-primary-foreground w-full shadow-none"
        size="sm"
        @click="onLogout"
      >
        <LogOutIcon class="h-4 w-4" />
        Desconectarse
      </Button>
    </SidebarGroupContent>
  </SidebarGroup>
</template>