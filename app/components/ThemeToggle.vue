<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const colorMode = useColorMode()

const setTheme = (theme: 'light' | 'dark' | 'system') => {
  colorMode.preference = theme
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" class="h-9 w-9">
        <Icon 
          name="lucide:sun" 
          class="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" 
        />
        <Icon 
          name="lucide:moon" 
          class="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" 
        />
        <span class="sr-only">Cambiar tema</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="setTheme('light')">
        <Icon name="lucide:sun" class="mr-2 h-4 w-4" />
        Claro
      </DropdownMenuItem>
      <DropdownMenuItem @click="setTheme('dark')">
        <Icon name="lucide:moon" class="mr-2 h-4 w-4" />
        Oscuro
      </DropdownMenuItem>
      <DropdownMenuItem @click="setTheme('system')">
        <Icon name="lucide:monitor" class="mr-2 h-4 w-4" />
        Sistema
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
