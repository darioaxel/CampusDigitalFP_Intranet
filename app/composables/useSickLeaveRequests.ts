// composables/useSickLeaveRequests.ts
// Composable para gestionar solicitudes de comunicación de bajas

import { toast } from 'vue-sonner'

export interface SickLeaveRequest {
  id: string
  title: string
  description?: string
  startDate?: string
  endDate?: string
  context?: string
  currentState?: {
    code: string
    name: string
  }
  documents?: any[]
  requester?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  stateHistory?: {
    id: string
    toState?: {
      code: string
      name: string
    }
    actor?: {
      firstName: string
      lastName: string
    }
    comment?: string
    createdAt: string
  }[]
  createdAt: string
}

export interface CreateSickLeaveData {
  title: string
  description?: string
  dates: string[]
  subType: string
}

export function useSickLeaveRequests() {
  const pending = ref(false)
  const loadingTransitions = ref(false)
  const availableTransitions = ref<any[]>([])

  // Obtener mis solicitudes
  const fetchMyRequests = async (): Promise<SickLeaveRequest[]> => {
    try {
      const response = await $fetch('/api/requests/my-requests?type=SICK_LEAVE')
      return (response.data || []) as SickLeaveRequest[]
    } catch (error: any) {
      toast.error('Error al cargar solicitudes', {
        description: error.data?.message || 'Error desconocido'
      })
      return []
    }
  }

  // Obtener todas las solicitudes (admin)
  const fetchAllRequests = async (): Promise<SickLeaveRequest[]> => {
    try {
      const response = await $fetch('/api/requests?type=SICK_LEAVE&include=all')
      return (response.data || []) as SickLeaveRequest[]
    } catch (error: any) {
      toast.error('Error al cargar solicitudes', {
        description: error.data?.message || 'Error desconocido'
      })
      return []
    }
  }

  // Crear nueva solicitud
  const createRequest = async (data: CreateSickLeaveData): Promise<boolean> => {
    pending.value = true
    try {
      await $fetch('/api/requests', {
        method: 'POST',
        body: {
          title: data.title,
          description: data.description,
          workflowCode: 'request_sick_leave',
          type: 'SICK_LEAVE',
          context: {
            type: 'SICK_LEAVE',
            subType: data.subType,
            dates: data.dates
          },
          startDate: data.dates[0],
          endDate: data.dates[data.dates.length - 1]
        }
      })
      
      toast.success('Solicitud enviada', {
        description: 'Tu comunicación de baja ha sido registrada.'
      })
      return true
    } catch (error: any) {
      toast.error('Error', {
        description: error.data?.message || 'Error al enviar la solicitud'
      })
      return false
    } finally {
      pending.value = false
    }
  }

  // Cargar transiciones disponibles
  const fetchTransitions = async (requestId: string): Promise<any[]> => {
    loadingTransitions.value = true
    try {
      const response = await $fetch(`/api/requests/${requestId}/transitions`)
      availableTransitions.value = response.data || []
      return availableTransitions.value
    } catch (error) {
      availableTransitions.value = []
      return []
    } finally {
      loadingTransitions.value = false
    }
  }

  // Ejecutar transición
  const executeTransition = async (
    requestId: string, 
    toState: string, 
    comment?: string
  ): Promise<boolean> => {
    try {
      await $fetch(`/api/requests/${requestId}/transition`, {
        method: 'POST',
        body: {
          toState,
          comment
        }
      })
      
      toast.success('Estado actualizado correctamente')
      return true
    } catch (error: any) {
      toast.error(error.data?.message || 'Error al actualizar el estado')
      return false
    }
  }

  // Subir documento
  const uploadDocument = async (requestId: string, file: File, notes?: string): Promise<boolean> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (notes) formData.append('notes', notes)

      await $fetch(`/api/requests/${requestId}/documents`, {
        method: 'POST',
        body: formData
      })
      
      toast.success('Documento subido correctamente')
      return true
    } catch (error: any) {
      toast.error('Error al subir documento', {
        description: error.data?.message || 'Error desconocido'
      })
      return false
    }
  }

  // Descargar documento
  const downloadDocument = async (documentId: string, fileName: string): Promise<void> => {
    try {
      const response = await $fetch(`/api/documents/${documentId}/download`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(response as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      toast.error('Error al descargar el documento')
    }
  }

  // Helpers
  const parseContext = (contextStr?: string): any => {
    if (!contextStr) return {}
    try {
      return JSON.parse(contextStr)
    } catch {
      return {}
    }
  }

  const formatEstado = (code?: string): string => {
    const estados: Record<string, string> = {
      'pending_notification': 'Pendiente de Notificación',
      'notified': 'Notificado',
      'pending_docs': 'Esperando Documentación',
      'pending_validation': 'Esperando Validación',
      'validated': 'Validado',
      'rejected': 'Rechazado'
    }
    return estados[code || ''] || code || 'Desconocido'
  }

  const getEstadoColor = (code?: string): string => {
    const colores: Record<string, string> = {
      'pending_notification': 'text-amber-600 bg-amber-100',
      'notified': 'text-blue-600 bg-blue-100',
      'pending_docs': 'text-amber-600 bg-amber-100',
      'pending_validation': 'text-purple-600 bg-purple-100',
      'validated': 'text-green-600 bg-green-100',
      'rejected': 'text-red-600 bg-red-100'
    }
    return colores[code || ''] || 'text-gray-600 bg-gray-100'
  }

  const formatTipoBaja = (contextStr?: string): string => {
    const ctx = parseContext(contextStr)
    const tipos: Record<string, string> = {
      'BAJA_MEDICA': 'Baja Médica',
      'BAJA_MATERNIDAD': 'Baja por Maternidad/Paternidad',
      'BAJA_RIESGO_EMBARAZO': 'Baja por Riesgo en el Embarazo',
      'BAJA_ACCIDENTE_TRABAJO': 'Accidente de Trabajo',
      'PERMISO_FUERZA_MAYOR': 'Permiso por Fuerza Mayor',
      'OTRA': 'Otra'
    }
    return tipos[ctx.subType] || ctx.subType || 'No especificado'
  }

  const parseAPIDate = (dateStr?: string | null): Date | null => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? null : date
  }

  return {
    // Estado
    pending: readonly(pending),
    loadingTransitions: readonly(loadingTransitions),
    availableTransitions: readonly(availableTransitions),
    
    // Métodos
    fetchMyRequests,
    fetchAllRequests,
    createRequest,
    fetchTransitions,
    executeTransition,
    uploadDocument,
    downloadDocument,
    
    // Helpers
    parseContext,
    formatEstado,
    getEstadoColor,
    formatTipoBaja,
    parseAPIDate,
  }
}

// Tipos de baja disponibles
export const TIPOS_BAJA = [
  { value: 'BAJA_MEDICA', label: 'Baja Médica', description: 'Incapacidad temporal por enfermedad' },
  { value: 'BAJA_MATERNIDAD', label: 'Baja por Maternidad/Paternidad', description: 'Permiso por nacimiento/adopción' },
  { value: 'BAJA_RIESGO_EMBARAZO', label: 'Baja por Riesgo en el Embarazo', description: 'Incapacidad por riesgo durante el embarazo' },
  { value: 'BAJA_ACCIDENTE_TRABAJO', label: 'Accidente de Trabajo', description: 'Accidente laboral o enfermedad profesional' },
  { value: 'PERMISO_FUERZA_MAYOR', label: 'Permiso por Fuerza Mayor', description: 'Causas justificadas de fuerza mayor' },
  { value: 'OTRA', label: 'Otra', description: 'Otras causas (especificar)' }
] as const
