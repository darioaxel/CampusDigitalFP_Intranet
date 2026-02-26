// prisma/seed/seeders/workflow.seeder.ts
// Seeder para workflows configurables por defecto

import type { PrismaClient } from '@prisma/client'
import { allWorkflows } from '../data/workflows.js'

export async function seedWorkflows(prisma: PrismaClient): Promise<void> {
  console.log('🔄 Seedando workflows configurables...')

  for (const workflowData of allWorkflows) {
    // Verificar si el workflow ya existe
    const existingWorkflow = await prisma.workflowDefinition.findUnique({
      where: { code: workflowData.code }
    })

    if (existingWorkflow) {
      console.log(`  ✓ Workflow ya existe: ${workflowData.name}`)
      continue
    }

    // Crear el workflow con sus estados
    const workflow = await prisma.workflowDefinition.create({
      data: {
        code: workflowData.code,
        name: workflowData.name,
        description: workflowData.description,
        entityType: workflowData.entityType,
        version: workflowData.version,
        isActive: workflowData.isActive,
        states: {
          create: workflowData.states.map(state => ({
            code: state.code,
            name: state.name,
            color: state.color,
            order: state.order,
            isInitial: state.isInitial || false,
            isFinal: state.isFinal || false,
            isTerminal: state.isTerminal || false
          }))
        }
      },
      include: { states: true }
    })

    // Crear las transiciones
    for (const transition of workflowData.transitions) {
      const fromState = workflow.states.find(s => s.code === transition.fromCode)
      const toState = workflow.states.find(s => s.code === transition.toCode)

      if (!fromState || !toState) {
        console.warn(`    ⚠️ Estados no encontrados para transición: ${transition.fromCode} -> ${transition.toCode}`)
        continue
      }

      await prisma.workflowTransition.create({
        data: {
          workflowId: workflow.id,
          fromStateId: fromState.id,
          toStateId: toState.id,
          allowedRoles: JSON.stringify(transition.allowedRoles),
          requiresComment: transition.requiresComment || false,
          autoActions: transition.autoActions ? JSON.stringify(transition.autoActions) : null
        }
      })
    }

    console.log(`  ✓ Workflow creado: ${workflow.name} (${workflow.states.length} estados, ${workflowData.transitions.length} transiciones)`)
  }

  console.log('✅ Workflows seedeados correctamente')
  console.log('⚠️  NOTA: Solo se ha creado el workflow de solicitud NEW_USER. Otros workflows de solicitud están deshabilitados para pruebas.')
}
