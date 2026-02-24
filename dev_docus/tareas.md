# Sistema de Gestión de Tareas y Solicitudes

## Descripción General

El sistema de tareas y solicitudes gestiona el flujo de trabajo de la intranet:

- **Tareas**: Asignadas por jefes de departamento o admins a profesores/expertos
- **Solicitudes**: Creadas por usuarios (profesores) y gestionadas por administración
- **Máquina de estados**: Controla transiciones válidas según rol y estado actual

---

## Modelos de Datos

### Task (Tarea)
```prisma
model Task {
  id            String         @id @default(uuid())
  creatorId     String         // Quien crea la tarea
  type          TaskType       // SYLLABUS_CREATION, MEETING, VOTE, REVIEW, OTHER
  status        WorkflowStatus @default(TODO) // TODO, IN_PROGRESS, DONE, CANCELLED
  title         String
  description   String?        @db.Text
  dueDate       DateTime?      // Fecha límite
  completedAt   DateTime?      // Cuándo se completó
  votingEndsAt  DateTime?      // Para tareas tipo VOTE
  votingOptions String?        @db.Text // JSON con opciones
  assignments   TaskAssignment[] // Asignaciones a usuarios
  votes         Vote[]         // Votos (si es VOTE)
  activityLogs  ActivityLog[]
}
```

### TaskType Enum
```prisma
enum TaskType {
  SYLLABUS_CREATION  // Crear programación didáctica
  MEETING            // Asistir a reunión
  VOTE               // Votar en propuesta
  REVIEW             // Revisar documento/solicitud
  OTHER              // Otro tipo
}
```

### TaskAssignment (Asignación)
```prisma
model TaskAssignment {
  id          String         @id @default(uuid())
  taskId      String
  assigneeId  String         // Usuario asignado
  status      WorkflowStatus @default(TODO) // Estado individual
  notes       String?        @db.Text
  completedAt DateTime?
}
```

### Request (Solicitud)
```prisma
model Request {
  id            String         @id @default(uuid())
  requesterId   String         // Quien solicita
  type          RequestType    // FREE_DAY, MEDICAL_APPOINTMENT, LEAVE, TRAINING, OTHER, SCHEDULE_VALIDATION
  status        WorkflowStatus @default(PENDING)
  title         String
  description   String?        @db.Text
  requestedDate DateTime?      // Fecha específica (ej: día libre)
  startDate     DateTime?      // Rango inicio
  endDate       DateTime?      // Rango fin
  adminId       String?        // Admin que gestiona
  adminNotes    String?        @db.Text
  documents     RequestDocument[]
  schedule      Schedule?      // Relación con horario (validación)
}
```

### RequestType Enum
```prisma
enum RequestType {
  FREE_DAY           // Día de libre disposición
  MEDICAL_APPOINTMENT // Visita médica
  LEAVE              // Permiso
  TRAINING           // Formación
  OTHER              // Otro tipo
  SCHEDULE_VALIDATION // Validación de horario
}
```

### Vote (Votación)
```prisma
model Vote {
  id       String @id @default(uuid())
  taskId   String
  voterId  String // Quién vota
  option   String // Opción seleccionada
  comment  String? @db.Text
}
```

### ActivityLog (Log de Actividad)
```prisma
model ActivityLog {
  id          String   @id @default(uuid())
  actorId     String   // Quién realizó la acción
  action      String   // REQUEST_CREATED, TASK_ASSIGNED, etc.
  description String
  entityType  String   // REQUEST, TASK, DOCUMENT
  entityId    String   // ID de la entidad afectada
  requestId   String?
  taskId      String?
  metadata    String?  @db.Text // JSON adicional
}
```

---

## Flujo de Tareas

### 1. Creación de Tarea (Jefe de Depto / Admin)

```
POST /api/tasks
{
  "type": "REVIEW",
  "title": "Revisar solicitud día libre",
  "description": "Revisar y aprobar/rechazar",
  "dueDate": "2025-10-20",
  "assigneeIds": ["user-id-1", "user-id-2"]
}
```

**Automáticamente:**
- Se crea el registro `Task` con status `TODO`
- Se crean `TaskAssignment` para cada asignado
- Se crea `ActivityLog` tipo `TASK_CREATED`

### 2. Asignados Visualizan Tareas

**Ruta:** `/usuario` (dashboard del usuario)

