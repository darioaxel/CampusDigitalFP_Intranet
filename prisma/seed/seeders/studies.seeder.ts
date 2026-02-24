import { prisma } from '../config.js'
import {
  ciclosFormativos,
  modulosDAM,
  rasProgramacion,
  cesRA1Programacion,
  cesRA2Programacion,
  temasProgramacion,
  contenidosTema1Prog,
  rasBasesDatos,
  temasBasesDatos
} from '../data/studies.js'

export async function seedStudies() {
  console.log('🌱 Seedings estudios FP...')

  try {
    // 1. Crear Ciclo Formativo
    const ciclo = await prisma.cicloFormativo.upsert({
      where: { codigo: ciclosFormativos[0].codigo },
      update: {},
      create: ciclosFormativos[0]
    })
    console.log(`✅ Ciclo creado: ${ciclo.nombre}`)

    // 2. Crear Módulos Profesionales
    for (const moduloData of modulosDAM) {
      const modulo = await prisma.moduloProfesional.upsert({
        where: {
          cicloId_codigo: {
            cicloId: ciclo.id,
            codigo: moduloData.codigo
          }
        },
        update: {},
        create: {
          ...moduloData,
          cicloId: ciclo.id
        }
      })
      console.log(`  ✅ Módulo: ${modulo.nombre}`)

      // 3. Si es el módulo de Programación (0487), crear RAs, CEs y Temas
      if (moduloData.codigo === '0487') {
        await seedProgramacionData(modulo.id)
      }

      // 4. Si es el módulo de Bases de Datos (0486), crear RAs y Temas
      if (moduloData.codigo === '0486') {
        await seedBasesDatosData(modulo.id)
      }
    }

    console.log('✅ Estudios seedeados correctamente')
  } catch (error) {
    console.error('❌ Error seedeando estudios:', error)
    throw error
  }
}

async function seedProgramacionData(moduloId: string) {
  // Crear Resultados de Aprendizaje
  const rasMap = new Map<string, string>() // Mapa numero -> id

  for (const raData of rasProgramacion) {
    const ra = await prisma.resultadoAprendizaje.upsert({
      where: {
        moduloId_numero: {
          moduloId: moduloId,
          numero: raData.numero
        }
      },
      update: {},
      create: {
        ...raData,
        moduloId: moduloId
      }
    })
    rasMap.set(ra.numero, ra.id)
    console.log(`    ✅ RA${ra.numero}: ${ra.descripcion.substring(0, 50)}...`)

    // Crear Criterios de Evaluación para RA1 y RA2
    if (ra.numero === '1') {
      for (const ceData of cesRA1Programacion) {
        await prisma.criterioEvaluacion.upsert({
          where: {
            raId_numero: {
              raId: ra.id,
              numero: ceData.numero
            }
          },
          update: {},
          create: {
            ...ceData,
            raId: ra.id
          }
        })
      }
      console.log(`      ✅ ${cesRA1Programacion.length} criterios de evaluación creados`)
    }

    if (ra.numero === '2') {
      for (const ceData of cesRA2Programacion) {
        await prisma.criterioEvaluacion.upsert({
          where: {
            raId_numero: {
              raId: ra.id,
              numero: ceData.numero
            }
          },
          update: {},
          create: {
            ...ceData,
            raId: ra.id
          }
        })
      }
      console.log(`      ✅ ${cesRA2Programacion.length} criterios de evaluación creados`)
    }
  }

  // Crear Temas y relacionarlos con RAs
  for (const temaData of temasProgramacion) {
    const { rasAsociados, ...temaInfo } = temaData

    const tema = await prisma.tema.upsert({
      where: {
        moduloId_numero: {
          moduloId: moduloId,
          numero: temaInfo.numero
        }
      },
      update: {},
      create: {
        ...temaInfo,
        moduloId: moduloId
      }
    })
    console.log(`    ✅ Tema ${tema.numero}: ${tema.titulo}`)

    // Relacionar tema con sus RAs
    for (const raNumero of rasAsociados) {
      const raId = rasMap.get(raNumero)
      if (raId) {
        await prisma.tema.update({
          where: { id: tema.id },
          data: {
            resultadosAprendizaje: {
              connect: { id: raId }
            }
          }
        })
      }
    }

    // Crear contenidos para el Tema 1
    if (tema.numero === 1) {
      for (const contenidoData of contenidosTema1Prog) {
        // Verificar si ya existe
        const existing = await prisma.contenidoTema.findFirst({
          where: {
            temaId: tema.id,
            numero: contenidoData.numero
          }
        })
        
        if (!existing) {
          await prisma.contenidoTema.create({
            data: {
              ...contenidoData,
              temaId: tema.id
            }
          })
        }
      }
      console.log(`      ✅ ${contenidosTema1Prog.length} contenidos creados`)
    }
  }
}

async function seedBasesDatosData(moduloId: string) {
  // Crear Resultados de Aprendizaje
  const rasMap = new Map<string, string>()

  for (const raData of rasBasesDatos) {
    const ra = await prisma.resultadoAprendizaje.upsert({
      where: {
        moduloId_numero: {
          moduloId: moduloId,
          numero: raData.numero
        }
      },
      update: {},
      create: {
        ...raData,
        moduloId: moduloId
      }
    })
    rasMap.set(ra.numero, ra.id)
    console.log(`    ✅ RA${ra.numero}: ${ra.descripcion.substring(0, 50)}...`)
  }

  // Crear Temas y relacionarlos con RAs
  for (const temaData of temasBasesDatos) {
    const { rasAsociados, ...temaInfo } = temaData

    const tema = await prisma.tema.upsert({
      where: {
        moduloId_numero: {
          moduloId: moduloId,
          numero: temaInfo.numero
        }
      },
      update: {},
      create: {
        ...temaInfo,
        moduloId: moduloId
      }
    })
    console.log(`    ✅ Tema ${tema.numero}: ${tema.titulo}`)

    // Relacionar tema con sus RAs
    for (const raNumero of rasAsociados) {
      const raId = rasMap.get(raNumero)
      if (raId) {
        await prisma.tema.update({
          where: { id: tema.id },
          data: {
            resultadosAprendizaje: {
              connect: { id: raId }
            }
          }
        })
      }
    }
  }
}
