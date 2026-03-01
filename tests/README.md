# Sistema de Testing - Campus Digital FP Workflows

Este directorio contiene el sistema completo de testing para los workflows del Campus Digital FP Intranet.

## 📁 Estructura

```
tests/
├── setup.ts                    # Configuración global de Vitest
├── vitest.config.ts            # Configuración de Vitest
├── README.md                   # Este archivo
├── coverage/                   # Reportes de cobertura
├── mocks/
│   └── prisma.mock.ts          # Mock del cliente Prisma
├── factories/
│   └── workflow.factory.ts     # Factories para datos de prueba
├── fixtures/
│   └── workflows.fixture.ts    # Fixtures de workflows reales
├── unit/
│   └── workflow.engine.test.ts # Tests unitarios del motor
└── integration/
    ├── request-new-user.workflow.test.ts  # Tests workflow alta usuario
    ├── free-day.workflow.test.ts          # Tests workflow días libres
    └── sick-leave.workflow.test.ts        # Tests workflow bajas
```

## 🚀 Comandos

```bash
# Ejecutar todos los tests
pnpm test

# Ejecutar tests en modo watch (desarrollo)
pnpm test:watch

# Ejecutar tests con UI interactiva
pnpm test:ui

# Generar reporte de cobertura
pnpm test:coverage

# Ejecutar solo tests de workflows (integración)
pnpm test:workflows

# Ejecutar solo tests unitarios
pnpm test:workflows:unit
```

## 🧪 Tipos de Tests

### Tests Unitarios (`tests/unit/`)
Prueban el `WorkflowEngine` de forma aislada utilizando mocks de Prisma.

- **workflow.engine.test.ts**: 
  - `getAvailableTransitions()`: Obtener transiciones disponibles
  - `validateTransition()`: Validar transiciones
  - `executeTransition()`: Ejecutar transiciones
  - `createEntityWithWorkflow()`: Crear entidades con workflow
  - `getStateHistory()`: Obtener historial de estados

### Tests de Integración (`tests/integration/`)
Prueban cada workflow específico con sus reglas de negocio.

#### request_new_user (Alta de Nuevo Usuario)
- Estados: pending → approved | rejected
- 2 transiciones
- Solo ADMIN y ROOT pueden aprobar/rechazar
- Requiere comentario obligatorio

#### request_free_day (Día Libre Disposición)
- Estados: pending → approved | rejected | cancelled_by_user
- 4 transiciones
- PROFESOR solo puede cancelar
- Cancelación de aprobado elimina evento del calendario

#### request_sick_leave (Comunicación de Bajas)
- Estados: pending_notification → notified → pending_docs → pending_validation → validated | rejected
- 6 transiciones
- PROFESOR solo puede: mover a pending_validation
- Validador `check_documents` en aprobación final
- Ciclo de devolución de documentación

## 🏭 Factories

Las factories permiten crear datos de prueba consistentes:

```typescript
import { createUser, createRequest, WorkflowBuilder } from './factories/workflow.factory'

// Crear usuario
const admin = createUser({ role: 'ADMIN', firstName: 'Admin' })

// Crear request
const request = createRequest({
  requesterId: user.id,
  workflowId: workflow.id,
  currentStateId: pendingState.id
})

// Builder de workflow completo
const builder = new WorkflowBuilder('my_workflow', 'Mi Workflow', 'REQUEST')
  .addState('pending', 'Pendiente', { isInitial: true })
  .addState('approved', 'Aprobado', { isFinal: true })
  .addTransition('pending', 'approved', ['ADMIN'])
```

## 🔧 Mocks

El mock de Prisma (`tests/mocks/prisma.mock.ts`) proporciona:

- Todos los modelos de Prisma mockeados
- Métodos CRUD operativos
- `$transaction` con callback
- Helpers para crear respuestas con relaciones

```typescript
import { mockPrisma, resetPrismaMocks } from './mocks/prisma.mock'

beforeEach(() => {
  resetPrismaMocks()
})

// Configurar respuesta
mockPrisma.request.findUnique.mockResolvedValue({
  id: 'req-1',
  // ... datos
})
```

## 📊 Fixtures

Los fixtures contienen los workflows reales del sistema para testing:

```typescript
import { 
  requestNewUserWorkflowFixture,
  freeDayWorkflowFixture,
  sickLeaveWorkflowFixture,
  validateWorkflowStructure
} from './fixtures/workflows.fixture'

// Obtener workflow con estados y transiciones
const fixture = requestNewUserWorkflowFixture()
const { workflow, states, transitions } = fixture

// Validar estructura
const validation = validateWorkflowStructure(fixture)
expect(validation.valid).toBe(true)
```

## 📝 Convenciones

### Nomenclatura
- Tests: `*.test.ts`
- Descripciones en español
- Estructura: `describe` para feature, `it` para caso de uso

### Estructura de Tests
```typescript
describe('Workflow: Nombre (code)', () => {
  describe('Estructura del Workflow', () => {
    // Validaciones de estructura
  })
  
  describe('Transición: from → to', () => {
    // Tests específicos de transición
  })
  
  describe('Flujos Completos', () => {
    // Tests de flujos end-to-end
  })
})
```

### Buenas Prácticas
1. Usar `beforeEach` para resetear mocks
2. Crear datos con factories
3. Testear casos de éxito y error
4. Verificar mensajes de error
5. Testear permisos por rol

## 🐛 Debugging

```bash
# Ejecutar un test específico
pnpm test -- tests/unit/workflow.engine.test.ts

# Ejecutar con verbose
pnpm test -- --reporter=verbose

# Ejecutar con UI
pnpm test:ui
```

## 📈 Cobertura

El reporte de cobertura se genera en `tests/coverage/`:

```bash
# Generar cobertura
pnpm test:coverage

# Ver reporte HTML
open tests/coverage/index.html
```

## 🔗 Integración CI/CD

Para integrar en CI/CD:

```yaml
# Ejemplo GitHub Actions
- name: Run Tests
  run: pnpm test

- name: Run Coverage
  run: pnpm test:coverage
```

---

**Nota**: Estos tests usan mocks de Prisma, no requieren base de datos real.
