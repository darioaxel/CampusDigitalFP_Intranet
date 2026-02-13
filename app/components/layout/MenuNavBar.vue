<template>
  <div class="hidden lg:flex items-center gap-4">
    <NavigationMenu>
      <NavigationMenuList class="gap-6">
        <template v-for="item in navItems" :key="item.href">    
          <!-- Regular items -->
          <NavigationMenuItem>
            <NavigationMenuLink as-child>
              <NuxtLink :to="item.href"
                class="group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-tyto-primary/10 hover:text-tyto-primary focus:bg-tyto-primary/10 focus:text-tyto-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                :class="{ 'bg-tyto-primary/10 text-tyto-primary': isActive(item.href) }">
                 <span class="relative flex items-center gap-2">
                 <Icon v-if="item.icon" :name="item.icon" class="h-5 w-5" />
                {{ item.label }}</span>
              </NuxtLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </template>
      </NavigationMenuList>
    </NavigationMenu>

    <!-- Desktop Login/Profile (botones fijos) -->
    <NuxtLink v-if="!loggedIn" to="/login">
      <Button variant="outline" class="border-tyto-primary text-tyto-primary hover:bg-tyto-primary hover:text-white">
        <Icon name="lucide:log-in" class="mr-2 h-4 w-4" />
        Login
      </Button>
    </NuxtLink>
    <NuxtLink v-else to="#">
      <Button variant="outline" class="border-tyto-primary text-tyto-primary hover:bg-tyto-primary hover:text-white">
        <Icon name="lucide:user" class="mr-2 h-4 w-4" />
        Mi Área
      </Button>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from '#app'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Icon } from '#components'

interface Props {
  navItems: any[]
  loggedIn: boolean
}

defineProps<Props>()
const route = useRoute()

const isActive = (path: string) => route.path === path
</script>