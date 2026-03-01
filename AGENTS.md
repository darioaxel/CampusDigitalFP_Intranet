# AGENTS.md - Campus Digital FP Intranet

> Este archivo contiene información esencial para agentes de IA que trabajen en este proyecto.
> Léelo completamente antes de realizar cambios significativos.

---

## Resumen del Proyecto

**Campus Digital FP Intranet** es una aplicación web full-stack desarrollada como intranet para centros de Formación Profesional (FP) en España. Gestiona usuarios (profesores, expertos, jefes de departamento, administradores), horarios, calendarios escolares, estudios FP (ciclos, módulos, resultados de aprendizaje), solicitudes y tareas con flujos de validación.

- **Framework:** Nuxt 4.2.1 (Vue 3) con TypeScript 5.1
- **Base de datos:** PostgreSQL + Prisma ORM 7.3.0 (con adapter Neon)
- **Runtime:** Nitro (incluido en Nuxt)
- **Idioma principal del código:** Español (comentarios, variables, API)
- **UI:** Tailwind CSS 4.1.17 + shadcn-vue 2.3.3 + Reka UI 2.6.1
- **Package Manager:** pnpm 10.12.1

---

## Estructura de Directorios

```
/home/darioaxel/Proyectos/CampusDigitalFP_Intranet/
├── app/                          # Frontend Nuxt (Vue)
│   ├── assets/css/               # Tailwind CSS y estilos globales
│   ├── components/               # Componentes Vue
│   │   ├── ui/                   # Componentes shadcn-vue (Button, Card, etc.)
│   │   ├── calendar/             # Componentes de calendario
│   │   └── layout/               # Layouts reutilizables
│   ├── composables/              # Composables de Vue
│   │   ├── useAppUserSession.ts  # Gestión de sesión extendida
│   │   ├── useFileUpload.ts      # Subida de archivos
│   │   └── useRole.ts            # Acceso al rol del usuario
│   ├── layouts/                  # Layouts de Nuxt
│   │   ├── default.vue           # Layout por defecto
│   │   └── dashboard.vue         # Layout para panel de administración
│   ├── middleware/               # Middleware de rutas
│   │   ├── auth.ts               # Protección de rutas privadas
│   │   └── role.global.ts        # Validación global de roles
│   ├── pages/                    # Páginas de la aplicación (rutas auto-generadas)
│   │   ├── admin/                # Sección de administración
│   │   ├── usuario/              # Sección de usuario
│   │   ├── login.vue             # Página de login
│   │   ├── register.vue          # Registro de usuarios
│   │   └── index.vue             # Landing page
│   ├── types/                    # Tipos TypeScript
│   │   └── auth.d.ts             # Tipos de autenticación
│   └── lib/                      # Utilidades del cliente
│       ├── config.ts             # Configuración
│       └── utils.ts              # Utilidades (función cn para Tailwind)
├── server/                       # Backend (Nitro/Nuxt Server)
│   ├── api/                      # Endpoints API REST
│   │   ├── auth/                 # Autenticación (login, logout, register)
│   │   ├── admin/workflows/      # Gestión de workflows (CRUD estados/transiciones)
│   │   ├── calendars/            # Gestión de calendarios
│   │   ├── schedules/            # Gestión de horarios
│   │   ├── studies/              # Gestión de estudios FP (ciclos, módulos)
│   │   ├── requests/             # Solicitudes y workflow
│   │   ├── tasks/                # Tareas y asignaciones
│   │   ├── users/                # Gestión de usuarios
│   │   └── workflows/            # Listado de workflows disponibles
│   └── utils/                    # Utilidades del servidor
│       ├── db.ts                 # Cliente Prisma para servidor (con adapter Neon)
│       ├── schedules.ts          # Utilidades de horarios
│       └── workflow/             # Motor de workflows
│           ├── engine.ts         # Motor de workflows configurable
│           └── stateMachine.ts   # Máquina de estados legacy
├── prisma/                       # Base de datos
│   ├── schema/                   # Esquemas Prisma (divididos por dominio)
│   │   ├── schema.prisma         # Configuración principal
│   │   ├── user.prisma           # Usuarios y direcciones
│   │   ├── schedules.prisma      # Horarios y bloques horarios
│   │   ├── calendars.prisma      # Calendarios y eventos
│   │   ├── studies.prisma        # Ciclos, módulos, RAs, CEs
│   │   ├── workflow.prisma       # Solicitudes, tareas, votaciones
│   │   ├── workflow-config.prisma # Workflows configurables
│   │   ├── file.prisma           # Gestión de archivos
│   │   └── enums.prisma          # Enumeraciones compartidas
│   ├── migrations/               # Migraciones de Prisma
│   └── seed/                     # Seeders para datos iniciales
│       ├── seeders/              # Seeders individuales
│       │   ├── user.seeder.ts
│       │   ├── workflow.seeder.ts
│       │   ├── calendar.seeder.ts
│       │   └── ...
│       ├── data/                 # Datos de seed
│       └── index.ts              # Entry point del seed
├── lib/                          # Código compartido
│   └── prisma.ts                 # Cliente Prisma para cliente
├── plugins/                      # Plugins de Nuxt
│   ├── api.ts
│   └── temporal-polyfill.client.ts
├── public/                       # Assets estáticos
└── dev_docus/                    # Documentación de desarrollo
```

