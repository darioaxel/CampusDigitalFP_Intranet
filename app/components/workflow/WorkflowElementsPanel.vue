<script setup lang="ts">
// app/components/workflow/WorkflowElementsPanel.vue
// Panel lateral con elementos disponibles para el workflow

import {
  WORKFLOW_ROLES,
  WORKFLOW_AUTO_ACTIONS,
  WORKFLOW_VALIDATORS,
  WORKFLOW_STATE_COLORS,
  WORKFLOW_SNIPPETS
} from '@/types/workflow-editor'

const emit = defineEmits<{
  'insert': [code: string]
}>()

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
}

const insertSnippet = (code: string) => {
  emit('insert', code)
}

const colorPreview = (color: string) => {
  const colorMap: Record<string, string> = {
    gray: '#6b7280',
    red: '#ef4444',
    orange: '#f97316',
    amber: '#f59e0b',
    yellow: '#eab308',
    lime: '#84cc16',
    green: '#22c55e',
    emerald: '#10b981',
    teal: '#14b8a6',
    cyan: '#06b6d4',
    sky: '#0ea5e9',
    blue: '#3b82f6',
    indigo: '#6366f1',
    violet: '#8b5cf6',
    purple: '#a855f7',
    fuchsia: '#d946ef',
    pink: '#ec4899',
    rose: '#f43f5e'
  }
  return colorMap[color] || color
}
</script>

<template>
  <div class="workflow-elements-panel h-full flex flex-col">
    <div class="p-3 border-b bg-muted/30">
      <h3 class="font-semibold text-sm flex items-center gap-2">
        <Icon name="lucide:toolbox" class="w-4 h-4" />
        Elementos disponibles
      </h3>
    </div>

    <ScrollArea class="flex-1">
      <Accordion type="multiple" :default-value="['snippets', 'roles']">
        <!-- Snippets -->
        <AccordionItem value="snippets">
          <AccordionTrigger class="px-3 py-2 text-sm hover:no-underline">
            <span class="flex items-center gap-2">
              <Icon name="lucide:code-2" class="w-4 h-4 text-blue-500" />
              Snippets
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div class="space-y-2 px-3 pb-2">
              <div
                v-for="snippet in WORKFLOW_SNIPPETS"
                :key="snippet.name"
                class="group"
              >
                <div
                  class="p-2 rounded-md border bg-muted/30 hover:bg-muted cursor-pointer transition-colors"
                  @click="insertSnippet(snippet.code)"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-medium">{{ snippet.name }}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      @click.stop="copyToClipboard(snippet.code)"
                    >
                      <Icon name="lucide:copy" class="w-3 h-3" />
                    </Button>
                  </div>
                  <p class="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {{ snippet.description }}
                  </p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <!-- Roles -->
        <AccordionItem value="roles">
          <AccordionTrigger class="px-3 py-2 text-sm hover:no-underline">
            <span class="flex items-center gap-2">
              <Icon name="lucide:users" class="w-4 h-4 text-green-500" />
              Roles
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div class="space-y-1 px-3 pb-2">
              <div
                v-for="role in WORKFLOW_ROLES"
                :key="role"
                class="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer group"
                @click="copyToClipboard('&quot;' + role + '&quot;')"
              >
                <code class="text-xs bg-muted px-2 py-1 rounded">{{ role }}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Icon name="lucide:copy" class="w-3 h-3" />
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <!-- Acciones automáticas -->
        <AccordionItem value="actions">
          <AccordionTrigger class="px-3 py-2 text-sm hover:no-underline">
            <span class="flex items-center gap-2">
              <Icon name="lucide:zap" class="w-4 h-4 text-yellow-500" />
              Acciones automáticas
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div class="space-y-2 px-3 pb-2">
              <div
                v-for="action in WORKFLOW_AUTO_ACTIONS"
                :key="action.code"
                class="p-2 rounded-md border bg-muted/30 hover:bg-muted cursor-pointer group transition-colors"
                @click="copyToClipboard('&quot;' + action.code + '&quot;')"
              >
                <div class="flex items-center justify-between">
                  <code class="text-xs">{{ action.code }}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    @click.stop="copyToClipboard('&quot;' + action.code + '&quot;')"
                  >
                    <Icon name="lucide:copy" class="w-3 h-3" />
                  </Button>
                </div>
                <p class="text-xs text-muted-foreground mt-1">{{ action.description }}</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <!-- Validadores -->
        <AccordionItem value="validators">
          <AccordionTrigger class="px-3 py-2 text-sm hover:no-underline">
            <span class="flex items-center gap-2">
              <Icon name="lucide:shield-check" class="w-4 h-4 text-purple-500" />
              Validadores
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div class="space-y-2 px-3 pb-2">
              <div
                v-for="validator in WORKFLOW_VALIDATORS"
                :key="validator.code"
                class="p-2 rounded-md border bg-muted/30 hover:bg-muted cursor-pointer group transition-colors"
                @click="copyToClipboard('&quot;' + validator.code + '&quot;')"
              >
                <div class="flex items-center justify-between">
                  <code class="text-xs">{{ validator.code }}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    @click.stop="copyToClipboard('&quot;' + validator.code + '&quot;')"
                  >
                    <Icon name="lucide:copy" class="w-3 h-3" />
                  </Button>
                </div>
                <p class="text-xs text-muted-foreground mt-1">{{ validator.description }}</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <!-- Colores -->
        <AccordionItem value="colors">
          <AccordionTrigger class="px-3 py-2 text-sm hover:no-underline">
            <span class="flex items-center gap-2">
              <Icon name="lucide:palette" class="w-4 h-4 text-pink-500" />
              Colores
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div class="grid grid-cols-3 gap-1 px-3 pb-2">
              <div
                v-for="color in WORKFLOW_STATE_COLORS"
                :key="color"
                class="flex flex-col items-center p-2 rounded-md hover:bg-muted cursor-pointer"
                @click="copyToClipboard('&quot;' + color + '&quot;')"
              >
                <div
                  class="w-6 h-6 rounded-full border"
                  :style="{ backgroundColor: colorPreview(color) }"
                />
                <span class="text-[10px] text-muted-foreground mt-1 uppercase">{{ color }}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </ScrollArea>
  </div>
</template>
