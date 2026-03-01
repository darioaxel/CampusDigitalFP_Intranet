#!/usr/bin/env tsx
/**
 * Script para ejecutar tests de workflows con reporte visual
 * Uso: pnpm tsx tests/run-workflow-tests.ts
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import path from 'path'

// ============================================
// CONFIGURACIÓN
// ============================================
const TESTS_DIR = path.join(__dirname)
const COVERAGE_DIR = path.join(TESTS_DIR, 'coverage')

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

// ============================================
// UTILIDADES
// ============================================
function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function printHeader(title: string) {
  console.log('')
  log('='.repeat(60), 'cyan')
  log(`  ${title}`, 'bright')
  log('='.repeat(60), 'cyan')
  console.log('')
}

function printSection(title: string) {
  console.log('')
  log(`▶ ${title}`, 'yellow')
  log('-'.repeat(50), 'cyan')
}

// ============================================
// EJECUCIÓN DE TESTS
// ============================================
interface TestResult {
  name: string
  passed: boolean
  duration: string
  output?: string
}

function runTestFile(testFile: string): TestResult {
  const startTime = Date.now()
  
  try {
    execSync(`npx vitest run "${testFile}" --reporter=verbose`, {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
      encoding: 'utf-8'
    })
    
    return {
      name: path.basename(testFile),
      passed: true,
      duration: `${Date.now() - startTime}ms`
    }
  } catch (error: any) {
    return {
      name: path.basename(testFile),
      passed: false,
      duration: `${Date.now() - startTime}ms`,
      output: error.stdout || error.message
    }
  }
}

// ============================================
// REPORTE DE WORKFLOWS
// ============================================
function printWorkflowSummary() {
  printHeader('RESUMEN DE WORKFLOWS TESTEADOS')
  
  const workflows = [
    {
      code: 'request_new_user',
      name: 'Alta de Nuevo Usuario',
      states: 3,
      transitions: 2,
      features: ['Aprobación con comentario', 'Rechazo con comentario', 'Notificación automática']
    },
    {
      code: 'request_free_day',
      name: 'Día Libre Disposición',
      states: 4,
      transitions: 4,
      features: ['Aprobación Admin', 'Cancelación usuario', 'Eliminación calendario', 'Notificación']
    },
    {
      code: 'request_sick_leave',
      name: 'Comunicación de Bajas',
      states: 6,
      transitions: 6,
      features: ['Validación documentos', 'Ciclo devolución', 'Flujo multi-paso', 'Notificaciones']
    }
  ]
  
  for (const wf of workflows) {
    log(`\n📋 ${wf.name}`, 'bright')
    log(`   Código: ${wf.code}`, 'cyan')
    log(`   Estados: ${wf.states} | Transiciones: ${wf.transitions}`, 'blue')
    log(`   Características:`, 'yellow')
    for (const feature of wf.features) {
      log(`     • ${feature}`, 'reset')
    }
  }
}

// ============================================
// COBERTURA
// ============================================
function printCoverageSummary() {
  printHeader('COBERTURA DE CÓDIGO')
  
  const coverageFile = path.join(COVERAGE_DIR, 'coverage-summary.json')
  
  if (!existsSync(coverageFile)) {
    log('⚠️  No se encontró reporte de cobertura.', 'yellow')
    log('   Ejecuta: pnpm test:coverage', 'cyan')
    return
  }
  
  try {
    const summary = JSON.parse(readFileSync(coverageFile, 'utf-8'))
    const total = summary.total
    
    if (total) {
      const lines = total.lines?.pct || 0
      const statements = total.statements?.pct || 0
      const functions = total.functions?.pct || 0
      const branches = total.branches?.pct || 0
      
      log(`📊 Cobertura Total:`, 'bright')
      log(`   Líneas:        ${lines.toFixed(2)}%`, lines > 80 ? 'green' : lines > 50 ? 'yellow' : 'red')
      log(`   Statements:    ${statements.toFixed(2)}%`, statements > 80 ? 'green' : statements > 50 ? 'yellow' : 'red')
      log(`   Funciones:     ${functions.toFixed(2)}%`, functions > 80 ? 'green' : functions > 50 ? 'yellow' : 'red')
      log(`   Branches:      ${branches.toFixed(2)}%`, branches > 80 ? 'green' : branches > 50 ? 'yellow' : 'red')
    }
  } catch (error) {
    log('❌ Error leyendo cobertura', 'red')
  }
}

// ============================================
// MENÚ PRINCIPAL
// ============================================
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'all'
  
  printHeader('🧪 SISTEMA DE TESTING - CAMPUS DIGITAL FP')
  
  switch (command) {
    case 'all':
      printSection('Ejecutando todos los tests...')
      try {
        execSync('npx vitest run', {
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit'
        })
        log('\n✅ Todos los tests pasaron', 'green')
      } catch (error) {
        log('\n❌ Algunos tests fallaron', 'red')
        process.exit(1)
      }
      break
      
    case 'unit':
      printSection('Ejecutando tests unitarios...')
      try {
        execSync('npx vitest run tests/unit/', {
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit'
        })
        log('\n✅ Tests unitarios pasaron', 'green')
      } catch (error) {
        log('\n❌ Tests unitarios fallaron', 'red')
        process.exit(1)
      }
      break
      
    case 'integration':
      printSection('Ejecutando tests de integración...')
      try {
        execSync('npx vitest run tests/integration/', {
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit'
        })
        log('\n✅ Tests de integración pasaron', 'green')
      } catch (error) {
        log('\n❌ Tests de integración fallaron', 'red')
        process.exit(1)
      }
      break
      
    case 'info':
      printWorkflowSummary()
      printCoverageSummary()
      break
      
    case 'coverage':
      printSection('Generando reporte de cobertura...')
      try {
        execSync('npx vitest run --coverage', {
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit'
        })
        printCoverageSummary()
      } catch (error) {
        log('\n❌ Error generando cobertura', 'red')
        process.exit(1)
      }
      break
      
    default:
      log('Uso: pnpm tsx tests/run-workflow-tests.ts [comando]', 'yellow')
      log('', 'reset')
      log('Comandos:', 'bright')
      log('  all          - Ejecutar todos los tests', 'cyan')
      log('  unit         - Ejecutar tests unitarios', 'cyan')
      log('  integration  - Ejecutar tests de integración', 'cyan')
      log('  coverage     - Generar reporte de cobertura', 'cyan')
      log('  info         - Mostrar información de workflows', 'cyan')
      process.exit(0)
  }
  
  console.log('')
  log('='.repeat(60), 'cyan')
  log('  Testing completado', 'green')
  log('='.repeat(60), 'cyan')
  console.log('')
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red')
  process.exit(1)
})
