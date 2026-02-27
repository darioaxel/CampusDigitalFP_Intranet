# Componentes de Calendario

Esta carpeta contiene componentes reutilizables para la gestión y visualización de calendarios.

## Componentes

### CalendarMonthCard

Card individual que muestra un mes completo con eventos y selección de días.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `year` | `number` | - | Año del mes a mostrar |
| `month` | `number` | - | Mes (0-11, donde Enero = 0) |
| `events` | `CalendarMonthEvent[]` | `[]` | Eventos a mostrar en el calendario |
| `selectedDays` | `string[]` | `[]` | Días seleccionados (formato YYYY-MM-DD) |
| `selectable` | `boolean` | `false` | Permite seleccionar días |
| `showWeekends` | `boolean` | `true` | Muestra días de fin de semana |
| `showEventIndicators` | `boolean` | `true` | Muestra indicadores de eventos (puntos) |
| `compact` | `boolean` | `false` | Modo compacto para grids |
| `readonly` | `boolean` | `false` | Solo lectura, sin interacciones |
| `dayClass` | `(day: CalendarDay) => string` | - | Función para clases CSS personalizadas |

**Emits:**

| Evento | Parámetros | Descripción |
|--------|------------|-------------|
| `day-click` | `(date: string, day: CalendarDay)` | Click en un día |
| `day-mousedown` | `(date: string, day: CalendarDay)` | Mouse down en un día |
| `day-mouseenter` | `(date: string, day: CalendarDay)` | Mouse enter en un día |
| `day-mouseup` | `(date: string, day: CalendarDay)` | Mouse up en un día |

**Ejemplo de uso:**

```vue
<template>
  <CalendarMonthCard
    :year="2024"
    :month="8"
    :events="events"
    :selected-days="selectedDays"
    :selectable="true"
    @day-click="handleDayClick"
  />
</template>

<script setup lang="ts">
import type { CalendarMonthEvent } from '~/components/calendar/CalendarMonthCard.vue'

const events = ref<CalendarMonthEvent[]>([
  {
    id: '1',
    title: 'Festivo',
    startDate: '2024-09-15',
    type: 'HOLIDAY',
    color: '#EF4444'
  }
])

const selectedDays = ref<string[]>([])

function handleDayClick(date: string) {
  console.log('Día seleccionado:', date)
}
</script>
```

---

### CalendarMonthGrid

Grid de múltiples cards de meses para visualizar un rango de fechas completo.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `startDate` | `string \| Date` | - | Fecha de inicio del rango |
| `endDate` | `string \| Date` | - | Fecha de fin del rango |
| `events` | `CalendarMonthEvent[]` | `[]` | Eventos a mostrar |
| `selectable` | `boolean` | `false` | Permite seleccionar días |
| `showWeekends` | `boolean` | `true` | Muestra fines de semana |
| `showEventIndicators` | `boolean` | `true` | Muestra indicadores de eventos |
| `compact` | `boolean` | `false` | Modo compacto |
| `readonly` | `boolean` | `false` | Solo lectura |
| `columns` | `number` | `3` | Número de columnas (1-4) |
| `dayClass` | `(day: CalendarDay) => string` | - | Clases CSS personalizadas |

**Emits:**

| Evento | Parámetros | Descripción |
|--------|------------|-------------|
| `day-click` | `(date: string, day: CalendarDay)` | Click en un día |
| `day-mousedown` | `(date: string, day: CalendarDay)` | Mouse down |
| `day-mouseenter` | `(date: string, day: CalendarDay)` | Mouse enter |
| `day-mouseup` | `(date: string, day: CalendarDay)` | Mouse up |
| `selection-change` | `(selectedDays: string[])` | Cambio en selección |

**Métodos expuestos (ref):**

| Método | Retorno | Descripción |
|--------|---------|-------------|
| `clearSelection()` | `void` | Limpia la selección |
| `selectAll()` | `void` | Selecciona todos los días laborables |
| `getSelectedDays()` | `string[]` | Obtiene días seleccionados |

**Ejemplo de uso:**

