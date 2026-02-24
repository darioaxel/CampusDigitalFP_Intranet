# Sistema de Gestión de Horarios

## Descripción General

El sistema de horarios permite a los profesores gestionar sus horarios semanales basándose en plantillas (templates) creadas por administradores. Los horarios deben ser validados por administración antes de estar activos.

---

## Arquitectura del Sistema

### Modelos de Datos

#### Schedule (Horario)
```prisma
model Schedule {
  id               String         @id @default(uuid())
  name             String         // "Horario Curso 2024-25"
  description      String?
  type             ScheduleType   // NORMAL, EXAMENES, EXTRAORDINARIO, GUARDIA, REFUERZO
  isActive         Boolean        @default(true)
  isTemplate       Boolean        @default(false)  // true = plantilla admin
  validationStatus String         @default("BORRADOR") // BORRADOR, PENDIENTE, VALIDADO, RECHAZADO
  color            String?        // Color identificativo
  userId           String         // Propietario
  validFrom        DateTime?      // Vigencia
  validUntil       DateTime?
  blocks           ScheduleBlock[]
  requestId        String?        @unique  // Solicitud de validación asociada
}
```

#### ScheduleBlock (Bloque de tiempo)
```prisma
model ScheduleBlock {
  id          String     @id @default(uuid())
  scheduleId  String
  dayOfWeek   DayOfWeek  // LUNES, MARTES, etc.
  startTime   String     // "08:00" formato HH:MM
  endTime     String     // "09:00"
  subject     String?    // Asignatura/actividad
  room        String?    // Aula
  isBreak     Boolean    @default(false) // Es recreo
}
```

#### ScheduleType Enum
```prisma
enum ScheduleType {
  NORMAL
  EXAMENES
  EXTRAORDINARIO
  GUARDIA
  REFUERZO
}
```

---

## Flujo de Funcionamiento

### 1. Gestión de Templates (Admin)

**Ruta:** `/admin/horarios/templates`

Los administradores crean plantillas de horario que definen:
- Franjas horarias (días y horas)
- Recreos
- Estructura semanal

Los bloques de template tienen `subject` y `room` vacíos para que el profesor los rellene.

#### Templates incluidos en seed:
- **Horario Base Mañanas**: Lunes a viernes 8:00-14:30 (35 bloques)
- **Horario Base Tardes**: Lunes a viernes 15:30-21:00 (35 bloques)
- **Horario Guardia**: 5 franjas de guardia distribuidas
- **Horario Refuerzo**: Martes y jueves tardes

#### APIs Templates:
```
GET  /api/schedules/templates           // Listar templates
POST /api/schedules                     // Crear template (isTemplate: true)
POST /api/schedules/[id]/clone          // Clonar template para profesor
DELETE /api/schedules/[id]              // Eliminar template
```

### 2. Creación de Horario por Profesor

**Ruta:** `/usuario/crear-horario`

#### Paso 1: Seleccionar Template
El profesor ve la lista de templates disponibles y selecciona uno.

#### Paso 2: Rellenar Bloques
El sistema copia los bloques del template y el profesor rellena:
- **Asignatura/Actividad** (obligatorio excepto recreos)
- **Aula** (opcional)
- Puede marcar/desmarcar como recreo
- Puede agregar o eliminar bloques

#### Paso 3: Guardar
```
POST /api/schedules
{
  "name": "Horario Curso 2025-26 - Programación",
  "type": "NORMAL",
  "color": "#3b82f6",
  "isTemplate": false,
  "blocks": [
    {
      "dayOfWeek": "LUNES",
      "startTime": "08:00",
      "endTime": "09:00",
      "subject": "Programación (1ºDAM)",
      "room": "Aula 101",
      "isBreak": false
    }
  ]
}
```

**Validaciones:**
- No solapamiento de horarios
- Al menos un bloque
- Subject obligatorio en bloques no-recreo

#### Paso 4: Solicitar Validación (Opcional)
```
POST /api/schedules/[id]/request-validation
{
  "notes": "Por favor revisar asignación de aulas"
}
```

Esto:
1. Cambia `validationStatus` a `PENDIENTE`
2. Crea una `Request` de tipo `SCHEDULE_VALIDATION`
3. Crea una `Task` tipo `REVIEW` para los admins

### 3. Vista de Horarios del Profesor

**Ruta:** `/usuario/horarios`

#### Funcionalidad:
- Muestra todos los horarios del profesor en pestañas (tabs)
- Cada horario muestra grid semanal (Lunes-Viernes / Horas)
- Indicador visual del estado de validación:
  - 🟢 **VALIDADO**: Check verde + badge "Validado"
  - 🟠 **PENDIENTE**: Badge "Pendiente de validación"
  - ⚪ **BORRADOR**: Sin indicador
  - 🔴 **RECHAZADO**: Badge rojo "Rechazado"

#### APIs:
```
GET /api/schedules/me       // Mis horarios
GET /api/schedules/[id]     // Detalle horario específico
DELETE /api/schedules/[id]  // Eliminar mi horario
```

### 4. Validación por Administrador

**Rutas:**
- `/admin/validaciones/horarios` - Lista de horarios pendientes
- `/usuario/horarios?view=[id]&task=[id]` - Vista de revisión

