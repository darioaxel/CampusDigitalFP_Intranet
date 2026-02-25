// server/utils/workflow/index.ts
// Exportaciones del sistema de workflow

export { WorkflowStateMachine, workflowStateMachine } from './stateMachine'
export { WorkflowEngine, workflowEngine } from './engine'

// Re-exportar tipos útiles
export type { 
  TransitionContext, 
  TransitionResult, 
  AvailableTransition 
} from './engine'

export type {
  TransitionConfig,
  TransitionContext as LegacyTransitionContext,
  StateMachineResult,
  EntityType
} from './stateMachine'
