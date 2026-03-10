---
title: 'Sistema de Workflows'
icon: 'i-lucide-git-branch'
description: 'Workflows configurables para solicitudes y tareas'
---

# Sistema de Workflows

El sistema usa un **workflow engine configurable** data-driven que permite definir estados y transiciones sin modificar código.

## Ubicación

- **Motor**: `server/utils/workflow/engine.ts`
- **Seed data**: `prisma/seed/data/workflows.ts`

## Modelos principales

### WorkflowDefinition

Define el workflow completo:

```typescript
{
  code: 'request_sick_leave',
  name: 'Comunicación de Bajas',
  entityType: 'REQUEST',
  version: 1,
  isActive: true
}
```

### WorkflowState

Estados posibles del workflow:

```typescript
{
  code: 'pending_notification',
  name: 'Pendiente de Notificación',
  color: 'amber',
  isInitial: true,
  isFinal: false,
  isTerminal: false
}
```

### WorkflowTransition

Transiciones permitidas entre estados:

```typescript
{
  fromCode: 'pending_validation',
  toCode: 'validated',
  allowedRoles: ['ADMIN', 'ROOT'],
  requiresComment: true,
  validatorCode: 'check_documents',
  autoActions: ['create_notification']
}
```

## Workflows predefinidos

### 1. Alta de Nuevo Usuario

```yaml
code: request_new_user
estados:
  - pending: Pendiente de Validación
  - approved: Aprobada - Usuario Creado
  - rejected: Rechazada
transiciones:
  - pending → approved (ADMIN, ROOT)
  - pending → rejected (ADMIN, ROOT)
```

### 2. Día Libre Disposición

```yaml
code: request_free_day
estados:
  - pending: Pendiente
  - approved: Aprobada
  - rejected: Rechazada
  - cancelled_by_user: Cancelada
transiciones:
  - pending → approved (ADMIN, ROOT)
  - pending → rejected (ADMIN, ROOT)
  - pending → cancelled_by_user (PROFESOR, EXPERTO, JEFE_DEPT)
  - approved → cancelled_by_user (todos)
```

### 3. Comunicación de Bajas

```yaml
code: request_sick_leave
estados:
  - pending_notification: Pendiente de Notificación
  - notified: Notificado
  - pending_docs: Esperando Documentación
  - pending_validation: Esperando Validación
  - validated: Validado
  - rejected: Rechazado
transiciones:
  - pending_notification → notified (ADMIN, ROOT)
  - notified → pending_docs (ADMIN, ROOT, PROFESOR)
  - pending_docs → pending_validation (PROFESOR)
  - pending_validation → validated (ADMIN, ROOT)
  - pending_validation → pending_docs (ADMIN, ROOT)
  - pending_validation → rejected (ADMIN, ROOT)
```

## Uso del motor

### Ejecutar transición

```typescript
import { workflowEngine } from '~/server/utils/workflow/engine'

const result = await workflowEngine.executeTransition({
  entityId: taskId,
  entityType: 'TASK',
  toStateCode: 'approved',
  actorId: user.id,
  actorRole: user.role,
  comment: 'Todo correcto'
})
```

### Crear entidad con workflow

```typescript
const task = await workflowEngine.createEntityWithWorkflow(
  'TASK', 
  'task_validation', 
  {
    title: 'Nueva tarea',
    creatorId: user.id,
    // ... otros campos
  }
)
```

## API Endpoints

### Listar workflows disponibles

```http
GET /api/workflows
```

### Ver detalle de workflow

```http
GET /api/workflows/:id
```

### Obtener transiciones disponibles

```http
GET /api/tasks/:id/transitions
GET /api/requests/:id/transitions
```

### Ejecutar transición

```http
POST /api/tasks/:id/transition
POST /api/requests/:id/transition
```

Body:
```json
{
  "toState": "approved",
  "comment": "Comentario opcional"
}
```

### Ver historial de estados

```http
GET /api/tasks/:id/history
GET /api/requests/:id/history
```

## Testing

El proyecto incluye tests completos para workflows:

```bash
# Tests unitarios
pnpm test:workflows:unit

# Tests de integración
pnpm test:workflows
```

Workflows testeados:
- `request_new_user` - 17 tests
- `request_free_day` - 28 tests
- `request_sick_leave` - 34 tests
