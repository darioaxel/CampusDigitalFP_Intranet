import { prisma } from '../config.js'
import { academicYearsData } from '../data/academic-years.js'

export async function seedAcademicYears() {
  console.log('🎓 Creando cursos académicos...')

  for (const yearData of academicYearsData) {
    // Verificar si ya existe
    const existing = await prisma.academicYear.findUnique({
      where: { name: yearData.name }
    })

    if (existing) {
      console.log(`  ⏭️  Curso ${yearData.name} ya existe`)
      continue
    }

    const year = await prisma.academicYear.create({
      data: {
        name: yearData.name,
        startDate: new Date(yearData.startDate),
        endDate: new Date(yearData.endDate),
        description: yearData.description,
        isActive: yearData.isActive,
        isClosed: yearData.isClosed
      }
    })

    console.log(`  ✅ Curso creado: ${year.name} (${year.isActive ? 'Activo' : year.isClosed ? 'Cerrado' : 'Inactivo'})`)
  }

  console.log('✅ Cursos académicos seedeados\n')
}