---

## Stack Tecnológico

### Core Framework
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| Nuxt | 4.2.1 | Framework Vue full-stack |
| Vue | 3.5.24 | Framework UI reactivo |
| TypeScript | 5.1 | Tipado estático |
| Nitro | - | Engine de servidor (incluido en Nuxt) |

### Base de Datos
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| PostgreSQL | - | Base de datos relacional |
| Prisma | 7.3.0 | ORM y migraciones |
| @prisma/adapter-neon | 7.3.0 | Adapter para Neon PostgreSQL |

### UI/UX
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| Tailwind CSS | 4.1.17 | Framework CSS utilitario |
| shadcn-vue | 2.3.3 | Componentes accesibles (basado en Reka UI) |
| Reka UI | 2.6.1 | Componentes headless accesibles |
| Lucide Vue | 0.554.0 | Iconos |
| @schedule-x/vue | 4.0.0 | Calendario interactivo |
| vue-sonner | 2.0.9 | Notificaciones toast |

### Estado y Formularios
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| Pinia | 3.0.4 | Estado global |
| pinia-plugin-persistedstate | 4.7.1 | Persistencia de estado |
| Vee-Validate | 4.15.1 | Validación de formularios |
| Zod | 3.25.76 | Validación de esquemas |

### Autenticación y Seguridad
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| nuxt-auth-utils | 0.5.25 | Sesiones y autenticación |
| bcrypt | 6.0.0 | Hash de contraseñas |
| nuxt-security | 2.4.0 | Headers de seguridad |

---

## Comandos de Desarrollo

```bash
# Instalación de dependencias
pnpm install

# Desarrollo local (hot reload)
pnpm dev

# Construcción para producción
pnpm build

# Generar sitio estático (si aplica)
pnpm generate

# Vista previa de producción
pnpm preview

# Post-install (generar tipos de Prisma y preparar Nuxt)
pnpm postinstall

# Base de datos
pnpm prisma:migrate        # Crear/aplicar migraciones
pnpm prisma:generate       # Generar cliente Prisma
pnpm prisma:setup          # Migrar + seed inicial
```

---

## Configuración de Entorno

Copiar `conf.env` a `.env` y configurar:

```env
# Base de datos (obligatorio)
DATABASE_URL="postgresql://user:pass@host/db?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://user:pass@host/db"

# Opcional para Supabase Auth/Storage
SUPABASE_URL="https://project.supabase.co"
SUPABASE_KEY="anon-key"
```

**Nota:** El proyecto usa `conf.env` como plantilla. No commitear archivos `.env` con credenciales reales.

---

## Arquitectura del Sistema

### Sistema de Roles (RBAC)

El sistema tiene 6 niveles de roles definidos en `prisma/schema/enums.prisma`:

1. **USER** - Usuario básico (sin permisos especiales)
2. **PROFESOR** - Profesor del centro
3. **EXPERTO** - Experto/Colaborador
4. **JEFE_DEPT** - Jefe de departamento (puede crear tareas)
5. **ADMIN** - Administrador (gestiona solicitudes, usuarios)
6. **ROOT** - Superadministrador (acceso total)

### Middleware de Autenticación

- **`app/middleware/auth.ts`** - Protege rutas privadas, redirige a /login si no hay sesión
- **`app/middleware/role.global.ts`** - Valida roles permitidos por página usando `definePageMeta({ roles: ['ADMIN'] })`

### Estructura de API

Las rutas API siguen la convención de Nuxt 4:

```
server/api/
├── recurso/
│   ├── index.get.ts      # GET /api/recurso (listar)
│   ├── index.post.ts     # POST /api/recurso (crear)
│   ├── [id].get.ts       # GET /api/recurso/:id (obtener)
│   ├── [id].put.ts       # PUT /api/recurso/:id (actualizar)
│   └── [id].delete.ts    # DELETE /api/recurso/:id (eliminar)
```

