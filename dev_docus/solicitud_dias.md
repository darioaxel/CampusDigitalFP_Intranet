# Sistema de Gestión de Días de Libre Disposición

## Descripción General

El sistema de días de libre disposición permite a los profesores solicitar hasta 4 días de ausencia durante el curso académico. El sistema controla que no haya más de 3 profesores en libre disposición el mismo día.

---

## Flujo de Funcionamiento

### 1. Creación del Calendario (Admin)

A principio de curso, el administrador crea un calendario de tipo `FREE_DISPOSITION`:

```
POST /api/calendars
{
  "name": "Días Libre Disposición 2025-2026",
  "type": "FREE_DISPOSITION",
  "academicYear": "2025-2026",
  "maxEventsPerUser": 4,
  "isPublic": true
}
```

Cada día disponible se crea como un `CalendarEvent` con:
- `type: FREE_DISPOSITION`
- `maxAssignments: 3` (máximo 3 profesores por día)
- `isAllDay: true`

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
   - ⚫ **Gris**: No disponible (festivo/finde)

4. Al hacer clic en día disponible → Modal de confirmación
5. El profesor puede añadir motivo opcional
6. Al confirmar → Se crea solicitud y tarea para admins

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
      "maxPerUser": 4
    },
    "days": [
      {
        "date": "2025-10-15",
        "isAvailable": true,
        "approvedCount": 2,
        "maxAllowed": 3,
        "isFull": false,
        "myStatus": null,
        "canRequest": true
      }
    ],
    "myStats": {
      "approved": 2,
      "remaining": 2
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

**Validaciones:**
- Fecha debe estar en el calendario
- Usuario no ha excedido límite de 4 días
- No existe solicitud previa para esa fecha
- Día no tiene ya 3 solicitudes aprobadas

### 4. Proceso de Aprobación (Admin)

#### Vista de Tareas
Las solicitudes aparecen como tareas tipo `REVIEW` en `/usuario/tareas`:
- Título: "Revisar solicitud día libre - [Nombre Profesor]"
- Estado: `TODO`

#### Diálogo de Aprobación
**Componente:** `app/components/requests/FreeDayApprovalDialog.vue`

**API para obtener detalles:**
```
GET /api/requests/[id]/details
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "request": { "id": "...", "title": "...", "requestedDate": "..." },
    "teacher": {
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "stats": { "approved": 2, "pending": 1, "total": 3 }
    },
    "sameDay": {
      "approvedCount": 2,
      "teachers": ["Ana García", "Luis Martín"]
    }
  }
}
```

#### Acciones del Admin
```
POST /api/requests/[id]/transition
{
  "toStatus": "APPROVED" | "REJECTED",
  "comment": "Observaciones..."
}
```

Al aprobar:
1. Se crea registro en `UserCalendarEvent` (asignación confirmada)
2. Se actualiza contador del día
3. Se marca tarea como completada

---

## Modelos de Datos

### Calendar
```prisma
model Calendar {
  id               String       @id @default(uuid())
  name             String
  type             CalendarType // FREE_DISPOSITION
  academicYear     String
  maxEventsPerUser Int?         // 4 días máximo
  isActive         Boolean      @default(true)
  isPublic         Boolean      @default(true)
  events           CalendarEvent[]
}
```

### CalendarEvent
```prisma
model CalendarEvent {
  id             String           @id @default(uuid())
  calendarId     String
  title          String
  type           CalendarEventType // FREE_DISPOSITION
  startDate      DateTime
  endDate        DateTime?
  maxAssignments Int?             // 3 máximo
  assignments    UserCalendarEvent[]
}
```

### Request (Solicitud)
```prisma
model Request {
  id            String      @id @default(uuid())
  type          RequestType // FREE_DAY
  status        WorkflowStatus // PENDING, APPROVED, REJECTED
  title         String
  description   String?     // Motivo
  requestedDate DateTime?   // Fecha solicitada
  requesterId   String
  adminId       String?     // Admin que gestiona
  adminNotes    String?     // Observaciones
}
```

### UserCalendarEvent (Asignación)
```prisma
model UserCalendarEvent {
  id        String        @id @default(uuid())
  eventId   String
  userId    String
  status    String        // CONFIRMED, PENDING
  notes     String?
}
```

---

## Seed de Datos

Archivo: `prisma/seed/data/calendars-free-disposition.ts`

Genera automáticamente:
- Calendario para el curso 2025-2026
- Todos los días lectivos (lunes-viernes) excluyendo festivos
- 208 días disponibles aproximadamente

---

## Restricciones del Sistema

1. **Máximo por profesor:** 4 días por curso académico
2. **Máximo por día:** 3 profesores pueden estar de libre disposición el mismo día
3. **Festivos:** No se pueden solicitar días festivos ni fines de semana
4. **Duplicados:** No se puede solicitar el mismo día dos veces

---

## Estados de Solicitud

- `PENDING`: Pendiente de revisión por admin
- `APPROVED`: Aprobada, día asignado
- `REJECTED`: Denegada por admin

---

## Vistas y Componentes

| Archivo | Descripción |
|---------|-------------|
| `app/pages/usuario/solicitudes/libre-disposicion.vue` | Vista principal del profesor |
| `app/components/requests/FreeDayApprovalDialog.vue` | Diálogo de aprobación para admin |
| `server/api/calendars/free-disposition/index.get.ts` | API calendario con contadores |
| `server/api/calendars/free-disposition/request.post.ts` | API solicitar día |
| `server/api/requests/[id]/details.get.ts` | API detalles para aprobación |
| `server/api/requests/[id]/transition.post.ts` | API aprobar/rechazar |
