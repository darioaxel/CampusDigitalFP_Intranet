// prisma/seed/seeders/workflow.seeder.ts
// Seeder para workflows configurables por defecto

import type { PrismaClient } from '@prisma/client'
import { allWorkflows } from '../data/workflows.js'

export async function seedWorkflows(prisma: PrismaClient): Promise<void> {
  console.log('🔄 Seedando workflows configurables...')

  for (const workflowData of allWorkflows) {
    // Verificar si el workflow ya existe
    const existingWorkflow = await prisma.workflowDefinition.findUnique({
      where: { code: workflowData.code },
      include: { states: true, transitions: true }
    })

    if (existingWorkflow) {
      console.log(`  🔄 Actualizando workflow existente: ${workflowData.name}`)
      
      // Actualizar información básica del workflow
      await prisma.workflowDefinition.update({
        where: { id: existingWorkflow.id },
        data: {
          name: workflowData.name,
          description: workflowData.description,
          version: workflowData.version,
          isActive: workflowData.isActive
        }
      })

      // Sincronizar estados: crear nuevos que no existan
      for (const stateData of workflowData.states) {
        const existingState = existingWorkflow.states.find(s => s.code === stateData.code)
        
        if (!existingState) {
          // Crear nuevo estado
          await prisma.workflowState.create({
            data: {
              workflowId: existingWorkflow.id,
              code: stateData.code,
              name: stateData.name,
              color: stateData.color,
              order: stateData.order,
              isInitial: stateData.isInitial || false,
              isFinal: stateData.isFinal || false,
              isTerminal: stateData.isTerminal || false
            }
          })
          console.log(`    ✓ Nuevo estado creado: ${stateData.name}`)
        } else {
          // Actualizar estado existente
          await prisma.workflowState.update({
            where: { id: existingState.id },
            data: {
              name: stateData.name,
              color: stateData.color,
              order: stateData.order,
              isInitial: stateData.isInitial || false,
              isFinal: stateData.isFinal || false,
              isTerminal: stateData.isTerminal || false
            }
          })
        }
      }

      // Recargar estados para obtener los IDs actualizados
      const updatedStates = await prisma.workflowState.findMany({
        where: { workflowId: existingWorkflow.id }
      })

      // Sincronizar transiciones: crear nuevas que no existan
      for (const transitionData of workflowData.transitions) {
        const fromState = updatedStates.find(s => s.code === transitionData.fromCode)
        const toState = updatedStates.find(s => s.code === transitionData.toCode)

        if (!fromState || !toState) {
          console.warn(`    ⚠️ Estados no encontrados para transición: ${transitionData.fromCode} -> ${transitionData.toCode}`)
          continue
        }

        // Verificar si la transición ya existe
        const existingTransition = existingWorkflow.transitions.find(
          t => t.fromStateId === fromState.id && t.toStateId === toState.id
        )

        if (!existingTransition) {
          // Crear nueva transición
          await prisma.workflowTransition.create({
            data: {
              workflowId: existingWorkflow.id,
              fromStateId: fromState.id,
              toStateId: toState.id,
              allowedRoles: JSON.stringify(transitionData.allowedRoles),
              requiresComment: transitionData.requiresComment || false,
              autoActions: transitionData.autoActions ? JSON.stringify(transitionData.autoActions) : null
            }
          })
          console.log(`    ✓ Nueva transición creada: ${transitionData.fromCode} -> ${transitionData.toCode}`)
        } else {
          // Actualizar transición existente
          await prisma.workflowTransition.update({
            where: { id: existingTransition.id },
            data: {
              allowedRoles: JSON.stringify(transitionData.allowedRoles),
              requiresComment: transitionData.requiresComment || false,
              autoActions: transitionData.autoActions ? JSON.stringify(transitionData.autoActions) : null
            }
          })
        }
      }

      console.log(`  ✓ Workflow actualizado: ${workflowData.name}`)
      continue
    }

    // Crear el workflow con sus estados (código original para workflows nuevos)
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
}
