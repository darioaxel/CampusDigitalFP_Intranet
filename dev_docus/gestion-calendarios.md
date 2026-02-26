# GESTIÓN DE CALENDARIOS

## Requisitos de Acceso
 * Solo los admin y root pueden acceder a la gestión de calendarios.
 * Los calendarios abarcan un curso academíco completo: desde el 1 de septiembre de un año hasta el 31 de julio del siguiente año. Ejemplo: curso 2025 - 2026. Desde el 1 de septiembre de 2025 hasta el 31 de julio de 2026.

## Tipos de Calendarios
 * Los admin pueden crear calendarios los cuales pueden definirse como templates o plantillas.
 * **TEMPLATE**: Plantilla base que sirve para crear otros calendarios. No es visible para usuarios.
 * **SCHOOL_YEAR**: Calendario escolar del curso.
 * **FREE_DISPOSITION**: Calendario de días de libre disposición (especial, solo uno activo).
 * **EVALUATION**: Calendario de evaluaciones.
 * **MEETINGS**: Reuniones y eventos.

## Vistas de Gestión

### 1. Vista Principal de Calendarios (`/admin/calendarios`)
Muestra la lista de todos los calendarios con:
- Filtros por tipo, año académico y estado
- Tabla con información básica (nombre, tipo, año, eventos, creador)
- **Botón Activar/Desactivar**: Toggle amarillo/gris que permite activar o desactivar el calendario
- Acciones rápidas: clonar desde plantilla, editar días, editar calendario, gestionar eventos, eliminar

### 2. Vista de Edición de Días (`/admin/calendarios/[id]/dias`)

**Acceso**: Botón "Editar días" (icono grid) en la tabla de calendarios.

**Funcionalidad**:
Esta vista permite configurar los días del calendario mediante un grid visual de meses:

- **Grid de meses**: Muestra todos los meses del curso académico (septiembre - julio) en formato de grid
- **Fines de semana**: Se muestran en gris claro y no son seleccionables (no laborables por defecto)
- **Colores de días**:
  - 🟢 Verde: Día lectivo normal
  - 🔴 Rojo: Día festivo marcado
  - 🟠 Ámbar: Periodo de evaluación/exámenes
  - 🔵 Azul: Día seleccionado actualmente

**Acciones disponibles** (barra superior):
- **Limpiar**: Deselecciona todos los días
- **Borrar formato**: Elimina el tipo de día (festivo/examen) de los días seleccionados, convirtiéndolos en días lectivos normales
- **Festivos**: Botón rojo que marca los días seleccionados como HOLIDAY
- **Exámenes**: Abre modal para indicar el tipo de evaluación (DAM/DAW, junio 1, junio 2, extraordinarios, proyectos...)

**Selección de días**:
- **Click simple**: Selecciona/deselecciona un día individual
- **Arrastrar**: Selecciona múltiples días arrastrando el ratón
- Los días seleccionados muestran un anillo azul alrededor

**Creación de eventos**:
- Al marcar festivos o exámenes, se crean automáticamente eventos en el calendario
- Los días consecutivos se agrupan en un solo evento con rango de fechas
- El formato se puede eliminar usando el botón "Borrar formato"

### 3. Vista de Gestión de Eventos (`/admin/calendarios/[id]/eventos`)

**Acceso**: Botón "Gestionar eventos" (icono calendario) en la tabla de calendarios.

**Funcionalidad**:
Esta vista permite gestionar eventos individuales del calendario:

- **Vista previa del calendario**: Visualización mensual con los eventos existentes
- **Lista de eventos**: Tabla con todos los eventos del calendario mostrando:
  - Título y color identificativo
  - Tipo (Festivo, Evaluación, Libre disposición, etc.)
  - Fechas (inicio y fin)
  - Asignaciones (para eventos de libre disposición)
  - Estado (activo/inactivo)

**Acciones disponibles**:
- **Crear evento**: Modal con formulario para añadir nuevo evento
  - Título y descripción
  - Tipo de evento (HOLIDAY, LECTIVE, EVALUATION, etc.)
  - Fechas de inicio y fin
  - Color personalizado
  - Máximo de asignaciones (para libre disposición)
- **Editar evento**: Modifica datos de un evento existente
- **Eliminar evento**: Borra el evento del calendario

## Flujo de Creación de Calendarios

### Crear desde Plantilla
1. En `/admin/calendarios`, click en "Desde Plantilla"
2. Seleccionar plantilla base del listado
3. Configurar:
   - Nombre del nuevo calendario
   - Tipo (SCHOOL_YEAR, FREE_DISPOSITION, etc.)
   - Año académico (ej: 2027-2028)
   - Fechas (se ajustan automáticamente según el año)
4. El sistema clona todos los eventos ajustando las fechas al nuevo año
5. Redirige a edición de días para personalizar

### Crear Calendario de Libre Disposición
1. Crear calendario tipo FREE_DISPOSITION (o desde plantilla)
2. **Automáticamente se generan todos los días de libre disposición**:
   - Todos los días lectivos (lunes a viernes no festivos) del curso
   - Cada día tiene `maxAssignments: 3` (máximo 3 profesores)
   - Contador de asignaciones inicializado en 0
3. Validación: Solo puede haber un calendario de libre disposición activo a la vez
4. Los profesores podrán solicitar días desde `/usuario/solicitudes/libre-disposicion`

**Nota**: Al crear el calendario, el sistema genera automáticamente ~180-200 eventos (todos los días lectivos del curso). No es necesario configurarlos manualmente.

## Estados de Calendario

### Activar/Desactivar
- Un calendario puede estar activo (visible para todos los usuarios) o inactivo
- El admin usa el toggle amarillo/gris en la tabla principal
- **Amarillo (Activo)**: El calendario es visible y usable
- **Gris (Inactivo)**: El calendario existe pero no es visible para usuarios

### Validaciones
- Solo puede haber un calendario de tipo "dias de libre disposición" activo a la vez
- Al intentar activar uno nuevo, el sistema muestra error si ya existe otro activo
- Los calendarios deben abarcar el curso completo: 1 septiembre - 31 julio

## Estructura de Archivos

```
app/pages/admin/calendarios/
├── index.vue              # Vista principal (lista de calendarios)
└── [id]/
    ├── dias.vue           # Edición de días (grid de selección)
    └── eventos.vue        # Gestión de eventos individuales

server/api/calendars/
├── index.get.ts           # Listar calendarios
├── index.post.ts          # Crear calendario
├── [id].get.ts            # Obtener calendario
├── [id].put.ts            # Actualizar calendario
├── [id].delete.ts         # Eliminar calendario
├── [id]/
│   └── events/
│       ├── index.post.ts  # Crear evento
│       └── [eventId].delete.ts  # Eliminar evento
└── templates/
    ├── index.get.ts       # Listar plantillas
    └── [id]/
        └── clone.post.ts  # Clonar plantilla
```

## APIs Principales

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/calendars` | GET | Listar calendarios con filtros |
| `/api/calendars` | POST | Crear nuevo calendario |
| `/api/calendars/[id]` | PUT | Actualizar calendario (incluye isActive) |
| `/api/calendars/[id]/events` | POST | Crear evento en calendario |
| `/api/calendars/[id]/events/[eventId]` | DELETE | Eliminar evento |
| `/api/calendars/templates` | GET | Listar plantillas disponibles |
| `/api/calendars/templates/[id]/clone` | POST | Clonar plantilla a nuevo calendario |
