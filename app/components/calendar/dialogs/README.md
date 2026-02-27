# Componentes de Diálogo para Calendarios

Componentes reutilizables de modales/diálogos para la gestión de calendarios.

## Componentes

### ConfirmDialog

Modal de confirmación genérico para acciones destructivas o importantes.

```vue
<template>
  <ConfirmDialog
    v-model:open="showDeleteModal"
    title="Eliminar elemento"
    description="¿Estás seguro de que deseas eliminar este elemento?"
    icon="lucide:trash-2"
    icon-class="text-destructive"
    confirm-text="Eliminar"
    confirm-variant="destructive"
    :loading="isLoading"
    @confirm="handleConfirm"
  />
</template>
```

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `open` | `boolean` | - | Controla la visibilidad del modal |
| `title` | `string` | - | Título del modal |
| `description` | `string` | `''` | Descripción opcional |
| `icon` | `string` | `'lucide:alert-triangle'` | Icono a mostrar |
| `iconClass` | `string` | `'text-amber-500'` | Clases CSS del icono |
| `cancelText` | `string` | `'Cancelar'` | Texto del botón cancelar |
| `confirmText` | `string` | `'Confirmar'` | Texto del botón confirmar |
| `confirmVariant` | `string` | `'default'` | Variante del botón confirmar |
| `loading` | `boolean` | `false` | Estado de carga |
| `disabled` | `boolean` | `false` | Deshabilitar botón confirmar |

**Slots:**
- `description` - Contenido personalizado para la descripción
- Default - Contenido adicional entre la descripción y los botones

**Emits:**
- `update:open` - Cambio de visibilidad
- `confirm` - Click en confirmar
- `cancel` - Click en cancelar

---

### EventFormDialog

Modal con formulario para crear o editar eventos de calendario.

```vue
<template>
  <EventFormDialog
    v-model:open="showModal"
    :event="editingEvent"
    :default-start-date="selectedDate"
    :loading="saving"
    @submit="handleSubmit"
  />
</template>

<script setup>
function handleSubmit(payload) {
  // payload contiene todos los campos del evento
  console.log(payload)
}
</script>
```

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `open` | `boolean` | - | Visibilidad del modal |
| `event` | `CalendarEvent \| null` | `null` | Evento a editar (null para crear) |
| `defaultStartDate` | `string` | `''` | Fecha inicial por defecto |
| `loading` | `boolean` | `false` | Estado de carga |

**Emits:**
- `update:open` - Cambio de visibilidad
- `submit` - Envío del formulario con el payload

---

### ExamPeriodDialog

Modal para marcar días seleccionados como período de evaluación.

```vue
<template>
  <ExamPeriodDialog
    v-model:open="showExamModal"
    :selected-days-count="selectedDays.length"
    :selected-days-text="selectedDaysText"
    :loading="saving"
    @submit="handleExamSubmit"
  />
</template>

<script setup>
function handleExamSubmit({ type, description }) {
  console.log('Tipo:', type)
  console.log('Descripción:', description)
}
</script>
```

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `open` | `boolean` | - | Visibilidad del modal |
| `selectedDaysCount` | `number` | - | Número de días seleccionados |
| `selectedDaysText` | `string` | - | Texto descriptivo de los días |
| `loading` | `boolean` | `false` | Estado de carga |

**Emits:**
- `update:open` - Cambio de visibilidad
- `submit` - Envío con `{ type, description }`

---

## Uso combinado

Ejemplo de uso en una página de gestión de calendario:

```vue
<template>
  <div>
    <!-- Botones de acción -->
    <Button @click="showEventModal = true">Nuevo Evento</Button>
    <Button @click="showExamModal = true" :disabled="selectedDays.length === 0">
      Marcar Exámenes
    </Button>
    <Button @click="showDeleteModal = true" variant="destructive">
      Eliminar
    </Button>

    <!-- Modales -->
    <EventFormDialog
      v-model:open="showEventModal"
      :event="editingEvent"
      @submit="saveEvent"
    />
    
    <ExamPeriodDialog
      v-model:open="showExamModal"
      :selected-days-count="selectedDays.length"
      :selected-days-text="selectedDaysText"
      @submit="markAsExams"
    />
    
    <ConfirmDialog
      v-model:open="showDeleteModal"
      title="Eliminar eventos"
      description="¿Eliminar los eventos seleccionados?"
      icon="lucide:trash-2"
      icon-class="text-destructive"
      confirm-variant="destructive"
      @confirm="deleteEvents"
    />
  </div>
</template>

<script setup>
const showEventModal = ref(false)
const showExamModal = ref(false)
const showDeleteModal = ref(false)
const selectedDays = ref([])
const editingEvent = ref(null)

const selectedDaysText = computed(() => {
  return selectedDays.value.join(', ')
})

async function saveEvent(payload) {
  await createEvent(payload)
  showEventModal.value = false
}

async function markAsExams({ type, description }) {
  await createExamEvents(selectedDays.value, type, description)
  showExamModal.value = false
}

async function deleteEvents() {
  await deleteSelectedEvents()
  showDeleteModal.value = false
}
</script>
```