#### Vista de Revisión (Modo Admin)
Cuando un admin accede desde una tarea:
- Muestra horario del profesor en modo solo lectura
- Panel superior con información de revisión
- Botones: **Validar Horario** / **Rechazar**

#### APIs de Validación:
```
POST /api/schedules/[id]/validate
{
  "action": "VALIDAR" | "RECHAZAR"
}
```

Al validar:
1. Actualiza `validationStatus` a `VALIDADO`
2. Completa la `Request` asociada
3. Marca la `Task` como `DONE`
4. Crea log de actividad

Al rechazar:
1. Actualiza `validationStatus` a `RECHAZADO`
2. Completa la `Request` como `REJECTED`
3. El profesor puede editar y volver a enviar

---

## Estados de Validación

| Estado | Descripción | Acciones permitidas |
|--------|-------------|---------------------|
| `BORRADOR` | Horario creado, no enviado | Editar, Eliminar, Enviar a validación |
| `PENDIENTE` | Esperando validación admin | Ver (solo lectura), Cancelar solicitud |
| `VALIDADO` | Aprobado por admin | Ver (solo lectura), Duplicar |
| `RECHAZADO` | Denegado por admin | Editar, Reenviar a validación |

---

## Componentes Principales

### Frontend

| Componente | Ruta | Descripción |
|------------|------|-------------|
| `ScheduleViewer.vue` | `components/schedule/` | Grid semanal con tabs |
| `ScheduleCard.vue` | `components/schedule/` | Tarjeta resumen de horario |
| `crear-horario.vue` | `pages/usuario/` | Formulario creación/edición |
| `horarios.vue` | `pages/usuario/` | Vista lista de horarios |
| `templates.vue` | `pages/admin/horarios/` | Gestión templates admin |
| `validaciones/horarios.vue` | `pages/admin/` | Revisión horarios pendientes |

### Backend (APIs)

| API | Método | Descripción |
|-----|--------|-------------|
| `/api/schedules` | POST | Crear horario/template |
| `/api/schedules` | GET | Listar horarios (filtrado) |
| `/api/schedules/me` | GET | Mis horarios |
| `/api/schedules/[id]` | GET | Detalle horario |
| `/api/schedules/[id]` | PUT | Actualizar horario |
| `/api/schedules/[id]` | DELETE | Eliminar horario |
| `/api/schedules/[id]/validate` | POST | Validar/rechazar horario |
| `/api/schedules/[id]/request-validation` | POST | Solicitar validación |
| `/api/schedules/[id]/clone` | POST | Clonar desde template |
| `/api/schedules/templates` | GET | Listar templates |

---

## Seed de Datos

Archivos:
- `prisma/seed/data/schedules-2025-2026.ts` - Templates y horarios de ejemplo
- `prisma/seed/seeders/schedules-2025-2026.seeder.ts` - Seeder

### Horarios de ejemplo creados:

1. **Profesor Programación** (profesor@example.com)
   - Horario Curso 2025-26 - Programación (35 bloques, VALIDADO)
   - Guardias Semanales (3 bloques, VALIDADO)

2. **Experto Bases de Datos** (experto@example.com)
   - Horario Curso 2025-26 - Bases de Datos (35 bloques, PENDIENTE)
   - Refuerzo Programación (2 bloques, BORRADOR)

---

## Permisos

| Acción | PROFESOR | ADMIN/ROOT |
|--------|----------|------------|
| Crear horario propio | ✅ | ✅ |
| Editar horario propio | ✅ (solo BORRADOR/RECHAZADO) | ✅ |
| Eliminar horario propio | ✅ | ✅ |
| Ver horarios otros | ❌ | ✅ |
| Validar horarios | ❌ | ✅ |
| Crear templates | ❌ | ✅ |
| Editar templates | ❌ | ✅ |

---

## Flujo Completo (Diagrama)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Admin     │────▶│   Template   │────▶│   Seed      │
│  (Crea)     │     │   Mañanas    │     │  Inicial    │
└─────────────┘     └──────────────┘     └─────────────┘
                              │
                              ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Profesor  │◀───▶│   Selecciona │────▶│   Rellena   │
│             │     │   Template   │     │   Bloques   │
└─────────────┘     └──────────────┘     └─────────────┘
      │
      │ Guarda
      ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Estado    │────▶│   Solicita   │────▶│   Estado    │
│  BORRADOR   │     │ Validación   │     │  PENDIENTE  │
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Estado    │◀────│    Admin     │◀────│   Tarea     │
│  VALIDADO   │     │   Revisa     │     │   Creada    │
└─────────────┘     └──────────────┘     └─────────────┘
      │
      ▼
┌─────────────┐
│   Check     │
│   Visible   │
└─────────────┘
```

---

## Consideraciones Técnicas

1. **Solapamiento:** El sistema valida que no haya bloques solapados al crear horario
2. **Formato hora:** Todas las horas en formato 24h "HH:MM"
3. **Días:** Lunes a Viernes (Sábado/Domingo no permitidos en horarios)
4. **Zona horaria:** Las fechas se guardan en UTC, se muestran en local
