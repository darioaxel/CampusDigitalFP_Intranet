<template>
  <div class="border rounded-lg overflow-hidden bg-background">
    <Editor
      ref="editorRef"
      :default-value="defaultValue"
      :on-update="handleUpdate"
      :on-debounced-update="handleDebouncedUpdate"
      :storage-key="storageKey"
      :class="editorClass"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Editor } from '@codeverze/novel-vue'
import '@codeverze/novel-vue/dist/style.css'
import { toast } from 'vue-sonner'
import type { JSONContent } from '@tiptap/core'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  storageKey?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorRef = ref()

// Generar storage key única para cada post
const storageKey = computed(() => props.storageKey || 'novel__content')

// Clases del editor
const editorClass = 'min-h-[400px]'

// Convertir HTML/markdown a JSONContent para Novel
const defaultValue = computed<JSONContent>(() => {
  if (!props.modelValue) {
    return {
      type: 'doc',
      content: [{ type: 'paragraph' }]
    }
  }
  
  // Si es HTML, Novel lo maneja internamente
  // Si es markdown con imágenes ![alt](url), necesitamos convertirlo
  return htmlToJSON(props.modelValue)
})

// Convertir HTML a TipTap JSON
function htmlToJSON(html: string): JSONContent {
  // Si ya es JSON, parsearlo
  try {
    const parsed = JSON.parse(html)
    if (parsed.type === 'doc') return parsed
  } catch {
    // No es JSON, continuar con conversión
  }
  
  // Novel maneja HTML automáticamente si usamos el editor correctamente
  // Pero para inicializar, devolvemos un doc vacío y dejamos que el editor cargue
  return {
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: html ? [{ type: 'text', text: html }] : []
    }]
  }
}

// Manejar actualización del editor
const handleUpdate = (editor: any) => {
  const html = editor.getHTML()
  emit('update:modelValue', html)
}

// Manejar actualización debounced (para guardado automático)
const handleDebouncedUpdate = (editor: any) => {
  const html = editor.getHTML()
  emit('update:modelValue', html)
}

// Exponer métodos para insertar imágenes
defineExpose({
  // Insertar imagen desde URL
  insertImage: (url: string, alt: string = 'Imagen') => {
    const editor = editorRef.value?.getEditor()
    if (editor) {
      editor.chain().focus().setImage({ src: url, alt }).run()
      toast.success('Imagen insertada')
    } else {
      // Fallback: añadir al contenido como HTML
      const imgHtml = `<img src="${url}" alt="${alt}" class="rounded-lg max-w-full my-4" />`
      emit('update:modelValue', props.modelValue + imgHtml)
    }
  },
  
  // Insertar imagen subida
  insertUploadedImage: async (file: File, postId?: string) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo no permitido. Usa JPG, PNG, WebP o GIF.')
      return
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('Archivo demasiado grande (máx 10MB).')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'post-content')
    if (postId) formData.append('postId', postId)

    try {
      toast.info('Subiendo imagen...')
      const response = await $fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      })
      
      // Insertar imagen en el editor
      const editor = editorRef.value?.getEditor()
      if (editor) {
        editor.chain().focus().setImage({ 
          src: response.url, 
          alt: file.name 
        }).run()
      } else {
        // Fallback
        const imgHtml = `<img src="${response.url}" alt="${file.name}" class="rounded-lg max-w-full my-4" />`
        emit('update:modelValue', props.modelValue + imgHtml)
      }
      
      toast.success('Imagen insertada')
      return response
    } catch (error: any) {
      toast.error('Error', { description: error.message })
      throw error
    }
  },
  
  // Obtener el editor interno
  getEditor: () => editorRef.value?.getEditor?.()
})
</script>

<style>
/* Novel Editor Custom Styles */
.novel-editor {
  --novel-white: hsl(var(--background));
  --novel-black: hsl(var(--foreground));
  --novel-stone-50: hsl(var(--muted));
  --novel-stone-100: hsl(var(--muted));
  --novel-stone-200: hsl(var(--border));
  --novel-stone-300: hsl(var(--border));
  --novel-stone-400: hsl(var(--muted-foreground));
  --novel-stone-500: hsl(var(--muted-foreground));
  --novel-stone-600: hsl(var(--foreground));
  --novel-stone-700: hsl(var(--foreground));
  --novel-stone-800: hsl(var(--foreground));
  --novel-stone-900: hsl(var(--foreground));
  
  --novel-highlight-default: hsl(var(--muted));
  --novel-highlight-purple: rgba(168, 85, 247, 0.2);
  --novel-highlight-red: rgba(239, 68, 68, 0.2);
  --novel-highlight-yellow: rgba(234, 179, 8, 0.2);
  --novel-highlight-blue: rgba(59, 130, 246, 0.2);
  --novel-highlight-green: rgba(34, 197, 94, 0.2);
  --novel-highlight-orange: rgba(249, 115, 22, 0.2);
  --novel-highlight-pink: rgba(236, 72, 153, 0.2);
  --novel-highlight-gray: hsl(var(--muted));
}

.novel-editor .ProseMirror {
  padding: 1rem;
  min-height: 400px;
  outline: none;
}

/* Placeholder traducido */
.novel-editor .ProseMirror p.is-editor-empty:first-child::before {
  color: hsl(var(--muted-foreground));
  content: "Empieza a escribir o usa el menú '/' para comandos...";
  float: left;
  height: 0;
  pointer-events: none;
  font-style: italic;
}

/* Estilos para imágenes */
.novel-editor .ProseMirror img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
  display: block;
}

.novel-editor .ProseMirror img.ProseMirror-selectednode {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

/* Estilos para el menú de burbuja */
.novel-editor [data-bubble-menu="true"] {
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  padding: 0.25rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

/* Estilos para el menú slash */
.novel-editor [data-slash-menu="true"] {
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
</style>
