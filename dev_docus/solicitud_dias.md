# Sistema de Gestión de Días de Libre Disposición

## Descripción General

El sistema de días de libre disposición permite a los profesores solicitar hasta 4 días de ausencia durante el curso académico. El sistema controla que no haya más de 3 profesores en libre disposición el mismo día.

El sistema utiliza el **motor de workflows configurable** (`server/utils/workflow/engine.ts`) que permite definir estados y transiciones de forma data-driven.

---

## Arquitectura del Workflow

### Motor de Workflow Configurable

Ubicación: `server/utils/workflow/engine.ts`

El motor proporciona:
- **Estados configurables**: Definidos en BD (`WorkflowState`)
- **Transiciones controladas**: Con roles permitidos y validaciones
- **Historial completo**: Auditoría de cambios (`StateHistory`)
- **Acciones automáticas**: Notificaciones, actualización de calendario

### Definición del Workflow

Archivo: `prisma/seed/data/workflows.ts`

```typescript
code: 'request_free_day'
name: 'Día Libre Disposición'
entityType: 'REQUEST'
states: [
  { code: 'pending', name: 'Pendiente', color: 'amber', isInitial: true },
  { code: 'approved', name: 'Aprobada', color: 'green', isFinal: true },
  { code: 'rejected', name: 'Rechazada', color: 'red', isFinal: true, isTerminal: true }
]
transitions: [
  { fromCode: 'pending', toCode: 'approved', allowedRoles: ['ADMIN', 'ROOT'], requiresComment: true, autoActions: ['create_notification'] },
  { fromCode: 'pending', toCode: 'rejected', allowedRoles: ['ADMIN', 'ROOT'], requiresComment: true, autoActions: ['create_notification'] }
]
```

---

## Flujo de Funcionamiento

### 1. Creación del Calendario (Admin)

**Reglas importantes:**
- Solo puede haber **un calendario activo** (`isActive: true`) por tipo
- El período del calendario es el **curso académico completo**: 1 de septiembre al 30 de junio
- Se pueden tener múltiples calendarios en la BD pero solo uno estará habilitado

A principio de curso, el administrador crea un calendario de tipo `FREE_DISPOSITION`:

```
POST /api/calendars
{
  "name": "Días Libre Disposición 2025-2026",
  "type": "FREE_DISPOSITION",
  "academicYear": "2025-2026",
  "maxEventsPerUser": 4,
  "isPublic": true,
  "startDate": "2025-09-01",
  "endDate": "2026-06-30"
}
```

Cada día disponible se crea como un `CalendarEvent` con:
- `type: FREE_DISPOSITION`
- `maxAssignments: 3` (máximo 3 profesores por día)
- `isAllDay: true`
- Días generados: todos los días lectivos (lunes a viernes) excluyendo festivos de Aragón

### 2. Vista del Profesor

**Ruta:** `/usuario/solicitudes/libre-disposicion`

**Componente:** `app/pages/usuario/solicitudes/libre-disposicion.vue`

#### Funcionalidad:
1. Muestra calendario mensual tipo "pared" (grid de celdas)
2. Cada celda muestra el contador `X/3` (solicitudes aprobadas / máximo)
3. Colores de celdas:
   - 🟢 **Verde**: Tu día aprobado
   - 🟠 **Ámbar**: Tu solicitud pendiente
   - ⚪ **Blanco**: Disponible (0-2 solicitudes)
   - 🔴 **Rojo**: Completo (3/3)
   - ⚫ **Gris oscuro**: No disponible (festivo/finde)
   - ⬜ **Gris claro**: Fuera del período del calendario (meses anteriores o posteriores al curso)

4. **Navegación restringida**: Los botones de mes anterior/siguiente se deshabilitan al llegar a los límites del curso (no se puede navegar a años anteriores o posteriores)
5. Al hacer clic en día disponible → Modal de confirmación
6. El profesor puede añadir motivo opcional
7. Al confirmar → Se crea solicitud con workflow

