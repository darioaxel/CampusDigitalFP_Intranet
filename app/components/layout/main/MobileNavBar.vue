<template>
  <Sheet>
    <SheetTrigger as-child class="lg:hidden">
      <Button variant="ghost" size="icon">
        <Icon name="lucide:menu" class="h-6 w-6" />
        <span class="sr-only">Abrir menú</span>
      </Button>
    </SheetTrigger>

    <SheetContent side="right" class="w-80">
      <SheetHeader>
        <SheetTitle class="flex items-center gap-2 text-tyto-primary">
          <Icon name="lucide:home" class="w-6 h-6" />
          Menú
        </SheetTitle>
      </SheetHeader>

      <nav class="flex flex-col gap-4 mt-8">
        <!-- Mobile menu items -->
        <template v-for="item in navItems" :key="item.href">
          <!-- Regular items without children -->
          <NuxtLink v-if="item.type === 'auth-login' && !loggedIn" :to="item.href"
            class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-tyto-primary/10 hover:text-tyto-primary"
            :class="{ 'bg-tyto-primary/10 text-tyto-primary': isActive(item.href) }">
            <Icon v-if="item.icon" :name="item.icon" class="h-5 w-5" />
            <span class="font-medium">{{ item.label }}</span>
          </NuxtLink>

          <NuxtLink v-else-if="item.type === 'auth-profile' && loggedIn" :to="item.href"
            class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-tyto-primary/10 hover:text-tyto-primary"
            :class="{ 'bg-tyto-primary/10 text-tyto-primary': isActive(item.href) }">
            <Icon v-if="item.icon" :name="item.icon" class="h-5 w-5" />
            <span class="font-medium">{{ item.label }}</span>
          </NuxtLink>

          <NuxtLink v-else-if="!item.type" :to="item.href"
            class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-tyto-primary/10 hover:text-tyto-primary"
            :class="{ 'bg-tyto-primary/10 text-tyto-primary': isActive(item.href) }">
            <Icon v-if="item.icon" :name="item.icon" class="h-5 w-5" />
            <span class="font-medium">{{ item.label }}</span>
          </NuxtLink>

          <!-- Items with children (Socios dropdown) -->
          <template v-else-if="item.children?.length && !item.type">
            <Separator class="my-2" />

            <!-- Parent label -->
            <div class="px-4">
              <p class="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <Icon v-if="item.icon" :name="item.icon" class="h-4 w-4" />
                {{ item.label }}
              </p>

              <!-- Children links (already filtered) -->
              <NuxtLink v-for="child in item.children" :key="child.href" :to="child.href"
                class="flex items-center gap-3 py-2 text-sm transition-colors hover:text-tyto-primary ml-4"
                :class="{ 'bg-tyto-primary/10 text-tyto-primary rounded-md px-2': isActive(child.href) }">
                <Icon v-if="child.icon" :name="child.icon" class="h-4 w-4" />
                {{ child.label }}
              </NuxtLink>
            </div>
          </template>
        </template>

        <!-- Auth section separator -->
        <Separator class="my-4" />

        <!-- Authentication buttons (si no están en la lista principal) -->
        <template v-if="!loggedIn">
          <NuxtLink to="/signup">
            <Button variant="outline" class="w-full">
              <Icon name="lucide:user-plus" class="mr-2 h-4 w-4" />
              Hazte Socio
            </Button>
          </NuxtLink>

          <NuxtLink to="/login">
            <Button class="w-full bg-tyto-primary hover:bg-tyto-primary/90">
              <Icon name="lucide:log-in" class="mr-2 h-4 w-4" />
              Iniciar Sesión
            </Button>
          </NuxtLink>
        </template>

        <template v-else>
          <NuxtLink to="/usuario">
            <Button class="w-full bg-tyto-primary hover:bg-tyto-primary/90">
              <Icon name="lucide:user" class="mr-2 h-4 w-4" />
              Mi Área
            </Button>
          </NuxtLink>

          <Button variant="outline" class="w-full" @click="$emit('logout')">
            <Icon name="lucide:log-out" class="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </template>
      </nav>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { useRoute } from '#app'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Icon } from '#components'

interface Props {
  navItems: any[]
  loggedIn: boolean
}

defineProps<Props>()
defineEmits(['logout'])

const route = useRoute()
const isActive = (path: string) => route.path === path
</script>