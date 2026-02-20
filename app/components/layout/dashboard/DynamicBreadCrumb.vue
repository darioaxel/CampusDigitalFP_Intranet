<!-- components/DynamicBreadcrumb.vue -->
<template>
  <Breadcrumb>
    <BreadcrumbList>
      <template v-for="(crumb, index) in breadcrumbs" :key="index">
        <BreadcrumbItem v-if="index < breadcrumbs.length - 1" class="hidden md:block">
          <BreadcrumbLink :href="crumb.path">
            {{ crumb.label }}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem v-else>
          <BreadcrumbPage>{{ crumb.label }}</BreadcrumbPage>
        </BreadcrumbItem>
        <BreadcrumbSeparator v-if="index < breadcrumbs.length - 1" class="hidden md:block" />
      </template>
    </BreadcrumbList>
  </Breadcrumb>
</template>

<script setup lang="ts">
const props = defineProps<{
  url: string
}>()

const breadcrumbs = computed(() => {
  const segments = props.url.split('/').filter(Boolean)
  const result = []

  let path = ''
  for (const segment of segments) {
    path += `/${segment}`
    result.push({
      label: segment.charAt(0).toUpperCase() + segment.slice(1),
      path,
    })
  }

  return result
})
</script>