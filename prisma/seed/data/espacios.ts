// Datos de espacios físicos del centro

export interface EspacioData {
  nombre: string
  planta: number
  observaciones?: string
}

export const espaciosData: EspacioData[] = [
  {
    nombre: 'Cabina 1',
    planta: 0,
  },
  {
    nombre: 'Cabina 2',
    planta: 0,
  },
  {
    nombre: 'Cabina 3',
    planta: 0,
  },
  {
    nombre: 'Cabina reuniones 1',
    planta: 0,
    observaciones: 'Sala de profesores',
  },
  {
    nombre: 'Cabina reuniones 2',
    planta: 0,
    observaciones: 'Sala de profesorado',
  },
  {
    nombre: 'Cabina 1 (Planta 1)',
    planta: 1,
  },
]