### 3. APIs del Profesor

#### Obtener calendario con contadores
```
GET /api/calendars/free-disposition
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "calendar": {
      "id": "...",
      "name": "Días Libre Disposición 2025-2026",
      "academicYear": "2025-2026",
      "maxPerUser": 4,
      "startDate": "2025-09-01",
      "endDate": "2026-06-30"
    },
    "days": [
      {
        "date": "2025-10-15",
        "isAvailable": true,
        "approvedCount": 2,
        "maxAllowed": 3,
        "isFull": false,
        "myStatus": null,
        "myRequestId": null,
        "canRequest": true
      }
    ],
    "myStats": {
      "approved": 2,
      "pending": 1,
      "used": 3,
      "remaining": 1,
      "hasReachedLimit": false
    }
  }
}
```

#### Solicitar día
```
POST /api/calendars/free-disposition/request
{
  "date": "2025-10-15",
  "reason": "Asuntos personales"
}
```

**Proceso interno:**
1. Valida que la fecha esté en el calendario
2. Verifica que el usuario no haya excedido el límite de 4 días
3. Comprueba que no existe solicitud previa para esa fecha
4. Verifica que el día no tiene ya 3 solicitudes aprobadas
5. Crea la solicitud con:
   - `workflowId`: ID del workflow 'request_free_day'
   - `currentStateId`: Estado 'pending'
   - `context`: JSON con `{ type: 'FREE_DAY', date: '2025-10-15' }`
6. Crea entrada inicial en `StateHistory`

### 4. Proceso de Aprobación (Admin)

#### Vista de Gestión de Solicitudes
Las solicitudes aparecen en `/admin/solicitudes` y se gestionan desde `/admin/solicitudes/[id]`.

**Componente de diálogo:** `app/components/requests/FreeDayApprovalDialog.vue`

#### APIs para gestión

**Obtener detalle de solicitud:**
```
GET /api/requests/[id]
```

**Obtener detalles específicos para aprobación:**
```
GET /api/requests/[id]/details
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "request": {
      "id": "...",
      "title": "Día libre disposición - 2025-10-15",
      "description": "Asuntos personales",
      "status": "Pendiente",
      "statusCode": "pending",
      "requestedDate": "2025-10-15"
    },
    "teacher": {
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "stats": { "approved": 2, "pending": 1, "total": 3 }
    },
    "sameDay": {
      "approvedCount": 2,
      "teachers": [{ "name": "Ana García" }, { "name": "Luis Martín" }]
    }
  }
}
```

**Obtener transiciones disponibles:**
```
GET /api/requests/[id]/transitions
```

**Ejecutar transición (aprobar/rechazar):**
```
POST /api/requests/[id]/transition
{
  "toState": "approved",
  "comment": "Observaciones...",
  "metadata": {}
}
```

**Nota:** El parámetro es `toState` (código del estado), no `toStatus`.

#### Acciones Automáticas al Aprobar

El motor de workflow ejecuta automáticamente:

1. **`create_notification`**: Crea notificación al solicitante
2. **`update_calendar`**: Crea registro en `UserCalendarEvent`

```typescript
// En engine.ts
private async updateCalendar(entity, context, tx) {
  if (entity.workflow?.code === 'request_free_day' && 
      entity.currentState?.code === 'approved') {
    const ctx = entity.context ? JSON.parse(entity.context) : {}
    if (ctx.requestedDate) {
      await tx.userCalendarEvent.create({
        data: {
          userId: entity.requesterId,
          date: new Date(ctx.requestedDate),
          type: 'FREE_DAY',
          title: 'Día de libre disposición'
        }
      })
    }
  }
}
```

---

## Modelos de Datos

### Workflow (Configuración)

