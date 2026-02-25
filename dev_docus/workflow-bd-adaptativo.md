## ✅ Solución: Workflow Engine Configurable

Te propongo un modelo **data-driven** donde los workflows se definen en BD, no en código:

### Esquema Prisma Extendido

```prisma
// workflow.prisma

// ============================================
// CONFIGURACIÓN DE WORKFLOWS (Metadatos)
// ============================================

model WorkflowDefinition {
  id          String   @id @default(uuid())
  code        String   @unique // "task_validation", "task_voting", "request_free_day"
  name        String
  description String?
  entityType  EntityType // TASK o REQUEST
  version     Int      @default(1)
  isActive    Boolean  @default(true)
  
  states      WorkflowState[]
  transitions WorkflowTransition[]
  tasks       Task[]          // Instancias usando este workflow
  requests    Request[]       // Instancias usando este workflow
  
  createdAt   DateTime @default(now())
  
  @@unique([code, version])
}

model WorkflowState {
  id          String   @id @default(uuid())
  workflowId  String
  workflow    WorkflowDefinition @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  
  code        String   // "pending", "in_review", "approved"
  name        String   // "Pendiente", "En revisión"
  color       String   @default("gray") // Para badges UI
  order       Int      // Para mostrar en secuencia
  
  isInitial   Boolean  @default(false)
  isFinal     Boolean  @default(false)
  isTerminal  Boolean  @default(false) // No permite salir (cancelled, rejected)
  
  // Configuración específica por tipo de workflow
  config      String?  @db.Text // JSON: { "requiresComment": true, "timeoutDays": 7 }
  
  transitionsFrom WorkflowTransition[] @relation("FromState")
  transitionsTo   WorkflowTransition[] @relation("ToState")
  
  @@unique([workflowId, code])
  @@index([workflowId])
}

model WorkflowTransition {
  id              String   @id @default(uuid())
  workflowId      String
  workflow        WorkflowDefinition @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  
  fromStateId     String
  fromState       WorkflowState @relation("FromState", fields: [fromStateId], references: [id])
  toStateId       String
  toState         WorkflowState @relation("ToState", fields: [toStateId], references: [id])
  
  // Quién puede ejecutar esta transición
  allowedRoles    String   // JSON: ["ADMIN", "HEAD", "ASSIGNEE"]
  
  // Condiciones y acciones
  requiresComment Boolean  @default(false)
  requiresFields  String?  // JSON: ["documentUrl", "justification"]
  autoActions     String?  // JSON: ["create_notification", "update_calendar"]
  
  // Validación custom (opcional)
  validatorCode   String?  // "check_quota", "validate_schedule", etc.
  
  @@index([workflowId, fromStateId])
}

// ============================================
// INSTANCIAS DE WORKFLOW (Datos)
// ============================================

model Task {
  id              String   @id @default(uuid())
  
  // Workflow asignado
  workflowId      String
  workflow        WorkflowDefinition @relation(fields: [workflowId], references: [id])
  currentStateId  String
  currentState    WorkflowState      @relation(fields: [currentStateId], references: [id])
  
  // Contexto específico del tipo de tarea
  type            TaskType
  context         String?  @db.Text // JSON polimórfico según type
  
  // Relaciones
  creatorId       String
  creator         User     @relation("CreatedTasks", fields: [creatorId], references: [id])
  title           String
  description     String?  @db.Text
  dueDate         DateTime?
  
  assignments     TaskAssignment[]
  stateHistory    StateHistory[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([workflowId])
  @@index([currentStateId])
  @@index([creatorId])
}

model Request {
  id              String   @id @default(uuid())
  
  workflowId      String
  workflow        WorkflowDefinition @relation(fields: [workflowId], references: [id])
  currentStateId  String
  currentState    WorkflowState      @relation(fields: [currentStateId], references: [id])
  
  type            RequestType
  context         String?  @db.Text // JSON según tipo
  
  requesterId     String
  requester       User     @relation(fields: [requesterId], references: [id])
  
  // ... resto de campos ...
  
  stateHistory    StateHistory[]
}

// Historial de transiciones (auditoría)
model StateHistory {
  id          String   @id @default(uuid())
  
  // Polimórfico: puede ser Task o Request
  taskId      String?
  task        Task?    @relation(fields: [taskId], references: [id])
  requestId   String?
  request     Request? @relation(fields: [requestId], references: [id])
  
  fromStateId String
  toStateId   String
  actorId     String
  actor       User     @relation(fields: [actorId], references: [id])
  
  comment     String?  @db.Text
  metadata    String?  @db.Text // Datos adicionales de la transición
  
  createdAt   DateTime @default(now())
  
  @@index([taskId])
  @@index([requestId])
  @@index([actorId])
}

enum EntityType {
  TASK
  REQUEST
}

enum TaskType {
  VALIDATION      // Revisar y aprobar/rechazar
  VOTING          // Votación entre opciones
  DOCUMENT_REVIEW // Revisión de documentos
  SCHEDULE_CHECK  // Validación de horarios
  CUSTOM          // Para futuros tipos sin código
}

enum RequestType {
  FREE_DAY
  MEDICAL_APPOINTMENT
  LEAVE
  TRAINING
  SCHEDULE_VALIDATION
  CUSTOM
}
```

