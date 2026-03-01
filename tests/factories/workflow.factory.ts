/**
 * Factories para crear datos de prueba de workflows
 * Facilita la creación de objetos mock para testing
 */
import type { 
  WorkflowDefinition, 
  WorkflowState, 
  WorkflowTransition,
  Request,
  Task,
  User,
  StateHistory,
  WorkflowNotification,
  Role,
  EntityType
} from '@prisma/client'

// ============================================
// FACTORIES DE WORKFLOW
// ============================================

export interface WorkflowDefinitionInput {
  id?: string
  code: string
  name: string
  description?: string
  entityType: EntityType
  version?: number
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export function createWorkflowDefinition(data: WorkflowDefinitionInput): WorkflowDefinition {
  return {
    id: data.id || `wf-${Math.random().toString(36).substr(2, 9)}`,
    code: data.code,
    name: data.name,
    description: data.description || null,
    entityType: data.entityType,
    version: data.version || 1,
    isActive: data.isActive ?? true,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date()
  }
}

export interface WorkflowStateInput {
  id?: string
  workflowId: string
  code: string
  name: string
  color?: string
  order?: number
  isInitial?: boolean
  isFinal?: boolean
  isTerminal?: boolean
  config?: string | null
}

export function createWorkflowState(data: WorkflowStateInput): WorkflowState {
  return {
    id: data.id || `ws-${Math.random().toString(36).substr(2, 9)}`,
    workflowId: data.workflowId,
    code: data.code,
    name: data.name,
    color: data.color || 'gray',
    order: data.order || 1,
    isInitial: data.isInitial ?? false,
    isFinal: data.isFinal ?? false,
    isTerminal: data.isTerminal ?? false,
    config: data.config || null
  }
}

export interface WorkflowTransitionInput {
  id?: string
  workflowId: string
  fromStateId: string
  toStateId: string
  allowedRoles: Role[]
  requiresComment?: boolean
  requiresFields?: string[] | null
  autoActions?: string[] | null
  validatorCode?: string | null
}

export function createWorkflowTransition(data: WorkflowTransitionInput): WorkflowTransition {
  return {
    id: data.id || `wt-${Math.random().toString(36).substr(2, 9)}`,
    workflowId: data.workflowId,
    fromStateId: data.fromStateId,
    toStateId: data.toStateId,
    allowedRoles: JSON.stringify(data.allowedRoles),
    requiresComment: data.requiresComment ?? false,
    requiresFields: data.requiresFields ? JSON.stringify(data.requiresFields) : null,
    autoActions: data.autoActions ? JSON.stringify(data.autoActions) : null,
    validatorCode: data.validatorCode || null
  }
}

// ============================================
// FACTORIES DE USUARIOS
// ============================================

export interface UserInput {
  id?: string
  email?: string
  firstName?: string
  lastName?: string
  role?: Role
  isActive?: boolean
}

export function createUser(data: UserInput = {}): User {
  const id = data.id || `user-${Math.random().toString(36).substr(2, 9)}`
  return {
    id,
    email: data.email || `user-${id}@test.com`,
    passwordHash: 'hashed-password',
    firstName: data.firstName || 'Test',
    lastName: data.lastName || 'User',
    role: data.role || 'USER',
    phone: null,
    isActive: data.isActive ?? true,
    addressId: null,
    profileImage: null,
    preferences: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  } as User
}

// ============================================
// FACTORIES DE REQUESTS
// ============================================

export interface RequestInput {
  id?: string
  workflowId?: string | null
  currentStateId?: string | null
  requesterId: string
  type?: string
  title?: string
  description?: string | null
  status?: string
  priority?: string
  context?: string | null
}

export function createRequest(data: RequestInput): Request {
  return {
    id: data.id || `req-${Math.random().toString(36).substr(2, 9)}`,
    workflowId: data.workflowId || null,
    currentStateId: data.currentStateId || null,
    requesterId: data.requesterId,
    type: data.type || 'GENERAL',
    title: data.title || 'Test Request',
    description: data.description || null,
    status: data.status || 'pending',
    priority: data.priority || 'medium',
    context: data.context || null,
    submittedAt: new Date(),
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  } as Request
}

// ============================================
// FACTORIES DE TASKS
// ============================================

export interface TaskInput {
  id?: string
  workflowId?: string | null
  currentStateId?: string | null
  creatorId: string
  title?: string
  description?: string | null
  status?: string
  priority?: string
  dueDate?: Date | null
}

export function createTask(data: TaskInput): Task {
  return {
    id: data.id || `task-${Math.random().toString(36).substr(2, 9)}`,
    workflowId: data.workflowId || null,
    currentStateId: data.currentStateId || null,
    creatorId: data.creatorId,
    title: data.title || 'Test Task',
    description: data.description || null,
    status: data.status || 'pending',
    priority: data.priority || 'medium',
    dueDate: data.dueDate || null,
    createdAt: new Date(),
    updatedAt: new Date()
  } as Task
}

// ============================================
// FACTORIES DE HISTORIAL
// ============================================

export interface StateHistoryInput {
  id?: string
  requestId?: string | null
  taskId?: string | null
  fromStateId: string
  toStateId: string
  actorId: string
  comment?: string | null
  metadata?: string | null
}

export function createStateHistory(data: StateHistoryInput): StateHistory {
  return {
    id: data.id || `sh-${Math.random().toString(36).substr(2, 9)}`,
    requestId: data.requestId || null,
    taskId: data.taskId || null,
    fromStateId: data.fromStateId,
    toStateId: data.toStateId,
    actorId: data.actorId,
    comment: data.comment || null,
    metadata: data.metadata || null,
    createdAt: new Date()
  } as StateHistory
}

// ============================================
// FACTORIES DE NOTIFICACIONES
// ============================================

export interface WorkflowNotificationInput {
  id?: string
  userId: string
  title?: string
  message?: string
  type?: string
  requestId?: string | null
  taskId?: string | null
  isRead?: boolean
}

export function createWorkflowNotification(data: WorkflowNotificationInput): WorkflowNotification {
  return {
    id: data.id || `notif-${Math.random().toString(36).substr(2, 9)}`,
    userId: data.userId,
    title: data.title || 'Test Notification',
    message: data.message || 'Test message',
    type: data.type || 'info',
    requestId: data.requestId || null,
    taskId: data.taskId || null,
    isRead: data.isRead ?? false,
    readAt: null,
    actionUrl: null,
    actionLabel: null,
    createdAt: new Date()
  } as WorkflowNotification
}

// ============================================
// BUILDERS COMPLEJOS
// ============================================

/**
 * Builder para crear un workflow completo con estados y transiciones
 */
export class WorkflowBuilder {
  private workflow: WorkflowDefinition
  private states: WorkflowState[] = []
  private transitions: WorkflowTransition[] = []