### Workflow y Máquina de Estados

El sistema usa un **workflow engine configurable** data-driven:

**Ubicación:** `server/utils/workflow/engine.ts`

- Workflows definidos en base de datos (`WorkflowDefinition`, `WorkflowState`, `WorkflowTransition`)
- Estados y transiciones configurables sin modificar código
- Soporta validaciones custom, acciones automáticas, notificaciones
- Historial de estados completo (`StateHistory`)

**Modelos principales:**
- `WorkflowDefinition` - Definición del workflow (código, nombre, tipo)
- `WorkflowState` - Estados posibles (código, nombre, color, isInitial, isFinal)
- `WorkflowTransition` - Transiciones permitidas (roles, validaciones, acciones)
- `StateHistory` - Auditoría de cambios de estado
- `WorkflowNotification` - Notificaciones automáticas

**Workflows predefinidos (seed):**
- `request_new_user` - Alta de nuevos usuarios (pendiente → aprobado/rechazado)
- `request_free_day` - Días de libre disposición

**API Endpoints:**
```
GET    /api/workflows              # Listar workflows disponibles
GET    /api/workflows/:id          # Detalle de workflow
GET    /api/tasks/:id/transitions  # Transiciones disponibles
POST   /api/tasks/:id/transition   # Ejecutar transición
GET    /api/tasks/:id/history      # Historial de estados
GET    /api/requests/:id/transitions
POST   /api/requests/:id/transition
GET    /api/requests/:id/history
```

**Uso del motor:**
```typescript
import { workflowEngine } from '~/server/utils/workflow/engine'

// Ejecutar transición
const result = await workflowEngine.executeTransition({
  entityId: taskId,
  entityType: 'TASK',
  toStateCode: 'approved',
  actorId: user.id,
  actorRole: user.role,
  comment: 'Todo correcto'
})

// Crear entidad con workflow
const task = await workflowEngine.createEntityWithWorkflow('TASK', 'task_validation', {
  title: 'Nueva tarea',
  creatorId: user.id,
  // ... otros campos
})
```

---

## Base de Datos (Prisma)

El esquema está dividido en archivos modulares en `prisma/schema/`:

| Archivo | Contenido |
|---------|-----------|
| `schema.prisma` | Configuración del datasource y generator |
| `user.prisma` | Usuarios, direcciones, perfiles |
| `schedules.prisma` | Horarios y bloques horarios |
| `calendars.prisma` | Calendarios escolares y eventos |
| `studies.prisma` | Ciclos formativos, módulos, RAs, CEs |
| `workflow.prisma` | Solicitudes, tareas, votaciones, logs |
| `workflow-config.prisma` | Definición de workflows configurables |
| `file.prisma` | Gestión de archivos |
| `enums.prisma` | Enumeraciones compartidas |

**Relaciones importantes:**
- Usuario tiene muchos Schedule (horarios)
- Schedule tiene muchos ScheduleBlock (bloques de tiempo)
- Calendar tiene muchos CalendarEvent (eventos)
- UserCalendarEvent (tabla intermedia) para asignaciones drag-drop
- Request/Document/Task para el workflow

---

## Componentes de Calendario

Los componentes de calendario están ubicados en `app/components/calendar/`:

### CalendarMonthCard
Card individual que muestra un mes completo con eventos y selección de días.

**Props principales:**
- `year`, `month`: Año y mes a mostrar (mes 0-11)
- `events`: Array de eventos (`CalendarMonthEvent[]`)
- `selectedDays`: Días seleccionados (formato `YYYY-MM-DD`)
- `selectable`: Permite seleccionar días (boolean)
- `compact`: Modo compacto para grids (boolean)
- `dayClass`: Función para clases CSS personalizadas

**Emits:**
- `day-click`, `day-mousedown`, `day-mouseenter`, `day-mouseup`

### CalendarMonthGrid
Grid de múltiples cards de meses para visualizar un rango de fechas completo.

**Props principales:**
- `startDate`, `endDate`: Rango de fechas a mostrar
- `events`: Array de eventos
- `columns`: Número de columnas en la grid (1-4, default: 3)
- `selectable`: Permite selección de días

**Métodos expuestos (vía ref):**
- `clearSelection()`: Limpia la selección
- `selectAll()`: Selecciona todos los días laborables
- `getSelectedDays()`: Obtiene array de días seleccionados

**Ejemplo de uso:**
```vue
<CalendarMonthGrid
  ref="monthGrid"
  start-date="2024-09-01"
  end-date="2025-06-30"
  :events="calendarEvents"
  :selectable="true"
  :columns="3"
  @day-click="handleDayClick"
/>
```