```vue
<template>
  <div class="space-y-4">
    <div class="flex gap-2">
      <Button @click="monthGrid?.clearSelection()">Limpiar</Button>
      <Button @click="monthGrid?.selectAll()">Seleccionar todos</Button>
    </div>
    
    <CalendarMonthGrid
      ref="monthGrid"
      start-date="2024-09-01"
      end-date="2025-06-30"
      :events="events"
      :selectable="true"
      :columns="3"
      @selection-change="handleSelectionChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CalendarMonthGrid from '~/components/calendar/CalendarMonthGrid.vue'

const monthGrid = ref<InstanceType<typeof CalendarMonthGrid> | null>(null)

function handleSelectionChange(days: string[]) {
  console.log('Días seleccionados:', days)
}
</script>
```

---

### SimpleCalendar

Calendario mensual simple sin dependencias externas. Muestra eventos en una vista mensual con navegación.

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `events` | `CalendarEvent[]` | `[]` | Eventos a mostrar |
| `initialDate` | `Date` | `new Date()` | Fecha inicial |

**Emits:**

| Evento | Parámetros | Descripción |
|--------|------------|-------------|
| `event-click` | `(eventId: string)` | Click en un evento |

---

### CalendarDnd

Calendario con funcionalidad de drag-and-drop para asignación de eventos a usuarios. Usa Schedule-X.

---

## Componentes de Diálogo

Ubicados en `calendar/dialogs/`:

### ConfirmDialog
Modal de confirmación genérico para acciones destructivas o importantes.

```vue
<ConfirmDialog
  v-model:open="showDeleteModal"
  title="Eliminar elemento"
  description="¿Estás seguro?"
  icon="lucide:trash-2"
  icon-class="text-destructive"
  confirm-variant="destructive"
  :loading="isLoading"
  @confirm="handleConfirm"
/>
```

### EventFormDialog
Formulario para crear/editar eventos de calendario.

```vue
<EventFormDialog
  v-model:open="showModal"
  :event="editingEvent"
  :default-start-date="selectedDate"
  @submit="handleSubmit"
/>
```

### ExamPeriodDialog
Modal para marcar días como período de evaluación.

```vue
<ExamPeriodDialog
  v-model:open="showExamModal"
  :selected-days-count="5"
  :selected-days-text="'15-20 Septiembre'"
  @submit="({ type, description }) => {}"
/>
```

**Props:**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `events` | `CalendarEvent[]` | - | Eventos del calendario |
| `userAssignments` | `UserAssignment[]` | `[]` | Asignaciones del usuario |
| `maxAssignments` | `number` | `4` | Máximo de asignaciones |
| `allowDragFromCalendar` | `boolean` | `false` | Permite arrastrar desde calendario |
| `allowDropToCalendar` | `boolean` | `true` | Permite asignar desde calendario |
| `readOnly` | `boolean` | `false` | Modo solo lectura |

**Emits:**

| Evento | Parámetros | Descripción |
|--------|------------|-------------|
| `assign` | `(eventId: string)` | Asignar evento |
| `unassign` | `(assignmentId: string)` | Desasignar evento |
| `event-click` | `(eventId: string)` | Click en evento |

## Tipos

### CalendarMonthEvent

```typescript
interface CalendarMonthEvent {
  id: string
  title: string
  startDate: string // YYYY-MM-DD
  endDate?: string | null // YYYY-MM-DD
  type?: 'HOLIDAY' | 'LECTIVE' | 'EVALUATION' | 'FREE_DISPOSITION' | 'MEETING' | 'DEADLINE' | 'OTHER'
  color?: string | null
}
```

### CalendarDay

```typescript
interface CalendarDay {
  date: string // YYYY-MM-DD
  day: number // 1-31
  isCurrentMonth: boolean
  isWeekend: boolean
  isHoliday: boolean
  isExam: boolean
  events: CalendarMonthEvent[]
  eventCount: number
  empty: boolean // Día vacío (relleno)
}
```

## Uso en el proyecto

Los componentes se utilizan en:

- `pages/admin/calendarios/[id]/dias.vue` - Gestión de días del calendario (usa CalendarMonthGrid)
- `pages/usuario/calendarios/[id].vue` - Vista de calendario para usuarios
- `pages/usuario/calendarios/libre-disposicion/[id].vue` - Calendario de libre disposición (usa CalendarDnd)