```prisma
// workflow-config.prisma
model WorkflowDefinition {
  id          String   @id @default(uuid())
  code        String   @unique  // "request_free_day"
  name        String
  entityType  EntityType        // REQUEST
  version     Int      @default(1)
  isActive    Boolean  @default(true)
  states      WorkflowState[]
  transitions WorkflowTransition[]
  requests    Request[]
}

model WorkflowState {
  id          String   @id @default(uuid())
  workflowId  String
  code        String   // "pending", "approved", "rejected"
  name        String   // "Pendiente", "Aprobada"
  color       String   @default("gray")
  order       Int
  isInitial   Boolean  @default(false)
  isFinal     Boolean  @default(false)
  isTerminal  Boolean  @default(false)
}

model WorkflowTransition {
  id              String   @id @default(uuid())
  workflowId      String
  fromStateId     String
  toStateId       String
  allowedRoles    String   // JSON: ["ADMIN", "ROOT"]
  requiresComment Boolean  @default(false)
  autoActions     String?  // JSON: ["create_notification", "update_calendar"]
}
```

### Request (Solicitud)

```prisma
// workflow.prisma
model Request {
  id              String   @id @default(uuid())
  requesterId     String
  requester       User     @relation("RequestsCreated", fields: [requesterId], references: [id])
  
  // Workflow configurable
  workflowId      String
  workflow        WorkflowDefinition  @relation(fields: [workflowId], references: [id])
  currentStateId  String
  currentState    WorkflowState       @relation("RequestCurrentState", fields: [currentStateId], references: [id])
  
  // Contexto específico del tipo de solicitud (JSON polimórfico)
  context         String?  @db.Text  // { "type": "FREE_DAY", "date": "2025-10-15" }
  
  title           String
  description     String?  @db.Text
  requestedDate   DateTime?
  startDate       DateTime?
  endDate         DateTime?
  
  adminId         String?
  admin           User?    @relation("RequestsManaged", fields: [adminId], references: [id])
  adminNotes      String?  @db.Text
  
  documents       RequestDocument[]
  stateHistory    StateHistory[]
  activityLogs    ActivityLog[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Historial de Estados

```prisma
model StateHistory {
  id          String   @id @default(uuid())
  requestId   String?
  request     Request? @relation(fields: [requestId], references: [id])
  fromStateId String
  toStateId   String
  toState     WorkflowState @relation("HistoryToState", fields: [toStateId], references: [id])
  actorId     String
  actor       User     @relation(fields: [actorId], references: [id])
  comment     String?  @db.Text
  metadata    String?  @db.Text
  createdAt   DateTime @default(now())
}
```

### Calendario

```prisma
// calendars.prisma
model Calendar {
  id               String       @id @default(uuid())
  name             String
  type             CalendarType // FREE_DISPOSITION
  academicYear     String       // Ej: "2025-2026"
  maxEventsPerUser Int?         // 4 días máximo
  isActive         Boolean      @default(true)  // Solo uno activo por tipo
  isPublic         Boolean      @default(true)
  startDate        DateTime     // 1 de septiembre
  endDate          DateTime     // 30 de junio
  events           CalendarEvent[]
}

model CalendarEvent {
  id             String           @id @default(uuid())
  calendarId     String
  title          String
  type           CalendarEventType // FREE_DISPOSITION
  startDate      DateTime
  endDate        DateTime?
  maxAssignments Int?             // 3 máximo
  isActive       Boolean          @default(true)
  assignments    UserCalendarEvent[]
}

