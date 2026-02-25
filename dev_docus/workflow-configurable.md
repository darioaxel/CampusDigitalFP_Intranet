# Sistema de Workflows Configurables

## Resumen

El sistema usa un workflow engine **data-driven** donde los workflows se definen en base de datos, permitiendo crear nuevos flujos sin modificar código.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOW ENGINE                          │
│              (server/utils/workflow/engine.ts)              │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Workflow    │    │    Estado     │    │  Transición   │
│  Definition   │───▶│    (State)    │───▶│ (Transition)  │
│  (Metadatos)  │    │               │    │               │
└───────────────┘    └───────────────┘    └───────────────┘
        │                                           │
        ▼                                           ▼
┌───────────────┐                          ┌───────────────┐
│     Task      │                          │  StateHistory │
│    Request    │                          │  (Auditoría)  │
│  (Instancias) │                          └───────────────┘
└───────────────┘
```

## Modelos

### WorkflowDefinition
Define un tipo de workflow:
```prisma
model WorkflowDefinition {
  code        String   @unique  // "task_validation"
  name        String            // "Validación de Tarea"
  entityType  EntityType        // TASK | REQUEST
  version     Int      @default(1)
  isActive    Boolean  @default(true)
  states      WorkflowState[]
  transitions WorkflowTransition[]
}
```

### WorkflowState
Estados posibles dentro de un workflow:
```prisma
model WorkflowState {
  code        String   // "pending", "approved"
  name        String   // "Pendiente", "Aprobado"
  color       String   // "amber", "green", "red"
  order       Int      // Orden de visualización
  isInitial   Boolean  // Estado inicial
  isFinal     Boolean  // Estado final exitoso
  isTerminal  Boolean  // Estado final sin salida
  config      String?  // JSON con configuración extra
}
```

### WorkflowTransition
Reglas de transición entre estados:
```prisma
model WorkflowTransition {
  fromStateId     String
  toStateId       String
  allowedRoles    String   // JSON: ["ADMIN", "JEFE_DEPT"]
  requiresComment Boolean
  requiresFields  String?  // JSON: ["documentUrl"]
  autoActions     String?  // JSON: ["create_notification"]
  validatorCode   String?  // "check_quota", "validate_schedule"
}
```

### StateHistory
Auditoría de cambios:
```prisma
model StateHistory {
  taskId      String?
  requestId   String?
  fromStateId String
  toStateId   String
  actorId     String
  comment     String?
  metadata    String?
  createdAt   DateTime
}
```

## Workflows Predefinidos

| Código | Nombre | Tipo | Estados |
|--------|--------|------|---------|
| `task_validation` | Validación de Tarea | TASK | todo → in_progress → in_review → approved/rejected |
| `task_voting` | Votación | TASK | voting_open → voting_closed → resolved |
| `task_simple` | Tarea Simple | TASK | todo → in_progress → done/cancelled |
| `request_free_day` | Día Libre | REQUEST | pending → dept_review → admin_review → approved/rejected |
| `request_medical` | Visita Médica | REQUEST | communicated → pending_docs → docs_submitted → validated/rejected |
| `request_standard` | Solicitud Estándar | REQUEST | pending → approved/rejected |

## Uso del Motor

### Obtener transiciones disponibles
```typescript
const transitions = await workflowEngine.getAvailableTransitions(
  taskId,
  'TASK',
  user.role
)
```

### Ejecutar transición
```typescript
const result = await workflowEngine.executeTransition({
  entityId: taskId,
  entityType: 'TASK',
  toStateCode: 'approved',
  actorId: user.id,
  actorRole: user.role,
  comment: 'Revisado y aprobado',
  metadata: { reviewedAt: new Date() }
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
    description: 'Descripción de la tarea'
  }
)
```

## API Endpoints

### Workflows
```
GET /api/workflows
GET /api/workflows/:id
```

### Tareas
```
GET  /api/tasks/:id/transitions    # Transiciones disponibles
POST /api/tasks/:id/transition     # Ejecutar transición
GET  /api/tasks/:id/history        # Historial de estados
```

### Solicitudes
```
GET  /api/requests/:id/transitions
POST /api/requests/:id/transition
GET  /api/requests/:id/history
```

## Validadores Custom

Los validadores permiten lógica de negocio específica:

```typescript
// En engine.ts, método getValidator()
const validators = {
  check_quota: async (entity, context, tx) => {
    // Verificar cuota de días libres
    const used = await tx.request.count({
      where: { 
        requesterId: entity.requesterId,
        currentState: { code: 'approved' }
      }
    })
    return used < 5 ? { valid: true } : { valid: false, error: 'Cuota excedida' }
  },
  
  check_documents: async (entity, context, tx) => {
    const docs = await tx.requestDocument.count({
      where: { requestId: entity.id }
    })
    return docs > 0 
      ? { valid: true } 
      : { valid: false, error: 'Se requieren documentos' }
  }
}
```

## Acciones Automáticas

Las transiciones pueden ejecutar acciones automáticas:

| Acción | Descripción |
|--------|-------------|
| `create_notification` | Notifica al creador/requester |
| `notify_creator` | Notifica al creador de la tarea |
| `notify_assignees` | Notifica a todos los asignados |
| `update_calendar` | Actualiza calendario (días libres) |

## Crear Nuevo Workflow

1. Añadir definición en `prisma/seed/seeders/workflow.seeder.ts`
2. Ejecutar seed: `pnpm prisma:setup`
3. O crear directamente via API (panel admin futuro)

Ejemplo:
```typescript
const workflow = await prisma.workflowDefinition.create({
  data: {
    code: 'mi_workflow',
    name: 'Mi Workflow',
    entityType: 'TASK',
    states: {
      create: [
        { code: 'inicio', name: 'Inicio', color: 'gray', order: 1, isInitial: true },
        { code: 'fin', name: 'Fin', color: 'green', order: 2, isFinal: true }
      ]
    }
  }
})
```

## Panel de Administración (Futuro)

Funcionalidades planificadas:
- Visualización de workflows como diagramas
- Creación/edición de workflows en UI
- Gestión de transiciones drag-and-drop
- Métricas y analytics (tiempo promedio por estado)
