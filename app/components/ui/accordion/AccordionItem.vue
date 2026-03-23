<script setup lang="ts">
import { AccordionItem, type AccordionItemProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<AccordionItemProps & { class?: string }>()
</script>

<template>
  <AccordionItem :class="cn('border-b', props.class)" v-bind="props">
    <slot />
  </AccordionItem>
</template>
