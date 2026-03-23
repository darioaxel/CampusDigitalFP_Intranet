<script setup lang="ts">
// app/components/workflow/WorkflowMermaidDiagram.vue
// Diagrama de flujo del workflow usando Mermaid.js

import { ref, watch, onMounted } from 'vue'
import mermaid from 'mermaid'
import type { WorkflowDefinitionJson } from '@/types/workflow-editor'

interface Props {
  workflow: WorkflowDefinitionJson | null
}

const props = defineProps<Props>()
const diagramSvg = ref('')
const error = ref('')
const isLoading = ref(false)

// Inicializar mermaid solo una vez
let mermaidInitialized = false

onMounted(() => {
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        padding: 15
      }
    })
    mermaidInitialized = true
  }
})

// Generar sintaxis mermaid del diagrama
const generateMermaidSyntax = (workflow: WorkflowDefinitionJson): string => {
  const lines: string[] = ['flowchart TD']
  
  // Ordenar estados por order
  const sortedStates = [...workflow.states].sort((a, b) => (a.order || 0) - (b.order || 0))
  
  // Definir estilos para cada estado
  sortedStates.forEach(state => {
    const nodeId = state.code.replace(/[^a-zA-Z0-9]/g, '_')
    const label = state.name.replace(/"/g, '\\"')
    
    if (state.isInitial) {
      lines.push(`    ${nodeId}(["${label}"])`)
      lines.push(`    style ${nodeId} fill:#dbeafe,stroke:#3b82f6,stroke-width:3px`)
    } else if (state.isTerminal) {
      lines.push(`    ${nodeId}(("${label}"))`)
      lines.push(`    style ${nodeId} fill:#fee2e2,stroke:#ef4444,stroke-width:2px`)
    } else if (state.isFinal) {
      lines.push(`    ${nodeId}["${label}"]`)
      lines.push(`    style ${nodeId} fill:#dcfce7,stroke:#22c55e,stroke-width:2px`)
    } else {
      lines.push(`    ${nodeId}["${label}"]`)
      const colorMap: Record<string, string> = {
        gray: '#f3f4f6,#6b7280', red: '#fee2e2,#ef4444', orange: '#ffedd5,#f97316',
        amber: '#fef3c7,#f59e0b', yellow: '#fef9c3,#eab308', lime: '#ecfccb,#84cc16',
        green: '#dcfce7,#22c55e', emerald: '#d1fae5,#10b981', teal: '#ccfbf1,#14b8a6',
        cyan: '#cffafe,#06b6d4', sky: '#e0f2fe,#0ea5e9', blue: '#dbeafe,#3b82f6',
        indigo: '#e0e7ff,#6366f1', violet: '#ede9fe,#8b5cf6', purple: '#f3e8ff,#a855f7',
        fuchsia: '#fae8ff,#d946ef', pink: '#fce7f3,#ec4899', rose: '#ffe4e6,#f43f5e'
      }
      const colors = colorMap[state.color || 'gray']?.split(',') || ['#f3f4f6', '#6b7280']
      lines.push(`    style ${nodeId} fill:${colors[0]},stroke:${colors[1]},stroke-width:2px`)
    }
  })
  
  // Definir transiciones
  workflow.transitions.forEach((trans, idx) => {
    const fromId = trans.from.replace(/[^a-zA-Z0-9]/g, '_')
    const toId = trans.to.replace(/[^a-zA-Z0-9]/g, '_')
    
    let label = trans.allowedRoles.join(', ')
    if (label.length > 12) label = label.substring(0, 10) + '..'
    
    const icons: string[] = []
    if (trans.requiresComment) icons.push('💬')
    if (trans.autoActions?.length) icons.push('⚡')
    if (trans.validatorCode) icons.push('🛡️')
    
    const iconStr = icons.length > 0 ? ` ${icons.join('')}` : ''
    
    // Flecha punteada si tiene acciones automáticas (transición automática)
    const arrowType = trans.autoActions?.length ? '-.->' : '-->'
    
    lines.push(`    ${fromId} ${arrowType}|"${label}${iconStr}"| ${toId}`)
  })
  
  return lines.join('\n')
}

// Debounce para evitar renders múltiples
let debounceTimeout: ReturnType<typeof setTimeout> | null = null

const renderDiagram = async () => {
  if (!props.workflow) return
  
  // Cancelar render anterior
  if (debounceTimeout) clearTimeout(debounceTimeout)
  
  debounceTimeout = setTimeout(async () => {
    isLoading.value = true
    error.value = ''
    
    try {
      const syntax = generateMermaidSyntax(props.workflow!)
      // Usar ID estable basado en el código del workflow, no timestamp
      const id = `workflow-${props.workflow!.code}`
      const { svg } = await mermaid.render(id, syntax)
      diagramSvg.value = svg
    } catch (err: any) {
      console.error('Error rendering mermaid:', err)
      error.value = 'Error al generar el diagrama'
    } finally {
      isLoading.value = false
    }
  }, 100) // Pequeño delay para agrupar cambios
}

// Solo renderizar cuando cambie el workflow, sin deep watching
watch(() => props.workflow, renderDiagram, { immediate: true })
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Solo el diagrama y leyenda, sin header duplicado -->
    <div class="flex-1 overflow-auto p-4 bg-background relative">
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
        <Icon name="lucide:loader-2" class="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
      
      <div v-if="error" class="flex items-center justify-center h-full text-destructive">
        <Icon name="lucide:alert-circle" class="w-5 h-5 mr-2" />
        {{ error }}
      </div>
      
      <div 
        v-else-if="diagramSvg" 
        class="mermaid-output"
        v-html="diagramSvg"
      />
    </div>

    <!-- Leyenda detallada -->
    <div class="px-3 py-2 border-t bg-muted/20 text-xs space-y-2">
      <!-- Tipos de estado -->
      <div class="flex flex-wrap gap-x-4 gap-y-1">
        <span class="font-medium text-muted-foreground">Estados:</span>
        <div class="flex items-center gap-1" title="Estado inicial del workflow">
          <div class="w-3 h-3 rounded-full border-2 border-blue-500 bg-blue-100"></div>
          <span>Inicial</span>
        </div>
        <div class="flex items-center gap-1" title="Estado final, puede tener transiciones salientes">
          <div class="w-3 h-3 rounded-sm border-2 border-green-500 bg-green-100"></div>
          <span>Final</span>
        </div>
        <div class="flex items-center gap-1" title="Estado terminal, no permite salir">
          <div class="w-3 h-3 rounded-full border-2 border-red-500 bg-red-100"></div>
          <span>Terminal</span>
        </div>
        <div class="flex items-center gap-1" title="Estado intermedio normal">
          <div class="w-3 h-3 rounded-sm border-2 border-gray-400 bg-gray-100"></div>
          <span>Intermedio</span>
        </div>
      </div>
      
      <!-- Iconos de transiciones -->
      <div class="flex flex-wrap gap-x-4 gap-y-1 border-t border-border/50 pt-1">
        <span class="font-medium text-muted-foreground">Transiciones:</span>
        <div class="flex items-center gap-1" title="Requiere que el usuario escriba un comentario">
          <span>💬</span>
          <span>Requiere comentario</span>
        </div>
        <div class="flex items-center gap-1" title="Ejecuta acciones automáticas (notificaciones, calendario, etc.)">
          <span>⚡</span>
          <span>Acciones automáticas</span>
        </div>
        <div class="flex items-center gap-1" title="Validación custom antes de permitir la transición">
          <span>🛡️</span>
          <span>Con validador</span>
        </div>
      </div>
      
      <!-- Roles -->
      <div class="flex flex-wrap gap-x-4 gap-y-1 border-t border-border/50 pt-1">
        <span class="font-medium text-muted-foreground">Roles:</span>
        <span class="text-muted-foreground">Las etiquetas en las flechas indican qué roles pueden ejecutar cada transición</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mermaid-output {
  display: flex;
  justify-content: center;
}

.mermaid-output :deep(svg) {
  max-width: 100%;
  height: auto;
}
</style>
