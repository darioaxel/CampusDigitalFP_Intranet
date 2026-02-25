// prisma/seed/seeders/task.seeder.ts
// Seeder para tareas de ejemplo usando workflows configurables

import type { PrismaClient, User } from '@prisma/client'

export async function seedTasks(prisma: PrismaClient, users: User[]): Promise<void> {
  console.log('📝 Seedando tareas de ejemplo...')

  // Filtrar usuarios por rol
  const jefesDepto = users.filter(u => u.role === 'JEFE_DEPT')
  const profesores = users.filter(u => u.role === 'PROFESOR')
  const expertos = users.filter(u => u.role === 'EXPERTO')
  const admins = users.filter(u => u.role === 'ADMIN' || u.role === 'ROOT')
  
  if (jefesDepto.length === 0 || profesores.length === 0) {
    console.log('  ⚠️ No hay suficientes usuarios para crear tareas')
    return
  }

  // Obtener workflows
  const simpleWorkflow = await prisma.workflowDefinition.findUnique({
    where: { code: 'task_simple' },
    include: { states: true }
  })
  
  const validationWorkflow = await prisma.workflowDefinition.findUnique({
    where: { code: 'task_validation' },
    include: { states: true }
  })
  
  const votingWorkflow = await prisma.workflowDefinition.findUnique({
    where: { code: 'task_voting' },
    include: { states: true }
  })

  if (!simpleWorkflow || !validationWorkflow || !votingWorkflow) {
    console.log('  ⚠️ Workflows no encontrados, saltando tareas')
    return
  }

  const todoState = simpleWorkflow.states.find(s => s.code === 'todo')!
  const inProgressState = simpleWorkflow.states.find(s => s.code === 'in_progress')!
  const doneState = simpleWorkflow.states.find(s => s.code === 'done')!
  const inReviewState = validationWorkflow.states.find(s => s.code === 'in_review')!
  const votingOpenState = votingWorkflow.states.find(s => s.code === 'voting_open')!

  // ========================================
  // TAREAS SIMPLES
  // ========================================
  
  // Tarea 1: Simple completada
  const task1 = await prisma.task.create({
    data: {
      title: 'Revisar programación didáctica ASIR',
      description: 'Revisar y actualizar la programación didáctica del ciclo ASIR para el curso 2025-2026',
      workflowId: simpleWorkflow.id,
      currentStateId: doneState.id,
      creatorId: jefesDepto[0].id,
      dueDate: new Date('2025-09-01'),
      completedAt: new Date('2025-08-15'),
      context: JSON.stringify({ type: 'SYLLABUS_CREATION', ciclo: 'ASIR' }),
      assignments: {
        create: profesores.slice(0, 2).map((p, i) => ({
          assigneeId: p.id,
          completedAt: i === 0 ? new Date('2025-08-15') : undefined
        }))
      }
    }
  })
  console.log(`  ✓ Tarea creada: ${task1.title}`)

  // Tarea 2: Simple en progreso
  const task2 = await prisma.task.create({
    data: {
      title: 'Preparar material para FP Básica',
      description: 'Elaborar material didáctico adaptado para alumnos de FP Básica',
      workflowId: simpleWorkflow.id,
      currentStateId: inProgressState.id,
      creatorId: jefesDepto[0].id,
      dueDate: new Date('2025-10-15'),
      context: JSON.stringify({ type: 'MEETING', prioridad: 'alta' }),
      assignments: {
        create: [
          { assigneeId: profesores[0].id },
          ...(expertos[0] ? [{ assigneeId: expertos[0].id }] : [])
        ]
      }
    }
  })
  console.log(`  ✓ Tarea creada: ${task2.title}`)

  // Tarea 3: Simple pendiente
  const task3 = await prisma.task.create({
    data: {
      title: 'Coordinación con empresas para prácticas',
      description: 'Contactar con empresas del sector para establecer convenios de prácticas',
      workflowId: simpleWorkflow.id,
      currentStateId: todoState.id,
      creatorId: admins[0]?.id || jefesDepto[0].id,
      dueDate: new Date('2025-11-30'),
      context: JSON.stringify({ type: 'OTHER', sector: 'TIC' }),
      assignments: {
        create: [
          { assigneeId: profesores[2]?.id || profesores[0].id }
        ]
      }
    }
  })
  console.log(`  ✓ Tarea creada: ${task3.title}`)

  // ========================================
  // TAREAS DE VALIDACIÓN
  // ========================================

  // Tarea 4: En revisión
  const task4 = await prisma.task.create({
    data: {
      title: 'Revisión de proyectos de fin de ciclo',
      description: 'Revisar y evaluar los proyectos presentados por los alumnos de 2º curso',
      workflowId: validationWorkflow.id,
      currentStateId: inReviewState.id,
      creatorId: jefesDepto[0].id,
      dueDate: new Date('2025-06-30'),
      context: JSON.stringify({ type: 'REVIEW', curso: '2º' }),
      assignments: {
        create: profesores.slice(0, 2).map(p => ({ assigneeId: p.id }))
      }
    }
  })
  console.log(`  ✓ Tarea creada: ${task4.title}`)

  // Tarea 5: Nueva tarea de validación
  const task5 = await prisma.task.create({
    data: {
      title: 'Validar calendario de exámenes',
      description: 'Revisar y aprobar el calendario de exámenes del departamento',
      workflowId: validationWorkflow.id,
      currentStateId: simpleWorkflow.states.find(s => s.code === 'todo')!.id,
      creatorId: jefesDepto[0]?.id || admins[0]?.id,
      dueDate: new Date('2025-12-15'),
      context: JSON.stringify({ type: 'REVIEW', trimestre: '1º' }),
      assignments: {
        create: [
          { assigneeId: profesores[0].id }
        ]
      }
    }
  })
  console.log(`  ✓ Tarea creada: ${task5.title}`)

  // ========================================
  // TAREAS DE VOTACIÓN
  // ========================================

  // Tarea 6: Votación abierta
  const task6 = await prisma.task.create({
    data: {
      title: 'Votación: Fecha de la jornada de puertas abiertas',
      description: 'Elegir la mejor fecha para la jornada de puertas abiertas del centro',
      workflowId: votingWorkflow.id,
      currentStateId: votingOpenState.id,
      creatorId: admins[0]?.id || jefesDepto[0].id,
      dueDate: new Date('2025-03-15'),
      votingEndsAt: new Date('2025-02-28'),
      votingOptions: JSON.stringify([
        { id: 'opt1', label: '15 de marzo' },
        { id: 'opt2', label: '22 de marzo' },
        { id: 'opt3', label: '29 de marzo' }
      ]),
      context: JSON.stringify({ type: 'VOTE', tema: 'jornada_puertas_abiertas' }),
      assignments: {
        create: users
          .filter(u => ['PROFESOR', 'EXPERTO', 'JEFE_DEPT'].includes(u.role))
          .slice(0, 5)
          .map(u => ({ assigneeId: u.id }))
      }
    }
  })
  console.log(`  ✓ Tarea creada: ${task6.title}`)

  // Crear algunos votos para la tarea 6
  const voters = users.filter(u => ['PROFESOR', 'EXPERTO'].includes(u.role)).slice(0, 3)
  for (const voter of voters) {
    await prisma.vote.create({
      data: {
        taskId: task6.id,
        voterId: voter.id,
        option: ['opt1', 'opt2', 'opt3'][Math.floor(Math.random() * 3)],
        comment: 'Me parece la mejor opción'
      }
    })
  }
  console.log(`  ✓ Votos creados para: ${task6.title}`)

  console.log('✅ Tareas seedeadas correctamente')
}
