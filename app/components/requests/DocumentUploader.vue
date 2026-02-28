<script setup lang="ts">
import { ref } from 'vue'
import { Upload, X, FileText, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  requestId: string
}>()

const emit = defineEmits<{
  uploaded: []
}>()

const files = ref<File[]>([])
const uploading = ref(false)
const dragOver = ref(false)

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    addFiles(Array.from(input.files))
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  dragOver.value = false
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files))
  }
}

const addFiles = (newFiles: File[]) => {
  const pdfFiles = newFiles.filter(f => f.type === 'application/pdf')
  if (pdfFiles.length !== newFiles.length) {
    toast.warning('Solo se permiten archivos PDF')
  }
  files.value = [...files.value, ...pdfFiles]
}

const removeFile = (index: number) => {
  files.value.splice(index, 1)
}

const uploadFiles = async () => {
  if (files.value.length === 0) return
  
  uploading.value = true
  try {
    for (const file of files.value) {
      const formData = new FormData()
      formData.append('file', file)
      
      await $fetch(`/api/requests/${props.requestId}/documents`, {
        method: 'POST',
        body: formData
      })
    }
    
    toast.success('Documentos subidos correctamente')
    files.value = []
    emit('uploaded')
  } catch (error: any) {
    toast.error('Error al subir documentos', {
      description: error.data?.message || 'Error desconocido'
    })
  } finally {
    uploading.value = false
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
</script>

<template>
  <div class="space-y-4">
    <!-- Zona de drop -->
    <div
      class="border-2 border-dashed rounded-lg p-6 text-center transition-colors"
      :class="dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop="handleDrop"
    >
      <Upload class="h-8 w-8 mx-auto text-muted-foreground mb-2" />
      <p class="text-sm text-muted-foreground mb-2">
        Arrastra archivos PDF aquí o
        <label class="text-primary cursor-pointer hover:underline">
          selecciona archivos
          <input
            type="file"
            accept=".pdf"
            multiple
            class="hidden"
            @change="handleFileSelect"
          />
        </label>
      </p>
      <p class="text-xs text-muted-foreground">Solo archivos PDF (máx. 10MB cada uno)</p>
    </div>

    <!-- Lista de archivos seleccionados -->
    <div v-if="files.length > 0" class="space-y-2">
      <div 
        v-for="(file, index) in files" 
        :key="index"
        class="flex items-center justify-between p-2 bg-muted rounded-lg"
      >
        <div class="flex items-center gap-2">
          <FileText class="w-4 h-4 text-primary" />
          <div>
            <p class="text-sm font-medium truncate max-w-[200px]">{{ file.name }}</p>
            <p class="text-xs text-muted-foreground">{{ formatFileSize(file.size) }}</p>
          </div>
        </div>
        <Button 
          v-if="!uploading"
          size="sm" 
          variant="ghost" 
          @click="removeFile(index)"
        >
          <X class="w-4 h-4 text-destructive" />
        </Button>
      </div>

      <Button 
        class="w-full" 
        @click="uploadFiles" 
        :disabled="uploading"
      >
        <Loader2 v-if="uploading" class="w-4 h-4 mr-2 animate-spin" />
        <Upload v-else class="w-4 h-4 mr-2" />
        {{ uploading ? 'Subiendo...' : 'Subir Documentos' }}
      </Button>
    </div>
  </div>
</template>