**API:**
```
GET /api/tasks
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "task-id",
      "title": "Revisar solicitud...",
      "type": "REVIEW",
      "status": "TODO",
      "creator": { "firstName": "Admin", "lastName": "User" },
      "assignments": [{ "id": "assign-id", "status": "TODO" }],
      "request": { "id": "req-id", "type": "FREE_DAY" }
    }
  ],
  "meta": { "total": 5, "limit": 50, "offset": 0 }
}
```

### 3. Completar Tarea

```
POST /api/tasks/[id]/complete
```

**Efectos:**
- Cambia `Task.status` a `DONE`
- Actualiza `Task.completedAt`
- Actualiza `TaskAssignment.status` del usuario a `DONE`

---

## Flujo de Solicitudes

### 1. Crear Solicitud (Profesor)

```
POST /api/requests
{
  "type": "FREE_DAY",
  "title": "Solicitud día libre 15 Octubre",
  "description": "Asuntos personales",
  "requestedDate": "2025-10-15T00:00:00.000Z"
}
```

**Validaciones:**
- Usuario debe tener permiso según tipo (`canCreateRequest`)
- Fecha inicio < fecha fin (si hay rango)

**Automáticamente:**
- Crea `Request` con status `PENDING`
- Crea `ActivityLog` tipo `REQUEST_CREATED`
- Para `FREE_DAY`: Crea tarea tipo `REVIEW` para admins

### 2. Admin Visualiza Solicitud Pendiente

**API:**
```
GET /api/requests/[id]/details
```

**Respuesta (FREE_DAY):**
```json
{
  "success": true,
  "data": {
    "request": { "id": "...", "title": "...", "status": "PENDING" },
    "teacher": {
      "name": "Juan Pérez",
      "stats": { "approved": 2, "pending": 1, "total": 3 }
    },
    "sameDay": {
      "approvedCount": 2,
      "teachers": ["Ana García", "Luis Martín"]
    }
  }
}
```

### 3. Transicionar Estado (Admin)

```
POST /api/requests/[id]/transition
{
  "toStatus": "APPROVED",
  "comment": "Aprobado, quedan 2 plazas libres"
}
```

**Estados permitidos según tipo:**

| Tipo | Estados válidos | Transiciones típicas |
|------|-----------------|---------------------|
| `FREE_DAY` | PENDING → APPROVED/REJECTED | Admin aprueba o rechaza |
| `MEDICAL_APPOINTMENT` | PENDING → COMMUNICATED → CLOSED | Comunicada → Cerrada |
| `SCHEDULE_VALIDATION` | PENDING → APPROVED/REJECTED | Valida horario |

---

## Máquina de Estados

**Archivo:** `server/utils/workflow/stateMachine.ts`

### Transiciones de Solicitudes Estándar
```typescript
// PENDING → APPROVED (solo ADMIN/ROOT)
// PENDING → REJECTED (requiere comentario)
// APPROVED → PENDING (reapertura por admin)
// REJECTED → PENDING (reapertura por admin)
```

### Transiciones de Solicitudes Médicas
```typescript
// PENDING → COMMUNICATED (profesor avisó)
// PENDING → CLOSED (cierre directo)
// COMMUNICATED → CLOSED (con documentación)
// PENDING/COMMUNICATED → REJECTED (requiere comentario)
```

### Transiciones de Tareas
```typescript
// TODO → IN_PROGRESS (asignado empieza)
// IN_PROGRESS → DONE (asignado completa)
// TODO → CANCELLED (creador cancela)
// IN_PROGRESS → TODO (volver atrás)
// DONE → IN_PROGRESS (reabrir)
```

### Métodos de la StateMachine
```typescript
// Obtener transiciones válidas desde un estado
getTransitions(entityType, currentStatus, requestType?): WorkflowStatus[]

// Validar si una transición es permitida
validateTransition(entityType, from, to, userRole, requestType?): StateMachineResult

// Ejecutar transición con validaciones
executeTransition(context: TransitionContext): Promise<StateMachineResult>

// Verificar estado terminal
isTerminalStatus(entityType, status, requestType?): boolean
```

---

## APIs del Sistema

