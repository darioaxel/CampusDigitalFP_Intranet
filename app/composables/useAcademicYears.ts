// app/composables/useAcademicYears.ts
// Composable para gestión de cursos académicos

import { toast } from 'vue-sonner'

export interface AcademicYear {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
  isClosed: boolean
  description: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    schedules: number
  }
}

export interface CreateAcademicYearData {
  name: string
  startDate: string
  endDate: string
  description?: string
  setAsActive?: boolean
}

export function useAcademicYears() {
  const academicYears = ref<AcademicYear[]>([])
  const currentYear = ref<AcademicYear | null>(null)
  const loading = ref(false)

  // Cargar todos los cursos
  const fetchAcademicYears = async () => {
    loading.value = true
    try {
      const { data } = await useFetch('/api/admin/academic-years')
      academicYears.value = data.value?.data || []
      return academicYears.value
    } catch (err: any) {
      toast.error('Error al cargar cursos académicos')
      return []
    } finally {
      loading.value = false
    }
  }

  // Cargar curso activo
  const fetchCurrentYear = async () => {
    try {
      const { data } = await useFetch('/api/admin/academic-years/current')
      currentYear.value = data.value?.data || null
      return currentYear.value
    } catch (err: any) {
      return null
    }
  }

  // Crear curso
  const createAcademicYear = async (data: CreateAcademicYearData) => {
    try {
      const { data: result, error } = await useFetch('/api/admin/academic-years', {
        method: 'POST',
        body: data
      })

      if (error.value) throw error.value

      toast.success('Curso académico creado correctamente')
      await fetchAcademicYears()
      if (data.setAsActive) await fetchCurrentYear()
      return result.value?.data
    } catch (err: any) {
      const message = err.message || 'Error al crear el curso'
      toast.error(message)
      throw err
    }
  }

  // Actualizar curso
  const updateAcademicYear = async (id: string, data: Partial<CreateAcademicYearData>) => {
    try {
      const { error } = await useFetch(`/api/admin/academic-years/${id}`, {
        method: 'PUT',
        body: data
      })

      if (error.value) throw error.value

      toast.success('Curso actualizado')
      await fetchAcademicYears()
      if (data.isActive) await fetchCurrentYear()
      return true
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar')
      throw err
    }
  }

  // Eliminar curso
  const deleteAcademicYear = async (id: string) => {
    try {
      const { error } = await useFetch(`/api/admin/academic-years/${id}`, {
        method: 'DELETE'
      })

      if (error.value) throw error.value

      toast.success('Curso eliminado')
      await fetchAcademicYears()
      return true
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar')
      throw err
    }
  }

  // Rollover: copiar horarios de un curso a otro
  const rolloverSchedules = async (sourceYearId: string, targetYearId: string, options?: { scheduleIds?: string[], copyAll?: boolean }) => {
    try {
      const { data, error } = await useFetch(`/api/admin/academic-years/${sourceYearId}/rollover`, {
        method: 'POST',
        body: {
          targetYearId,
          scheduleIds: options?.scheduleIds,
          copyAll: options?.copyAll
        }
      })

      if (error.value) throw error.value

      toast.success(`${data.value?.data?.copied || 0} horarios copiados al nuevo curso`)
      return data.value?.data
    } catch (err: any) {
      toast.error(err.message || 'Error al copiar horarios')
      throw err
    }
  }

  // Helpers
  const getStatusLabel = (year: AcademicYear) => {
    if (year.isClosed) return 'Cerrado'
    if (year.isActive) return 'Activo'
    return 'Inactivo'
  }

  const getStatusColor = (year: AcademicYear) => {
    if (year.isClosed) return 'bg-gray-100 text-gray-800'
    if (year.isActive) return 'bg-green-100 text-green-800'
    return 'bg-amber-100 text-amber-800'
  }

  return {
    // Estado
    academicYears,
    currentYear,
    loading,
    
    // Acciones
    fetchAcademicYears,
    fetchCurrentYear,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    rolloverSchedules,
    
    // Helpers
    getStatusLabel,
    getStatusColor
  }
}