### SimpleCalendar
Calendario mensual simple sin dependencias externas. Navegación por meses con eventos.

### CalendarDnd
Calendario con Schedule-X para funcionalidad drag-and-drop (asignación de días de libre disposición).

### Componentes de Diálogo (`calendar/dialogs/`)

Componentes reutilizables de modales:

#### ConfirmDialog
Modal de confirmación genérico para acciones destructivas.

```vue
<ConfirmDialog
  v-model:open="showDeleteModal"
  title="Eliminar elemento"
  icon="lucide:trash-2"
  icon-class="text-destructive"
  confirm-variant="destructive"
  :loading="isLoading"
  @confirm="handleConfirm"
>
  <template #description>
    ¿Estás seguro de que deseas eliminar este elemento?
  </template>
</ConfirmDialog>
```

#### EventFormDialog
Formulario para crear/editar eventos de calendario.

```vue
<EventFormDialog
  v-model:open="showModal"
  :event="editingEvent"
  :default-start-date="selectedDate"
  @submit="handleSubmit"
/>
```

#### ExamPeriodDialog
Modal para marcar días como período de evaluación.

```vue
<ExamPeriodDialog
  v-model:open="showExamModal"
  :selected-days-count="selectedDays.length"
  :selected-days-text="selectedDaysText"
  @submit="handleExamSubmit"
/>
```

---

## Convenciones de Código

### TypeScript / Vue
- Usar `<script setup lang="ts">` en todos los componentes
- Usar Composition API (no Options API)
- Tipar explícitamente las respuestas de API con `useFetch<T>`

### Estilos
- Usar Tailwind CSS con las variables CSS del tema
- Componentes UI en `app/components/ui/` siguen convención shadcn
- Colores personalizados en `app/assets/css/tailwind.css` (tema naranja/dorado)

### Nomenclatura
- **Componentes:** PascalCase (ej: `ScheduleViewer.vue`)
- **Composables:** camelCase con prefijo `use` (ej: `useAppUserSession.ts`)
- **API routes:** kebab-case (ej: `validate.post.ts`)
- **Variables/funciones:** camelCase en español (ej: `usuarioActual`, `cargarDatos`)

### Imports
Usar aliases configurados en `components.json`:
- `@/components/*` - Componentes
- `@/lib/*` - Utilidades
- `@/composables/*` - Composables

---

## Temas y Estilos

El proyecto usa un tema personalizado basado en naranja/dorado:

**Light mode:**
- Background: Gris muy claro (#f3f4f6)
- Primary: Naranja/Dorado (#d4a01)
- Cards: Blanco

**Dark mode:**
- Background: Azul oscuro/gris oscuro (#1e293b)
- Primary: Naranja/Dorado (mismo)
- Cards: Gris oscuro azulado

Las variables CSS están definidas en `app/assets/css/tailwind.css` usando `oklch()` para mejor precisión cromática.

---

## Seguridad

- **Autenticación:** Session-based con `nuxt-auth-utils` (cookies HTTP-only)
- **Autorización:** Middleware de roles en rutas
- **CSP:** Desactivado en desarrollo (configurado en `nuxt.config.ts`)
- **Rate limiting:** Preparado para `rate-limiter-flexible` (no activo por defecto)
- **Headers de seguridad:** Configurados vía `nuxt-security`
- **Validación:** Zod para validación de inputs en frontend y backend

---

## Testing

El proyecto utiliza **Vitest** para tests unitarios y de integración.

### Sistema de Testing de Workflows

Ubicación: `tests/`

```
tests/
├── setup.ts                    # Configuración global de Vitest
├── vitest.config.ts            # Configuración de Vitest
├── README.md                   # Documentación del sistema de testing
├── mocks/
│   └── prisma.mock.ts          # Mock del cliente Prisma
├── factories/
│   └── workflow.factory.ts     # Factories para crear datos de prueba
├── fixtures/
│   └── workflows.fixture.ts    # Fixtures de workflows reales del sistema
├── unit/
│   └── workflow.engine.test.ts # Tests unitarios del motor de workflows
└── integration/
    ├── request-new-user.workflow.test.ts  # Workflow: Alta de Nuevo Usuario
    ├── free-day.workflow.test.ts          # Workflow: Día Libre Disposición
    └── sick-leave.workflow.test.ts        # Workflow: Comunicación de Bajas
```

### Comandos de Testing

```bash
# Ejecutar todos los tests
pnpm test

# Ejecutar tests en modo watch
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

### Workflows Testeados

| Workflow | Código | Estados | Transiciones | Tests |
|----------|--------|---------|--------------|-------|
| Alta de Nuevo Usuario | `request_new_user` | 3 | 2 | 17 |
| Día Libre Disposición | `request_free_day` | 4 | 4 | 28 |
| Comunicación de Bajas | `request_sick_leave` | 6 | 6 | 34 |

### Tipos de Tests

**Tests Unitarios (`tests/unit/`):**
- Validación de estructura de workflows
- Verificación de transiciones y estados
- Validación de permisos por rol
- Verificación de acciones automáticas

**Tests de Integración (`tests/integration/`):**
- Validación completa de cada workflow
- Flujos de transición entre estados
- Permisos por rol en cada transición
- Validadores y acciones automáticas

### Crear Nuevos Tests

Para añadir tests de un nuevo workflow:

1. Añadir el fixture en `tests/fixtures/workflows.fixture.ts`:
```typescript
export const myNewWorkflowFixture = () => {
  const builder = new WorkflowBuilder('my_code', 'Nombre', 'REQUEST')
  return builder
    .addState('pending', 'Pendiente', { isInitial: true })
    .addState('approved', 'Aprobado', { isFinal: true })
    .addTransition('pending', 'approved', ['ADMIN'])
    .build()
}
```

2. Crear archivo de test en `tests/integration/my-workflow.test.ts`

3. Ejecutar tests: `pnpm test`

### Factories y Fixtures

Las factories permiten crear datos de prueba consistentes:

```typescript
import { createUser, createRequest, WorkflowBuilder } from '../factories/workflow.factory'

const admin = createUser({ role: 'ADMIN', firstName: 'Admin' })
const request = createRequest({ requesterId: user.id, workflowId: workflow.id })
```

Los fixtures contienen los workflows reales del sistema para testing:

```typescript
import { requestNewUserWorkflowFixture, validateWorkflowStructure } from '../fixtures/workflows.fixture'

const fixture = requestNewUserWorkflowFixture()
const { workflow, states, transitions } = fixture
const validation = validateWorkflowStructure(fixture)
```

### Consideraciones Adicionales

Para tests E2E de la aplicación completa, considera añadir **Playwright**:
```bash
pnpm add -D @playwright/test
```

---

## Solución de Problemas Comunes

### Error de Prisma "Can't reach database"
Verificar `DATABASE_URL` en `.env`. El proyecto usa Neon PostgreSQL que requiere conexión SSL.

### Error "useHead is not defined" en SEO
El módulo `@nuxtjs/seo` está temporalmente deshabilitado en `nuxt.config.ts` (línea comentada).

### Errores de tipo en useFetch
Asegurar de tipar correctamente: `useFetch<Tipo>('/api/endpoint')`

### CSS no se aplica correctamente
Verificar que los imports de Tailwind estén en `app/assets/css/tailwind.css`:
```css
@import "tailwindcss";
@import "tw-animate-css";
```

---

## Notas para Agentes de IA

1. **Idioma:** El código base usa español para comentarios, nombres de variables y API. Mantener consistencia.

2. **Componentes UI:** Antes de crear un componente nuevo, verificar si existe en `app/components/ui/` (shadcn) o si se puede componer con los existentes.

3. **Validación:** Usar Zod para validación de esquemas tanto en frontend como en API routes.

4. **Autenticación:** Siempre usar el middleware `auth` para rutas protegidas y validar roles cuando sea necesario.

5. **Base de datos:** Al modificar el esquema Prisma:
   - Editar archivos en `prisma/schema/`
   - Ejecutar `pnpm prisma:migrate` para crear migración
   - Ejecutar `pnpm prisma:generate` para actualizar tipos

6. **Estado global:** Usar Pinia para estado compartido. Para estado de sesión de usuario, usar `useAppUserSession` composable.

7. **API routes:** Validar siempre el body con Zod usando `readValidatedBody(event, schema.parse)`.

8. **Workflow:**
   - Modificar `prisma/seed/data/workflows.ts` para cambiar workflows predefinidos
   - El motor está en `server/utils/workflow/engine.ts`
   - Las entidades Task y Request requieren `workflowId` y `currentStateId` obligatoriamente

9. **Patrones comunes:**
   - Usar `cn()` de `@/lib/utils` para clases condicionales de Tailwind
   - Usar `useUserSession()` de `nuxt-auth-utils` para acceso a sesión
   - Usar `useAppUserSession()` para datos extendidos del usuario

---

## Recursos Útiles

- [Documentación Nuxt](https://nuxt.com/docs)
- [Documentación Prisma](https://www.prisma.io/docs)
- [shadcn-vue](https://www.shadcn-vue.com/)
- [Reka UI](https://reka-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
