<script setup lang="ts">
defineProps<{
  schedules: any[]
  loading?: boolean
}>()

defineEmits(['refresh'])
</script>

<template>
  <div class="space-y-4">
    <ScheduleCard 
      v-for="schedule in schedules" 
      :key="schedule.id"
      :schedule="schedule"
    />
  </div>
</template>