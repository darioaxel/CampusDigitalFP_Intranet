<script setup lang="ts">
import { ChevronRight } from "lucide-vue-next"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { Icon } from '#components'

const props = defineProps<{
  title: string 
  items: {
    title: string
    url: string
    icon?: string
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}>()

const route = useRoute()

// Detectar si una ruta está activa comparando con la ruta actual
function isRouteActive(url: string): boolean {
  if (!url || url === '#') return false
  return route.path === url || route.path.startsWith(url + '/')
}

// Detectar si algún sub-item está activo
function hasActiveSubItem(subItems?: { url: string }[]): boolean {
  if (!subItems) return false
  return subItems.some(sub => isRouteActive(sub.url))
}

// Computed para items con estado activo calculado dinámicamente
const itemsWithActiveState = computed(() => {
  return props.items.map(item => {
    const subItemsActive = hasActiveSubItem(item.items)
    const itemActive = isRouteActive(item.url)
    const isActive = itemActive || subItemsActive
    
    return {
      ...item,
      isActive,
      items: item.items?.map(sub => ({
        ...sub,
        isActive: isRouteActive(sub.url)
      }))
    }
  })
})
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel>{{title}}</SidebarGroupLabel>
    <SidebarMenu>
      <Collapsible
        v-for="item in itemsWithActiveState"
        :key="item.title"
        as-child
        :default-open="item.isActive"
        class="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger as-child>
            <SidebarMenuButton :tooltip="item.title" :is-active="item.isActive">
              <Icon :name="item.icon" v-if="item.icon" />
              <span class="group-data-[collapsible=icon]:hidden">{{ item.title }}</span>
              <ChevronRight class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              <SidebarMenuSubItem v-for="subItem in item.items" :key="subItem.title">
                <SidebarMenuSubButton as-child :is-active="subItem.isActive">                  
                  <NuxtLink :to="subItem.url">
                    <span>{{ subItem.title }}</span>
                  </NuxtLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  </SidebarGroup>
</template>
