<template>
  <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">

        <!-- Logo -->
        <div class="flex items-center gap-2">
          <NuxtLink to="/" class="flex items-center gap-2 font-bold text-xl text-tyto-primary">
            <Logo />           
          </NuxtLink>
        </div>

        <!-- Desktop Navigation -->
        <MenuNavBar :nav-items="desktopNavItems" :logged-in="loggedIn" />

        <!-- Mobile Navigation -->
        <MobileNavBar :nav-items="mobileNavItems" :logged-in="loggedIn" @logout="handleLogout" />

      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from '#app'
import { useUserSession } from '#imports'
import { siteConfig } from '@/lib/config'
import MenuNavBar from '@/components/layout/main/MenuNavBar.vue'
import MobileNavBar from '@/components/layout/main/MobileNavBar.vue'
import Logo from '@/components/layout/main/Logo.vue'

const { loggedIn } = useUserSession()

// Desktop: excluye items de auth tipo 'auth-login', 'auth-signup', 'auth-profile'
// Los botones de login/profile se manejan aparte en el componente
const desktopNavItems = computed(() => {
  return siteConfig.navItems.filter(item => {
    if (item.requiresAuth && !loggedIn.value) return false
    // Excluye items de auth que se manejan con botones separados    
    return true
  })
})

// Mobile: muestra todos los items visibles (incluye login/signup/profile en la lista)
const mobileNavItems = computed(() => {
  return siteConfig.navItems.filter(item => {
    if (item.requiresAuth && !loggedIn.value) return false
    return true
  })
})

const handleLogout = async () => {
  const { clear } = useUserSession()
  await clear()
  await navigateTo('/')
}
</script>