// prisma/seed/seeders/workflow.seeder.ts
// Seeder para workflows configurables por defecto

import type { PrismaClient } from '@prisma/client'

export async function seedWorkflows(prisma: PrismaClient): Promise<void> {
  console.log('🔄 Seedando workflows configurables...')

  // ========================================
  // 1. WORKFLOW: Validación de Tarea (REVIEW)
  // ========================================
  const validationWorkflow = await prisma.workflowDefinition.create({
    data: {
      code: 'task_validation',
      name: 'Validación de Tarea',
      description: 'Flujo simple: Pendiente → En Revisión → Aprobado/Rechazado',
      entityType: 'TASK',
      version: 1,
      isActive: true,
      states: {
        create: [
          { code: 'todo', name: 'Por hacer', color: 'gray', order: 1, isInitial: true },
          { code: 'in_progress', name: 'En progreso', color: 'blue', order: 2 },
          { code: 'in_review', name: 'En revisión', color: 'amber', order: 3 },
          { code: 'approved', name: 'Aprobado', color: 'green', order: 4, isFinal: true },
          { code: 'rejected', name: 'Rechazado', color: 'red', order: 5, isFinal: true, isTerminal: true },
          { code: 'cancelled', name: 'Cancelado', color: 'gray', order: 6, isTerminal: true }
        ]
      }
    },
    include: { states: true }
  })

  // Crear transiciones para validación
  const validationStates = validationWorkflow.states
  await prisma.workflowTransition.createMany({
    data: [
      // todo → in_progress
      {
        workflowId: validationWorkflow.id,
        fromStateId: validationStates.find(s => s.code === 'todo')!.id,
        toStateId: validationStates.find(s => s.code === 'in_progress')!.id,
        allowedRoles: JSON.stringify(['PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT'])
      },
      // in_progress → in_review
      {
        workflowId: validationWorkflow.id,
        fromStateId: validationStates.find(s => s.code === 'in_progress')!.id,
        toStateId: validationStates.find(s => s.code === 'in_review')!.id,
        allowedRoles: JSON.stringify(['PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT'])
      },
      // in_review → approved (requiere comentario)
      {
        workflowId: validationWorkflow.id,
        fromStateId: validationStates.find(s => s.code === 'in_review')!.id,
        toStateId: validationStates.find(s => s.code === 'approved')!.id,
        allowedRoles: JSON.stringify(['JEFE_DEPT', 'ADMIN', 'ROOT']),
        requiresComment: true,
        autoActions: JSON.stringify(['create_notification', 'notify_assignees'])
      },
      // in_review → rejected
      {
        workflowId: validationWorkflow.id,
        fromStateId: validationStates.find(s => s.code === 'in_review')!.id,
        toStateId: validationStates.find(s => s.code === 'rejected')!.id,
        allowedRoles: JSON.stringify(['JEFE_DEPT', 'ADMIN', 'ROOT']),
        requiresComment: true,
        autoActions: JSON.stringify(['create_notification', 'notify_assignees'])
      },
      // todo → cancelled
      {
        workflowId: validationWorkflow.id,
        fromStateId: validationStates.find(s => s.code === 'todo')!.id,
        toStateId: validationStates.find(s => s.code === 'cancelled')!.id,
        allowedRoles: JSON.stringify(['JEFE_DEPT', 'ADMIN', 'ROOT']),
        autoActions: JSON.stringify(['notify_assignees'])
      }
    ]
  })

  console.log(`  ✓ Workflow: ${validationWorkflow.name}`)

  // ========================================
  // 2. WORKFLOW: Votación
  // ========================================
  const votingWorkflow = await prisma.workflowDefinition.create({
    data: {
      code: 'task_voting',
      name: 'Votación',
      description: 'Votación con múltiples opciones',
      entityType: 'TASK',
      version: 1,
      isActive: true,
      states: {
        create: [
          { code: 'voting_open', name: 'Votación Abierta', color: 'green', order: 1, isInitial: true },
          { code: 'voting_closed', name: 'Votación Cerrada', color: 'amber', order: 2 },
          { code: 'resolved', name: 'Resuelto', color: 'purple', order: 3, isFinal: true }
        ]
      }
    },
    include: { states: true }
  })

  const votingStates = votingWorkflow.states
  await prisma.workflowTransition.createMany({
    data: [
      // voting_open → voting_closed
      {
        workflowId: votingWorkflow.id,
        fromStateId: votingStates.find(s => s.code === 'voting_open')!.id,
        toStateId: votingStates.find(s => s.code === 'voting_closed')!.id,
        allowedRoles: JSON.stringify(['JEFE_DEPT', 'ADMIN', 'ROOT']),
        autoActions: JSON.stringify(['notify_assignees'])
      },
      // voting_closed → resolved
      {
        workflowId: votingWorkflow.id,
        fromStateId: votingStates.find(s => s.code === 'voting_closed')!.id,
        toStateId: votingStates.find(s => s.code === 'resolved')!.id,
        allowedRoles: JSON.stringify(['JEFE_DEPT', 'ADMIN', 'ROOT']),
        requiresComment: true,
        autoActions: JSON.stringify(['create_notification', 'notify_assignees'])
      }
    ]
  })

  console.log(`  ✓ Workflow: ${votingWorkflow.name}`)

  // ========================================
  // 3. WORKFLOW: Solicitud de Día Libre
  // ========================================
  const freeDayWorkflow = await prisma.workflowDefinition.create({
    data: {
      code: 'request_free_day',
      name: 'Solicitud de Día Libre',
      description: 'Flujo de aprobación para días de libre disposición',
      entityType: 'REQUEST',
      version: 1,
      isActive: true,
      states: {
        create: [
          { code: 'pending', name: 'Pendiente', color: 'amber', order: 1, isInitial: true },
          { code: 'dept_review', name: 'Revisión Jefe Depto', color: 'blue', order: 2 },
          { code: 'admin_review', name: 'En Administración', color: 'purple', order: 3 },
          { code: 'approved', name: 'Aprobada', color: 'green', order: 4, isFinal: true },
          { code: 'rejected', name: 'Rechazada', color: 'red', order: 5, isFinal: true, isTerminal: true }
        ]
      }
    },
    include: { states: true }
  })

  const freeDayStates = freeDayWorkflow.states
  await prisma.workflowTransition.createMany({
    data: [
      // pending → dept_review
      {
        workflowId: freeDayWorkflow.id,
        fromStateId: freeDayStates.find(s => s.code === 'pending')!.id,
        toStateId: freeDayStates.find(s => s.code === 'dept_review')!.id,
        allowedRoles: JSON.stringify(['JEFE_DEPT', 'ADMIN', 'ROOT'])
      },
      // dept_review → admin_review
      {
        workflowId: freeDayWorkflow.id,
        fromStateId: freeDayStates.find(s => s.code === 'dept_review')!.id,
        toStateId: freeDayStates.find(s => s.code === 'admin_review')!.id,
        allowedRoles: JSON.stringify(['ADMIN', 'ROOT'])
      },
      // admin_review → approved
      {
        workflowId: freeDayWorkflow.id,
        fromStateId: freeDayStates.find(s => s.code === 'admin_review')!.id,
        toStateId: freeDayStates.find(s => s.code === 'approved')!.id,
        allowedRoles: JSON.stringify(['ADMIN', 'ROOT']),
        validatorCode: 'check_quota',
        autoActions: JSON.stringify(['create_notification', 'update_calendar'])
      },
      // Cualquier estado previo → rejected
      {
        workflowId: freeDayWorkflow.id,
        fromStateId: freeDayStates.find(s => s.code === 'pending')!.id,
        toStateId: freeDayStates.find(s => s.code === 'rejected')!.id,
        allowedRoles: JSON.stringify(['JEFE_DEPT', 'ADMIN', 'ROOT']),
        requiresComment: true,
        autoActions: JSON.stringify(['create_notification'])
      },
      {
        workflowId: freeDayWorkflow.id,
        fromStateId: freeDayStates.find(s => s.code === 'dept_review')!.id,
        toStateId: freeDayStates.find(s => s.code === 'rejected')!.id,
        allowedRoles: JSON.stringify(['JEFE_DEPT', 'ADMIN', 'ROOT']),
        requiresComment: true,
        autoActions: JSON.stringify(['create_notification'])
      },
      {
        workflowId: freeDayWorkflow.id,
        fromStateId: freeDayStates.find(s => s.code === 'admin_review')!.id,
        toStateId: freeDayStates.find(s => s.code === 'rejected')!.id,
        allowedRoles: JSON.stringify(['ADMIN', 'ROOT']),
        requiresComment: true,
        autoActions: JSON.stringify(['create_notification'])
      }
    ]
  })

  console.log(`  ✓ Workflow: ${freeDayWorkflow.name}`)

  // ========================================
  // 4. WORKFLOW: Visita Médica
  // ========================================
  const medicalWorkflow = await prisma.workflowDefinition.create({
    data: {
      code: 'request_medical',
      name: 'Visita Médica',
      description: 'Gestión de avisos de asistencia a visita médica con documentación',
      entityType: 'REQUEST',
      version: 1,
      isActive: true,
      states: {
        create: [
          { code: 'communicated', name: 'Comunicada', color: 'blue', order: 1, isInitial: true },
          { code: 'pending_docs', name: 'Pendiente Documentación', color: 'amber', order: 2 },
          { code: 'docs_submitted', name: 'Documentación Presentada', color: 'purple', order: 3 },
          { code: 'validated', name: 'Validada', color: 'green', order: 4, isFinal: true },
          { code: 'rejected', name: 'Rechazada', color: 'red', order: 5, isTerminal: true }
        ]
      }
    },
    include: { states: true }
  })

  const medicalStates = medicalWorkflow.states
  await prisma.workflowTransition.createMany({
    data: [
      // communicated → pending_docs
      {
        workflowId: medicalWorkflow.id,
        fromStateId: medicalStates.find(s => s.code === 'communicated')!.id,
        toStateId: medicalStates.find(s => s.code === 'pending_docs')!.id,
        allowedRoles: JSON.stringify(['ADMIN', 'ROOT']),
        autoActions: JSON.stringify(['create_notification'])
      },
      // pending_docs → docs_submitted
      {
        workflowId: medicalWorkflow.id,
        fromStateId: medicalStates.find(s => s.code === 'pending_docs')!.id,
        toStateId: medicalStates.find(s => s.code === 'docs_submitted')!.id,
        allowedRoles: JSON.stringify(['PROFESOR', 'EXPERTO', 'JEFE_DEPT']),
        requiresFields: JSON.stringify(['documentUrl']),
        autoActions: JSON.stringify(['create_notification'])
      },
      // docs_submitted → validated
      {
        workflowId: medicalWorkflow.id,
        fromStateId: medicalStates.find(s => s.code === 'docs_submitted')!.id,
        toStateId: medicalStates.find(s => s.code === 'validated')!.id,
        allowedRoles: JSON.stringify(['ADMIN', 'ROOT']),
        validatorCode: 'check_documents',
        autoActions: JSON.stringify(['create_notification'])
      },
      // Cualquier estado → rejected
      {
        workflowId: medicalWorkflow.id,
        fromStateId: medicalStates.find(s => s.code === 'communicated')!.id,
        toStateId: medicalStates.find(s => s.code === 'rejected')!.id,
        allowedRoles: JSON.stringify(['ADMIN', 'ROOT']),
        requiresComment: true,
        autoActions: JSON.stringify(['create_notification'])
      },
      {
        workflowId: medicalWorkflow.id,
        fromStateId: medicalStates.find(s => s.code === 'pending_docs')!.id,
        toStateId: medicalStates.find(s => s.code === 'rejected')!.id,
        allowedRoles: JSON.stringify(['ADMIN', 'ROOT']),
        requiresComment: true,
        autoActions: JSON.stringify(['create_notification'])
      },
      {
        workflowId: medicalWorkflow.id,
        fromStateId: medicalStates.find(s => s.code === 'docs_submitted')!.id,
        toStateId: medicalStates.find(s => s.code === 'rejected')!.id,
        allowedRoles: JSON.stringify(['ADMIN', 'ROOT']),
        requiresComment: true,
        autoActions: JSON.stringify(['create_notification'])
      }
    ]
  })

  console.log(`  ✓ Workflow: ${medicalWorkflow.name}`)

  // ========================================
  // 5. WORKFLOW: Tarea Simple (básica)
  // ========================================
  const simpleTaskWorkflow = await prisma.workflowDefinition.create({
    data: {
      code: 'task_simple',
      name: 'Tarea Simple',
      description: 'Flujo básico para tareas sin validación compleja',
      entityType: 'TASK',
      version: 1,
      isActive: true,
      states: {
        create: [
          { code: 'todo', name: 'Por hacer', color: 'gray', order: 1, isInitial: true },
          { code: 'in_progress', name: 'En progreso', color: 'blue', order: 2 },
          { code: 'done', name: 'Completada', color: 'green', order: 3, isFinal: true },
          { code: 'cancelled', name: 'Cancelada', color: 'red', order: 4, isTerminal: true }
        ]
      }
    },
    include: { states: true }
  })

  const simpleStates = simpleTaskWorkflow.states
  await prisma.workflowTransition.createMany({
    data: [
      {
        workflowId: simpleTaskWorkflow.id,
        fromStateId: simpleStates.find(s => s.code === 'todo')!.id,
        toStateId: simpleStates.find(s => s.code === 'in_progress')!.id,
        allowedRoles: JSON.stringify(['PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT'])
      },
      {
        workflowId: simpleTaskWorkflow.id,
        fromStateId: simpleStates.find(s => s.code === 'in_progress')!.id,
        toStateId: simpleStates.find(s => s.code === 'done')!.id,
        allowedRoles: JSON.stringify(['PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT']),
        autoActions: JSON.stringify(['notify_creator'])
      },
      {
        workflowId: simpleTaskWorkflow.id,
        fromStateId: simpleStates.find(s => s.code === 'in_progress')!.id,
        toStateId: simpleStates.find(s => s.code === 'todo')!.id,
        allowedRoles: JSON.stringify(['PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT'])
      },
      {
        workflowId: simpleTaskWorkflow.id,
        fromStateId: simpleStates.find(s => s.code === 'todo')!.id,
        toStateId: simpleStates.find(s => s.code === 'cancelled')!.id,
        allowedRoles: JSON.stringify(['JEFE_DEPT', 'ADMIN', 'ROOT'])
      }
    ]
  })

  console.log(`  ✓ Workflow: ${simpleTaskWorkflow.name}`)

  // ========================================
  // 6. WORKFLOW: Solicitud Estándar
  // ========================================
  const standardRequestWorkflow = await prisma.workflowDefinition.create({
    data: {
      code: 'request_standard',
      name: 'Solicitud Estándar',
      description: 'Flujo estándar para permisos, formaciones y otras solicitudes',
      entityType: 'REQUEST',
      version: 1,
      isActive: true,
      states: {
        create: [
          { code: 'pending', name: 'Pendiente', color: 'amber', order: 1, isInitial: true },
          { code: 'approved', name: 'Aprobada', color: 'green', order: 2, isFinal: true },
          { code: 'rejected', name: 'Rechazada', color: 'red', order: 3, isFinal: true, isTerminal: true }
        ]
      }
    },
    include: { states: true }
  })

  const standardStates = standardRequestWorkflow.states
  await prisma.workflowTransition.createMany({
    data: [
      {
        workflowId: standardRequestWorkflow.id,
        fromStateId: standardStates.find(s => s.code === 'pending')!.id,
        toStateId: standardStates.find(s => s.code === 'approved')!.id,
        allowedRoles: JSON.stringify(['ADMIN', 'ROOT']),
        autoActions: JSON.stringify(['create_notification'])
      },
      {
        workflowId: standardRequestWorkflow.id,
        fromStateId: standardStates.find(s => s.code === 'pending')!.id,
        toStateId: standardStates.find(s => s.code === 'rejected')!.id,
        allowedRoles: JSON.stringify(['ADMIN', 'ROOT']),
        requiresComment: true,
        autoActions: JSON.stringify(['create_notification'])
      }
    ]
  })

  console.log(`  ✓ Workflow: ${standardRequestWorkflow.name}`)

  // ========================================
  // 7. WORKFLOW: Alta de Nuevo Usuario
  // ========================================
  const newUserWorkflow = await prisma.workflowDefinition.create({
    data: {
      code: 'request_new_user',
      name: 'Alta de Nuevo Usuario',
      description: 'Proceso de solicitud y aprobación para dar de alta un nuevo usuario en el sistema',
      entityType: 'REQUEST',
      version: 1,
      isActive: true,
      states: {
        create: [
          { code: 'pending', name: 'Pendiente', color: 'amber', order: 1, isInitial: true },
          { code: 'reviewing', name: 'En Revisión', color: 'blue', order: 2 },
          { code: 'approved', name: 'Aprobado', color: 'green', order: 3, isFinal: true },
          { code: 'rejected', name: 'Rechazado', color: 'red', order: 4, isFinal: true, isTerminal: true }
        ]
      }
    },
    include: { states: true }
  })

  const newUserStates = newUserWorkflow.states
  await prisma.workflowTransition.createMany({
    data: [
      {
        workflowId: newUserWorkflow.id,
        fromStateId: newUserStates.find(s => s.code === 'pending')!.id,
        toStateId: newUserStates.find(s => s.code === 'reviewing')!.id,
        allowedRoles: JSON.stringify(['ADMIN', 'ROOT'])
      },
      {
        workflowId: newUserWorkflow.id,
        fromStateId: newUserStates.find(s => s.code === 'reviewing')!.id,
        toStateId: newUserStates.find(s => s.code === 'approved')!.id,
        allowedRoles: JSON.stringify(['ADMIN', 'ROOT']),
        requiresComment: true,
        autoActions: JSON.stringify(['create_notification'])
      },
      {
        workflowId: newUserWorkflow.id,
        fromStateId: newUserStates.find(s => s.code === 'reviewing')!.id,
        toStateId: newUserStates.find(s => s.code === 'rejected')!.id,
        allowedRoles: JSON.stringify(['ADMIN', 'ROOT']),
        requiresComment: true,
        autoActions: JSON.stringify(['create_notification'])
      },
      {
        workflowId: newUserWorkflow.id,
        fromStateId: newUserStates.find(s => s.code === 'pending')!.id,
        toStateId: newUserStates.find(s => s.code === 'rejected')!.id,
        allowedRoles: JSON.stringify(['ADMIN', 'ROOT']),
        requiresComment: true,
        autoActions: JSON.stringify(['create_notification'])
      }
    ]
  })

  console.log(`  ✓ Workflow: ${newUserWorkflow.name}`)

  console.log('✅ Workflows seedeados correctamente')
}