  constructor(code: string, name: string, entityType: EntityType) {
    this.workflow = createWorkflowDefinition({ code, name, entityType })
  }

  addState(code: string, name: string, options: Partial<Omit<WorkflowStateInput, 'workflowId' | 'code' | 'name'>> = {}): this {
    this.states.push(createWorkflowState({
      workflowId: this.workflow.id,
      code,
      name,
      ...options
    }))
    return this
  }

  addTransition(fromCode: string, toCode: string, allowedRoles: Role[], options: Partial<Omit<WorkflowTransitionInput, 'workflowId' | 'fromStateId' | 'toStateId' | 'allowedRoles'>> = {}): this {
    const fromState = this.states.find(s => s.code === fromCode)
    const toState = this.states.find(s => s.code === toCode)
    
    if (!fromState || !toState) {
      throw new Error(`Estados no encontrados: ${fromCode} -> ${toCode}`)
    }

    this.transitions.push(createWorkflowTransition({
      workflowId: this.workflow.id,
      fromStateId: fromState.id,
      toStateId: toState.id,
      allowedRoles,
      ...options
    }))
    return this
  }

  build() {
    return {
      workflow: this.workflow,
      states: this.states,
      transitions: this.transitions
    }
  }

  getWorkflow() { return this.workflow }
  getStates() { return this.states }
  getState(code: string) { return this.states.find(s => s.code === code) }
  getTransitions() { return this.transitions }
}