---

## 🏗️ Seed de Workflows (Configuración Inicial)

```typescript
// prisma/seed/workflows.seed.ts
import { prisma } from './config'

export async function seedWorkflows() {
  // 1. Workflow para Validación de Tareas (REVIEW)
  const validationWorkflow = await prisma.workflowDefinition.create({
    data: {
      code: 'task_validation',
      name: 'Validación de Tarea',
      description: 'Flujo simple: Pendiente → En Revisión → Aprobado/Rechazado',
      entityType: 'TASK',
      states: {
        create: [
          { code: 'pending', name: 'Pendiente', color: 'amber', order: 1, isInitial: true },
          { code: 'in_review', name: 'En Revisión', color: 'blue', order: 2 },
          { code: 'approved', name: 'Aprobado', color: 'green', order: 3, isFinal: true },
          { code: 'rejected', name: 'Rechazado', color: 'red', order: 4, isFinal: true, isTerminal: true },
          { code: 'cancelled', name: 'Cancelado', color: 'gray', order: 5, isTerminal: true }
        ]
      }
    },
    include: { states: true }
  })

  // Crear transiciones
  const states = validationWorkflow.states
  await prisma.workflowTransition.createMany({
    data: [
      // pending → in_review (cualquier asignado puede empezar)
      { 
        workflowId: validationWorkflow.id,
        fromStateId: states.find(s => s.code === 'pending')!.id,
        toStateId: states.find(s => s.code === 'in_review')!.id,
        allowedRoles: JSON.stringify(['ASSIGNEE', 'ADMIN'])
      },
      // in_review → approved (requiere comentario)
      {
        workflowId: validationWorkflow.id,
        fromStateId: states.find(s => s.code === 'in_review')!.id,
        toStateId: states.find(s => s.code === 'approved')!.id,
        allowedRoles: JSON.stringify(['ADMIN', 'HEAD']),
        requiresComment: true
      },
      // in_review → rejected
      {
        workflowId: validationWorkflow.id,
        fromStateId: states.find(s => s.code === 'in_review')!.id,
        toStateId: states.find(s => s.code === 'rejected')!.id,
        allowedRoles: JSON.stringify(['ADMIN', 'HEAD']),
        requiresComment: true
      }
    ]
  })

  // 2. Workflow para Votaciones
  const votingWorkflow = await prisma.workflowDefinition.create({
    data: {
      code: 'task_voting',
      name: 'Votación',
      description: 'Votación con múltiples opciones',
      entityType: 'TASK',
      states: {
        create: [
          { code: 'voting_open', name: 'Votación Abierta', color: 'green', order: 1, isInitial: true },
          { code: 'voting_closed', name: 'Votación Cerrada', color: 'blue', order: 2 },
          { code: 'resolved', name: 'Resuelto', color: 'purple', order: 3, isFinal: true }
        ]
      }
    }
  })

  // 3. Workflow para Días Libres (Solicitud)
  const freeDayWorkflow = await prisma.workflowDefinition.create({
    data: {
      code: 'request_free_day',
      name: 'Solicitud de Día Libre',
      entityType: 'REQUEST',
      states: {
        create: [
          { code: 'pending', name: 'Pendiente', color: 'amber', order: 1, isInitial: true },
          { code: 'dept_review', name: 'Revisión Jefe Depto', color: 'blue', order: 2 },
          { code: 'admin_review', name: 'En Administración', color: 'purple', order: 3 },
          { code: 'approved', name: 'Aprobada', color: 'green', order: 4, isFinal: true },
          { code: 'rejected', name: 'Rechazada', color: 'red', order: 5, isFinal: true, isTerminal: true }
        ]
      }
    }
  })

  // 4. Workflow para Visitas Médicas (con documentación)
  const medicalWorkflow = await prisma.workflowDefinition.create({
    data: {
      code: 'request_medical',
      name: 'Visita Médica',
      entityType: 'REQUEST',
      states: {
        create: [
          { code: 'communicated', name: 'Comunicada', color: 'blue', order: 1, isInitial: true },
          { code: 'pending_docs', name: 'Pendiente Documentación', color: 'amber', order: 2 },
          { code: 'docs_submitted', name: 'Documentación Presentada', color: 'purple', order: 3 },
          { code: 'validated', name: 'Validada', color: 'green', order: 4, isFinal: true },
          { code: 'rejected', name: 'Rechazada', color: 'red', order: 5, isTerminal: true }
        ]
      }
    }
  })

  console.log('✅ Workflows seedeados')
}
```