### Tareas

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/tasks` | GET | Listar tareas del usuario (o todas si es admin) |
| `/api/tasks/[id]` | GET | Detalle de una tarea |
| `/api/tasks/[id]/complete` | POST | Marcar tarea como completada |

**Query params para GET /api/tasks:**
- `status`: Filtrar por estado (TODO, IN_PROGRESS, DONE, CANCELLED)
- `type`: Filtrar por tipo (SYLLABUS_CREATION, MEETING, VOTE, REVIEW)
- `limit`: Número máximo de resultados (default: 50)
- `offset`: Paginación (default: 0)

### Solicitudes

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/requests` | POST | Crear nueva solicitud |
| `/api/requests/[id]/details` | GET | Obtener detalles para aprobación (admin) |
| `/api/requests/[id]/transition` | POST | Cambiar estado de la solicitud |
| `/api/requests/[id]/documents` | POST | Subir documento a solicitud |
| `/api/requests/free-days` | GET | Listar solicitudes de días libres |
| `/api/requests/free-days/validate` | POST | Validar solicitud día libre |

### Workflow Items (Consolidado)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/user/workflow-items` | GET | Obtener solicitudes + tareas del usuario en una sola llamada |

**Usado en:** `app/pages/usuario/index.vue` (dashboard)

---

## Permisos por Rol

### Crear Solicitudes
```typescript
canCreateRequest(userRole): boolean
// Permitido: PROFESOR, EXPERTO, JEFE_DEPT, ADMIN, ROOT
```

### Gestionar Solicitudes (Aprobar/Rechazar)
```typescript
canManageRequests(userRole): boolean
// Permitido: ADMIN, ROOT
```

### Crear Tareas
```typescript
canCreateTasks(userRole): boolean
// Permitido: JEFE_DEPT, ADMIN, ROOT
```

### Completar Tareas
- Cualquier usuario asignado a la tarea
- Admins pueden forzar completado

---

## Estados y Labels

### Solicitudes (Request)
| Estado | Label Español | Badge |
|--------|---------------|-------|
| `PENDING` | Pendiente | secondary (ámbar) |
| `APPROVED` | Aprobada | default (verde) |
| `REJECTED` | Rechazada | destructive (rojo) |
| `COMMUNICATED` | Comunicada | outline |
| `CLOSED` | Cerrada | default |

### Tareas (Task)
| Estado | Label Español | Badge |
|--------|---------------|-------|
| `TODO` | Por hacer | secondary (ámbar) |
| `IN_PROGRESS` | En progreso | outline (azul) |
| `DONE` | Completada | default (verde) |
| `CANCELLED` | Cancelada | destructive (rojo) |

---

## Vistas y Componentes

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `app/pages/usuario/index.vue` | Dashboard con lista de tareas y solicitudes |
| `app/components/requests/FreeDayApprovalDialog.vue` | Diálogo aprobación día libre |

### Backend

| Archivo | Descripción |
|---------|-------------|
| `server/utils/workflow/stateMachine.ts` | Máquina de estados y validaciones |
| `server/api/tasks/index.get.ts` | Listar tareas |
| `server/api/tasks/[id]/index.get.ts` | Detalle tarea |
| `server/api/tasks/[id]/complete.post.ts` | Completar tarea |
| `server/api/requests/index.post.ts` | Crear solicitud |
| `server/api/requests/[id]/transition.post.ts` | Transicionar solicitud |
| `server/api/requests/[id]/details.get.ts` | Detalles para aprobación |

---

## Flujo Completo Ejemplo: Día Libre

```
┌─────────────────┐
│   Profesor      │
│  Crea solicitud │
│   FREE_DAY      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Request        │────▶│  Task REVIEW    │
│  status=PENDING │     │  para admins    │
└─────────────────┘     └────────┬────────┘
                                 │
         ┌───────────────────────┘
         ▼
┌─────────────────┐
│   Admin ve      │
│   en dashboard  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GET details    │◀── Muestra stats profesor
│  + otros del día│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  POST transition│
│  to: APPROVED   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Request        │────▶│ UserCalendarEvent
│  status=APPROVED│     │  (día asignado) │
└─────────────────┘     └─────────────────┘
```

---

## Consideraciones Técnicas

1. **Transacciones**: Las transiciones de estado usan transacciones de Prisma para garantizar consistencia
2. **Logs**: Todas las acciones importantes se registran en `ActivityLog`
3. **Permisos**: Las APIs verifican permisos antes de cualquier operación
4. **Validaciones**: La máquina de estados valida transiciones antes de ejecutarlas
5. **Crear tareas automáticamente**: Al crear ciertas solicitudes (FREE_DAY, SCHEDULE_VALIDATION) se genera automáticamente una tarea REVIEW para admins
