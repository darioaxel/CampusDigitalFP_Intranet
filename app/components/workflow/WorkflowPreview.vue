<script setup lang="ts">
// app/components/workflow/WorkflowPreview.vue
// Vista previa del workflow con diagrama Mermaid, lista y transiciones

import { ref, computed } from 'vue'
import type { WorkflowDefinitionJson, WorkflowStateJson } from '@/types/workflow-editor'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import WorkflowMermaidDiagram from './WorkflowMermaidDiagram.vue'

interface Props {
  workflow: WorkflowDefinitionJson | null
}

const props = defineProps<Props>()
const activeTab = ref('diagram')

const sortedStates = computed(() => {
  if (!props.workflow) return []
  return [...props.workflow.states].sort((a, b) => (a.order || 0) - (b.order || 0))
})

const getStateBadgeColor = (color: string) => {
  const colorMap: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800', red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800', amber: 'bg-amber-100 text-amber-800',
    yellow: 'bg-yellow-100 text-yellow-800', lime: 'bg-lime-100 text-lime-800',
    green: 'bg-green-100 text-green-800', emerald: 'bg-emerald-100 text-emerald-800',
    teal: 'bg-teal-100 text-teal-800', cyan: 'bg-cyan-100 text-cyan-800',
    sky: 'bg-sky-100 text-sky-800', blue: 'bg-blue-100 text-blue-800',
    indigo: 'bg-indigo-100 text-indigo-800', violet: 'bg-violet-100 text-violet-800',
    purple: 'bg-purple-100 text-purple-800', fuchsia: 'bg-fuchsia-100 text-fuchsia-800',
    pink: 'bg-pink-100 text-pink-800', rose: 'bg-rose-100 text-rose-800'
  }
  return colorMap[color] || colorMap.gray
}

const getTransitionsFromState = (stateCode: string) => {
  if (!props.workflow) return []
  return props.workflow.transitions.filter(t => t.from === stateCode)
}
</script>

<template>
  <div v-if="workflow" class="h-full flex flex-col">
    <!-- Header único -->
    <div class="p-3 border-b bg-muted/30 shrink-0">
      <h3 class="font-semibold text-sm flex items-center gap-2">
        <Icon name="lucide:eye" class="w-4 h-4" />
        {{ workflow.name }}
      </h3>
      <p class="text-xs text-muted-foreground mt-0.5">
        {{ workflow.states.length }} estados · {{ workflow.transitions.length }} transiciones
      </p>
    </div>

    <Tabs v-model="activeTab" class="flex-1 flex flex-col min-h-0">
      <TabsList class="mx-3 mt-2 shrink-0">
        <TabsTrigger value="diagram" class="text-xs">
          <Icon name="lucide:git-branch" class="w-3.5 h-3.5 mr-1" />
          Diagrama
        </TabsTrigger>
        <TabsTrigger value="list" class="text-xs">
          <Icon name="lucide:list" class="w-3.5 h-3.5 mr-1" />
          Estados
        </TabsTrigger>
        <TabsTrigger value="transitions" class="text-xs">
          <Icon name="lucide:arrow-right-left" class="w-3.5 h-3.5 mr-1" />
          Transiciones
        </TabsTrigger>
      </TabsList>

      <TabsContent value="diagram" class="flex-1 mt-0 min-h-0">
        <WorkflowMermaidDiagram :workflow="workflow" />
      </TabsContent>

      <TabsContent value="list" class="flex-1 mt-0 min-h-0 overflow-hidden">
        <ScrollArea class="h-full p-3">
          <div class="space-y-2">
            <div
              v-for="(state, index) in sortedStates"
              :key="state.code"
              class="p-2.5 rounded-md border bg-card"
              :class="{ 'border-primary/50 bg-primary/5': state.isInitial }"
            >
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                  {{ state.order || index + 1 }}
                </span>
                <Badge :class="getStateBadgeColor(state.color || 'gray')" class="text-[10px]">
                  {{ state.code }}
                </Badge>
                <span class="font-medium text-sm truncate">{{ state.name }}</span>
                <Badge v-if="state.isInitial" variant="default" class="text-[10px] ml-auto">INICIAL</Badge>
                <Badge v-if="state.isFinal" variant="secondary" class="text-[10px] ml-auto">FINAL</Badge>
                <Badge v-if="state.isTerminal" variant="destructive" class="text-[10px] ml-auto">TERMINAL</Badge>
              </div>
              
              <div v-if="getTransitionsFromState(state.code).length > 0" class="mt-2 pl-8 text-xs space-y-1">
                <div
                  v-for="trans in getTransitionsFromState(state.code)"
                  :key="trans.from + trans.to"
                  class="flex items-center gap-2 text-muted-foreground"
                >
                  <Icon name="lucide:arrow-right" class="w-3 h-3" />
                  <span>{{ trans.to }}</span>
                  <span class="text-[10px]">({{ trans.allowedRoles.join(', ') }})</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="transitions" class="flex-1 mt-0 min-h-0 overflow-hidden">
        <ScrollArea class="h-full p-3">
          <table class="w-full text-xs">
            <thead class="border-b">
              <tr>
                <th class="text-left py-2">Desde</th>
                <th class="text-left py-2">Hasta</th>
                <th class="text-left py-2">Roles</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(trans, idx) in workflow.transitions"
                :key="idx"
                class="border-b border-muted/50"
              >
                <td class="py-2">
                  <Badge variant="outline" class="text-[10px]">{{ trans.from }}</Badge>
                </td>
                <td class="py-2">
                  <Badge variant="outline" class="text-[10px]">{{ trans.to }}</Badge>
                </td>
                <td class="py-2 text-muted-foreground">
                  {{ trans.allowedRoles.join(', ') }}
                </td>
              </tr>
            </tbody>
          </table>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  </div>

  <div v-else class="h-full flex items-center justify-center text-muted-foreground">
    <div class="text-center">
      <Icon name="lucide:file-json" class="w-12 h-12 mx-auto mb-2 opacity-50" />
      <p class="text-sm">Carga un workflow para ver la vista previa</p>
    </div>
  </div>
</template>