---

## ⚙️ Motor de Workflow (TypeScript)

```typescript
// server/utils/workflow/engine.ts
import { prisma } from '../utils/db'
import type { UserRole } from '@prisma/client'

interface TransitionContext {
  entityId: string
  entityType: 'TASK' | 'REQUEST'
  toStateCode: string
  actorId: string
  actorRole: UserRole
  comment?: string
  metadata?: Record<string, any>
}

interface TransitionResult {
  success: boolean
  error?: string
  newState?: any
}

export class WorkflowEngine {
  
  // Obtener transiciones disponibles para una entidad
  async getAvailableTransitions(
    entityId: string, 
    entityType: 'TASK' | 'REQUEST',
    userRole: UserRole
  ) {
    const entity = entityType === 'TASK' 
      ? await prisma.task.findUnique({ 
          where: { id: entityId },
          include: { workflow: { include: { transitions: {
            where: { allowedRoles: { contains: userRole } },
            include: { toState: true }
          }}}}
        })
      : await prisma.request.findUnique({ /* similar */ })

    if (!entity) throw new Error('Entidad no encontrada')

    return entity.workflow.transitions.filter(t => 
      t.fromStateId === entity.currentStateId
    )
  }

  // Ejecutar transición
  async executeTransition(context: TransitionContext): Promise<TransitionResult> {
    const { entityId, entityType, toStateCode, actorId, actorRole, comment, metadata } = context

    return await prisma.$transaction(async (tx) => {
      // 1. Obtener entidad con workflow
      const entity = entityType === 'TASK'
        ? await tx.task.findUnique({
            where: { id: entityId },
            include: { 
              currentState: true,
              workflow: { 
                include: { 
                  states: true,
                  transitions: { include: { toState: true, fromState: true }}
                }
              }
            }
          })
        : await tx.request.findUnique({ /* similar */ })

      if (!entity) return { success: false, error: 'Entidad no encontrada' }

      // 2. Buscar transición válida
      const targetState = entity.workflow.states.find(s => s.code === toStateCode)
      if (!targetState) return { success: false, error: 'Estado destino no existe' }

      const transition = entity.workflow.transitions.find(t => 
        t.fromStateId === entity.currentStateId && 
        t.toStateId === targetState.id &&
        JSON.parse(t.allowedRoles).includes(actorRole)
      )

      if (!transition) {
        return { 
          success: false, 
          error: `Transición no permitida: ${entity.currentState.code} → ${toStateCode}` 
        }
      }

      // 3. Validaciones específicas (ej: quota de días libres)
      if (transition.validatorCode) {
        const validator = this.getValidator(transition.validatorCode)
        const validation = await validator(entity, context, tx)
        if (!validation.valid) {
          return { success: false, error: validation.error }
        }
      }

      // 4. Ejecutar acciones automáticas
      if (transition.autoActions) {
        const actions = JSON.parse(transition.autoActions)
        for (const action of actions) {
          await this.executeAction(action, entity, context, tx)
        }
      }

      // 5. Actualizar estado
      const updated = entityType === 'TASK'
        ? await tx.task.update({
            where: { id: entityId },
            data: { currentStateId: targetState.id }
          })
        : await tx.request.update({ /* similar */ })

      // 6. Registrar historial
      await tx.stateHistory.create({
        data: {
          [`${entityType.toLowerCase()}Id`]: entityId,
          fromStateId: entity.currentStateId,
          toStateId: targetState.id,
          actorId,
          comment,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      })

      return { success: true, newState: targetState }
    })
  }

  // Validadores custom por código
  private getValidator(code: string) {
    const validators: Record<string, Function> = {
      check_quota: async (entity: any, context: any, tx: any) => {
        // Lógica para verificar cuota de días libres
        return { valid: true }
      },
      validate_schedule: async (entity: any, context: any, tx: any) => {
        // Verificar conflictos de horario
        return { valid: true }
      }
    }
    return validators[code] || (() => ({ valid: true }))
  }

  // Acciones automáticas
  private async executeAction(action: string, entity: any, context: any, tx: any) {
    switch (action) {
      case 'create_notification':
        // Crear notificación al creador
        await tx.notification.create({
          data: {
            userId: entity.creatorId || entity.requesterId,
            title: 'Cambio de estado',
            message: `Tu ${entity.workflow.entityType.toLowerCase()} cambió a ${entity.currentState.name}`
          }
        })
        break
      case 'update_calendar':
        // Actualizar calendario si es aprobación de día libre
        if (entity.workflow.code === 'request_free_day' && entity.currentState.code === 'approved') {
          await tx.userCalendarEvent.create({
            data: {
              userId: entity.requesterId,
              date: entity.requestedDate,
              type: 'FREE_DAY'
            }
          })
        }
        break
    }
  }
}
```

