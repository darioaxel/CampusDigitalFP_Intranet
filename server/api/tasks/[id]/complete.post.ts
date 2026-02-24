// Al completar la task de revisión de horario
const completeTask = async () => {
  // 1. Validar/Rechazar el horario
  await $fetch(`/api/schedules/${scheduleId}/validate`, {
    method: 'POST',
    body: { action: 'VALIDAR', taskId: taskId }
  })
  
  // 2. Completar la task (si no se hace automáticamente)
  await $fetch(`/api/tasks/${taskId}/complete`, { method: 'POST' })
}