model UserCalendarEvent {
  id        String   @id @default(uuid())
  eventId   String
  event     CalendarEvent @relation(fields: [eventId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // FREE_DAY
  title     String
  date      DateTime
  notes     String?
  status    String   @default("CONFIRMED")
}
```

---

## APIs Completas

### APIs Públicas (Profesor)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/calendars/free-disposition` | GET | Obtiene calendario con contadores |
| `/api/calendars/free-disposition/request` | POST | Crea solicitud de día libre |
| `/api/requests/free-days` | GET | Obtiene días consumidos/diponibles |

### APIs de Gestión (Admin)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/requests` | GET | Lista todas las solicitudes |
| `/api/requests` | POST | Crea solicitud (también para NEW_USER) |
| `/api/requests/[id]` | GET | Obtiene detalle de solicitud |
| `/api/requests/[id]/transitions` | GET | Lista transiciones disponibles |
| `/api/requests/[id]/transition` | POST | Ejecuta transición de estado |
| `/api/requests/[id]/history` | GET | Obtiene historial de estados |
| `/api/requests/[id]/details` | GET | Detalles específicos para aprobación |
| `/api/requests/[id]/documents` | POST | Adjunta documento a solicitud |

### APIs de Workflow

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/workflows` | GET | Lista workflows disponibles |
| `/api/admin/workflows` | GET | Lista workflows para gestión |
| `/api/admin/workflows` | POST | Crea nuevo workflow |
| `/api/admin/workflows/[id]` | PUT | Actualiza workflow |
| `/api/admin/workflows/[id]/states` | POST | Añade estado al workflow |
| `/api/admin/workflows/[id]/transitions` | POST | Añade transición al workflow |

---

## Gestión del Calendario Activo

### Política de Calendario Único

El sistema está diseñado para mantener **un solo calendario de libre disposición activo**:

```typescript
// Al buscar calendario activo
const calendar = await prisma.calendar.findFirst({
  where: {
    type: 'FREE_DISPOSITION',
    isActive: true,  // ← Solo uno activo
  }
})
```

**Implicaciones:**
- Al crear un nuevo calendario, el anterior debe desactivarse (`isActive: false`)
- El calendario activo define el período de solicitud (curso académico actual)
- Las solicitudes solo se pueden hacer contra el calendario activo

### Período del Calendario

El calendario cubre el **curso académico completo**:

| Campo | Valor típico | Descripción |
|-------|--------------|-------------|
| `startDate` | 1 de septiembre | Inicio del curso |
| `endDate` | 30 de junio | Fin del curso |
| `academicYear` | "2025-2026" | Identificador del curso |

**API responde con fechas formateadas:**
```json
{
  "calendar": {
    "startDate": "2025-09-01",
    "endDate": "2026-06-30",
    "academicYear": "2025-2026"
  }
}
```

### Navegación del Calendario en Frontend

La vista del calendario (`libre-disposicion.vue`) implementa límites estrictos:

```typescript
// Límites del curso
const minDate = computed(() => new Date(calendar.value.startDate))
const maxDate = computed(() => new Date(calendar.value.endDate))

// Control de navegación
const canGoPrevMonth = computed(() => {
  const prevMonth = new Date(currentYear, currentMonth - 1, 1)
  const lastDayOfPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0)
  return lastDayOfPrevMonth >= minDate.value  // Solo si hay días del mes anterior en el curso
})

const canGoNextMonth = computed(() => {
  const nextMonth = new Date(currentYear, currentMonth + 1, 1)
  return nextMonth <= maxDate.value  // No permite ir más allá de junio
})
```

**Comportamiento:**
- Botón "Mes anterior" se deshabilita si estamos en septiembre (inicio del curso)
- Botón "Mes siguiente" se deshabilita si estamos en junio (fin del curso)
- Días fuera del período (`!isWithinRange`) se muestran deshabilitados en gris claro

## Seed de Datos

Archivos relevantes:
- `prisma/seed/data/calendars-free-disposition.ts` - Genera días del calendario
- `prisma/seed/data/workflows.ts` - Define el workflow 'request_free_day'
- `prisma/seed/seeders/calendars-free-disposition.seeder.ts` - Seeder del calendario
- `prisma/seed/seeders/workflow.seeder.ts` - Seeder de workflows

Genera automáticamente:
- Calendario para el curso 2025-2026
- Período: 1 de septiembre de 2025 al 30 de junio de 2026
- Todos los días lectivos (lunes-viernes) excluyendo festivos de Aragón
- Aproximadamente 208 días disponibles
- Festivos excluidos: Nacionales (Hispanidad, Constitución, etc.), Aragón (San Jorge), Navidad (22 dic - 7 ene), Semana Santa (30 mar - 6 abr)

---

## Restricciones del Sistema

### Límites de Uso
1. **Máximo por profesor:** 4 días por curso académico
2. **Máximo por día:** 3 profesores pueden estar de libre disposición el mismo día
3. **Duplicados:** No se puede solicitar el mismo día dos veces

### Restricciones del Calendario
4. **Período fijo:** Los calendarios cubren el curso académico completo (1 septiembre - 30 junio)
5. **Un calendario activo:** Solo puede haber un calendario de libre disposición activo (`isActive: true`) por curso
6. **Festivos:** No se pueden solicitar días festivos ni fines de semana
7. **Navegación restringida:** En la vista del calendario, no se permite navegar a meses fuera del período del curso académico (no se puede ir a años anteriores o posteriores)
8. **Solo días lectivos:** Solo se muestran y permiten solicitar los días lectivos (lunes a viernes no festivos)

---

## Estados de Solicitud

| Código | Nombre | Tipo | Descripción |
|--------|--------|------|-------------|
| `pending` | Pendiente | Inicial | Solicitud creada, pendiente de revisión |
| `approved` | Aprobada | Final | Solicitud aprobada, día asignado |
| `rejected` | Rechazada | Final/Terminal | Solicitud denegada |

---

## Vistas y Componentes

| Archivo | Descripción |
|---------|-------------|
| `app/pages/usuario/solicitudes/libre-disposicion.vue` | Vista principal del profesor (calendario) |
| `app/pages/admin/solicitudes/[id].vue` | Detalle y gestión de solicitud |
| `app/pages/admin/solicitudes/gestion.vue` | Configuración de workflows |
| `app/components/requests/FreeDayApprovalDialog.vue` | Diálogo de aprobación para admin |

---

## Flujo Diagrama

```
┌─────────────────────────────────────────────────────────────────┐
│                        PROFESOR                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  GET /api/calendars/free-disposition                            │
│  Obtiene calendario con contadores X/3                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Selecciona día disponible → Modal confirmación                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  POST /api/calendars/free-disposition/request                   │
│  Crea Request con:                                              │
│  - workflowId: 'request_free_day'                               │
│  - currentStateId: 'pending'                                    │
│  - context: { type: 'FREE_DAY', date: '...' }                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  GET /api/requests/[id]                                         │
│  GET /api/requests/[id]/details                                 │
│  Ver detalles y estadísticas                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  GET /api/requests/[id]/transitions                             │
│  Obtiene opciones disponibles (approved/rejected)               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  POST /api/requests/[id]/transition                             │
│  { toState: 'approved', comment: '...' }                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Motor de Workflow (engine.ts)                                  │
│  ├── Valida transición                                          │
│  ├── Actualiza currentStateId                                   │
│  ├── Crea StateHistory                                          │
│  ├── Ejecuta autoActions:                                       │
│  │   ├── create_notification                                    │
│  │   └── update_calendar → UserCalendarEvent                    │
│  └── Retorna resultado                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Extensiones Posibles

El sistema de workflow configurable permite:

1. **Añadir nuevos estados**: Ej. "in_review" para revisión por jefe de departamento
2. **Añadir transiciones**: Ej. "pending" → "in_review" → "approved"
3. **Validadores custom**: Ej. `check_quota` para validar cuotas automáticamente
4. **Nuevas acciones**: Ej. `send_email`, `create_task`, etc.

Ver `server/utils/workflow/engine.ts` para más detalles sobre validadores y acciones.
