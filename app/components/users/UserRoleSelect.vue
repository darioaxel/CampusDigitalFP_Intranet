<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { availableRoles, getRoleBadgeVariant, getRoleLabel } from './columns'

interface Props {
  role: string
  userId: string
  onChange: (userId: string, newRole: string) => void
}

defineProps<Props>()
</script>

<template>
  <Select
    :model-value="role"
    @update:model-value="(newRole) => onChange(userId, newRole)"
  >
    <SelectTrigger class="w-36">
      <Badge :variant="getRoleBadgeVariant(role)" class="font-normal">
        {{ getRoleLabel(role) }}
      </Badge>
    </SelectTrigger>
    <SelectContent>
      <SelectItem
        v-for="r in availableRoles"
        :key="r.value"
        :value="r.value"
      >
        {{ r.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
