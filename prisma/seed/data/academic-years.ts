// Datos de cursos académicos
export interface AcademicYearData {
  name: string
  startDate: string
  endDate: string
  description?: string
  isActive: boolean
  isClosed: boolean
}

export const academicYearsData: AcademicYearData[] = [
  {
    name: '2024-2025',
    startDate: '2024-09-01',
    endDate: '2025-07-31',
    description: 'Curso académico 2024-2025 (Cerrado)',
    isActive: false,
    isClosed: true
  },
  {
    name: '2025-2026',
    startDate: '2025-09-01',
    endDate: '2026-07-31',
    description: 'Curso académico actual',
    isActive: true,
    isClosed: false
  },
  {
    name: '2026-2027',
    startDate: '2026-09-01',
    endDate: '2027-07-31',
    description: 'Curso académico futuro (Preparación)',
    isActive: false,
    isClosed: false
  }
]
