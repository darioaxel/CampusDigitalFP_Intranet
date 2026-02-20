import { useDropZone } from '@vueuse/core'
import type { UploadedFile } from '~/types/payments' 

export function useFileUpload() {
  const file = ref<UploadedFile | null>(null)
  const loading = ref(false)
  const error = ref('')

  const dropZoneRef = ref<HTMLElement>()

  const { isOverDropZone } = useDropZone(dropZoneRef, {
    onDrop: (files) => {
      if (files?.length) {
        handleFile(files[0])
      }
    },
    dataTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  })

  async function handleFile(fileData: File) {
    error.value = ''
    loading.value = true

    // Validaciones
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(fileData.type)) {
      error.value = 'Tipo no permitido. Usa PDF, JPG, PNG o WebP.'
      loading.value = false
      return
    }

    if (fileData.size > 5 * 1024 * 1024) {
      error.value = 'Archivo demasiado grande (máx. 5MB)'
      loading.value = false
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', fileData)

      const response = await $fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })

      file.value = response
    } catch (e: any) {
      error.value = e.message || 'Error al subir'
    } finally {
      loading.value = false
    }
  }

  function clear() {
    file.value = null
    error.value = ''
  }

  return {
    file,
    loading,
    error,
    isOverDropZone,
    dropZoneRef,
    handleFile,
    clear,
  }
}