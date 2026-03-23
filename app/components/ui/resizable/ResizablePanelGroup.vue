<script setup lang="ts">
import { SplitterGroup, type SplitterGroupEmits, type SplitterGroupProps, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<SplitterGroupProps & { class?: string }>()
const emits = defineEmits<SplitterGroupEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <SplitterGroup
    v-bind="forwarded"
    :class="cn('flex h-full w-full data-[panel-group-direction=vertical]:flex-col', props.class)"
  >
    <slot />
  </SplitterGroup>
</template>