---

## 🎯 Uso en API

```typescript
// server/api/tasks/[id]/transition.post.ts
import { WorkflowEngine } from '~/server/utils/workflow/engine'

export default defineEventHandler(async (event) => {
  const { user } = await useUserSession()
  const taskId = getRouterParam(event, 'id')
  const { toState, comment, metadata } = await readBody(event)

  const engine = new WorkflowEngine()
  
  const result = await engine.executeTransition({
    entityId: taskId!,
    entityType: 'TASK',
    toStateCode: toState,
    actorId: user.id,
    actorRole: user.role,
    comment,
    metadata
  })

  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error })
  }

  return { success: true, state: result.newState }
})
```

---

## 📊 Comparativa: Antes vs Después

| Aspecto | Modelo Actual | Modelo Propuesto |
|---------|--------------|------------------|
| **Nuevo tipo de tarea** | Modificar código + deploy | Insertar filas en BD |
| **Nuevo estado** | Migración + código | Configuración en admin |
| **Transiciones** | Hardcoded en TypeScript | Data-driven en BD |
| **Validaciones custom** | If/else en código | `validatorCode` en transición |
| **Auditoría** | ActivityLog genérico | StateHistory con contexto |
| **UI dinámica** | Switch por tipo | Leer estados del workflow |

---

## 🚀 Ventajas de esta Arquitectura

1. **Zero-code nuevos workflows**: Un admin puede crear "Validación de Facturas" sin tocar código
2. **Versionado**: `WorkflowDefinition.version` permite evolucionar workflows sin romper instancias antiguas
3. **A/B testing**: Dos versiones del mismo workflow activas
4. **Multi-tenant**: Diferentes departamentos pueden tener workflows distintos para el mismo tipo
5. **Analytics**: Consultas SQL directas sobre `StateHistory` para métricas (tiempo promedio en cada estado, cuellos de botella)

¿Quieres que desarrolle también el panel de administración para gestionar estos workflows o la UI dinámica que se adapta al workflow asignado?