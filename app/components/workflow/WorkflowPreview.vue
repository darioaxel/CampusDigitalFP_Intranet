<script setup lang="ts">
// app/components/workflow/WorkflowPreview.vue
// Vista previa visual del workflow (estados y transiciones)

import type { WorkflowDefinitionJson } from '@/types/workflow-editor'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Props {
  workflow: WorkflowDefinitionJson | null
}

const props = defineProps<Props>()

const getStateBadgeColor = (color: string) => {
  // Mapa de colores Tailwind para los badges
  const colorMap: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    lime: 'bg-lime-100 text-lime-800 border-lime-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    teal: 'bg-teal-100 text-teal-800 border-teal-200',
    cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    sky: 'bg-sky-100 text-sky-800 border-sky-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    violet: 'bg-violet-100 text-violet-800 border-violet-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    pink: 'bg-pink-100 text-pink-800 border-pink-200',
    rose: 'bg-rose-100 text-rose-800 border-rose-200'
  }
  return colorMap[color] || colorMap.gray
}

const getTransitionsFromState = (stateCode: string) => {
  if (!props.workflow) return []
  return props.workflow.transitions.filter(t => t.from === stateCode)
}

const getTransitionsToState = (stateCode: string) => {
  if (!props.workflow) return []
  return props.workflow.transitions.filter(t => t.to === stateCode)
}
</script>

<template>
  <div v-if="workflow" class="workflow-preview h-full flex flex-col">
    <div class="p-3 border-b bg-muted/30">
      <h3 class="font-semibold text-sm flex items-center gap-2">
        <Icon name="lucide:eye" class="w-4 h-4" />
        Vista previa: {{ workflow.name }}
      </h3>
      <p class="text-xs text-muted-foreground mt-1">
        {{ workflow.states.length }} estados · {{ workflow.transitions.length }} transiciones
      </p>
    </div>

    <ScrollArea class="flex-1">
      <div class="p-3 space-y-4">
        <!-- Estados -->
        <div>
          <h4 class="text-xs font-medium text-muted-foreground uppercase mb-2">Estados</h4>
          <div class="space-y-2">
            <div
              v-for="state in workflow.states"
              :key="state.code"
              class="p-3 rounded-lg border bg-card"
            >
              <div class="flex items-start gap-2">
                <Badge
                  variant="outline"
                  :class="getStateBadgeColor(state.color || 'gray')"
                  class="text-xs"
                >
                  {{ state.code }}
                </Badge>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-medium text-sm">{{ state.name }}</span>
                    <Badge v-if="state.isInitial" variant="default" class="text-[10px] px-1.5 py-0">
                      INICIAL
                    </Badge>
                    <Badge v-if="state.isFinal" variant="secondary" class="text-[10px] px-1.5 py-0">
                      FINAL
                    </Badge>
                    <Badge v-if="state.isTerminal" variant="destructive" class="text-[10px] px-1.5 py-0">
                      TERMINAL
                    </Badge>
                  </div>
                  <p v-if="state.config" class="text-xs text-muted-foreground mt-1">
                    Config: {{ JSON.stringify(state.config) }}
                  </p>
                </div>
              </div>

              <!-- Transiciones desde este estado -->
              <div
                v-if="getTransitionsFromState(state.code).length > 0"
                class="mt-3 pl-4 border-l-2 border-muted"
              >
                <p class="text-[10px] text-muted-foreground uppercase mb-1">Transiciones salientes</p>
                <div class="space-y-1">
                  <div
                    v-for="trans in getTransitionsFromState(state.code)"
                    :key="trans.from + trans.to"
                    class="flex items-center gap-2 text-xs"
                  >
                    <Icon name="lucide:arrow-right" class="w-3 h-3 text-muted-foreground" />
                    <Badge variant="outline" class="text-[10px]">
                      {{ trans.to }}
                    </Badge>
                    <span class="text-muted-foreground">
                      ({{ trans.allowedRoles.join(', ') }})
                    </span>
                    <Icon
                      v-if="trans.requiresComment"
                      name="lucide:message-square"
                      class="w-3 h-3 text-amber-500"
                      title="Requiere comentario"
                    />
                    <Icon
                      v-if="trans.autoActions?.length"
                      name="lucide:zap"
                      class="w-3 h-3 text-yellow-500"
                      :title="`Acciones: ${trans.autoActions.join(', ')}`"
                    />
                    <Icon
                      v-if="trans.validatorCode"
                      name="lucide:shield-check"
                      class="w-3 h-3 text-purple-500"
                      :title="`Validador: ${trans.validatorCode}`"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen de transiciones -->
        <div>
          <h4 class="text-xs font-medium text-muted-foreground uppercase mb-2">Todas las transiciones</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2 px-2">Desde</th>
                  <th class="text-left py-2 px-2">→</th>
                  <th class="text-left py-2 px-2">Hasta</th>
                  <th class="text-left py-2 px-2">Roles</th>
                  <th class="text-left py-2 px-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(trans, idx) in workflow.transitions"
                  :key="idx"
                  class="border-b border-muted/50"
                >
                  <td class="py-2 px-2">
                    <Badge variant="outline" class="text-[10px]">{{ trans.from }}</Badge>
                  </td>
                  <td class="py-2 px-2">
                    <Icon name="lucide:arrow-right" class="w-3 h-3 text-muted-foreground" />
                  </td>
                  <td class="py-2 px-2">
                    <Badge variant="outline" class="text-[10px]">{{ trans.to }}</Badge>
                  </td>
                  <td class="py-2 px-2">
                    <span class="text-muted-foreground">{{ trans.allowedRoles.join(', ') }}</span>
                  </td>
                  <td class="py-2 px-2">
                    <div class="flex items-center gap-1">
                      <Icon
                        v-if="trans.requiresComment"
                        name="lucide:message-square"
                        class="w-3 h-3 text-amber-500"
                        title="Requiere comentario"
                      />
                      <Icon
                        v-if="trans.autoActions?.length"
                        name="lucide:zap"
                        class="w-3 h-3 text-yellow-500"
                        :title="trans.autoActions.join(', ')"
                      />
                      <Icon
                        v-if="trans.validatorCode"
                        name="lucide:shield-check"
                        class="w-3 h-3 text-purple-500"
                        :title="trans.validatorCode"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ScrollArea>
  </div>

  <div v-else class="h-full flex items-center justify-center text-muted-foreground">
    <div class="text-center">
      <Icon name="lucide:file-json" class="w-12 h-12 mx-auto mb-2 opacity-50" />
      <p class="text-sm">Carga un workflow para ver la vista previa</p>
    </div>
  </div>
</template>
