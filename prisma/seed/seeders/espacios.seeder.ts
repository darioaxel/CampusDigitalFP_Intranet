import { PrismaClient } from '@prisma/client'
import { EspacioData } from '../data/espacios'

export class EspaciosSeeder {
  constructor(private prisma: PrismaClient) {}

  async run(espacios: EspacioData[]) {
    console.log('🚪 Creando espacios...')

    const createdEspacios = []

    for (const espacioData of espacios) {
      // Verificar si ya existe un espacio con ese nombre
      const existente = await this.prisma.espacio.findUnique({
        where: { nombre: espacioData.nombre }
      })

      if (existente) {
        console.log(`   ⚠️  El espacio "${espacioData.nombre}" ya existe, omitiendo...`)
        continue
      }

      const espacio = await this.prisma.espacio.create({
        data: {
          nombre: espacioData.nombre,
          planta: espacioData.planta,
          observaciones: espacioData.observaciones,
        }
      })

      createdEspacios.push(espacio)
      console.log(`   ✓ Espacio creado: ${espacio.nombre} (Planta ${espacio.planta})`)
    }

    console.log(`✅ ${createdEspacios.length} espacios creados\n`)
    return createdEspacios
  }
}

// Función standalone para usar directamente
export async function seedEspacios(prisma: PrismaClient, espacios?: EspacioData[]) {
  const seeder = new EspaciosSeeder(prisma)
  const { espaciosData } = await import('../data/espacios.js')
  return seeder.run(espacios || espaciosData)
}
