# AGENTS.md - Campus Digital FP Intranet

> Este archivo contiene información esencial para agentes de IA que trabajen en este proyecto.
> Léelo completamente antes de realizar cambios significativos.

---

## Resumen del Proyecto

**Campus Digital FP Intranet** es una aplicación web full-stack desarrollada como intranet para centros de Formación Profesional (FP) en España. Gestiona usuarios (profesores, expertos, jefes de departamento, administradores), horarios, calendarios escolares, estudios FP (ciclos, módulos, resultados de aprendizaje), solicitudes y tareas con flujos de validación.

- **Framework:** Nuxt 4.2.1 (Vue 3)
- **Base de datos:** PostgreSQL (Neon/Supabase) + Prisma ORM 7.3.0
- **Idioma principal del código:** Español (comentarios, variables, API)
- **UI:** Tailwind CSS 4.x + shadcn-vue + Reka UI

---

## Estructura de Directorios

```
/home/isard/Proyectos/CampusDigitalFP_Intranet/
├── app/                          # Frontend Nuxt (Vue)
│   ├── assets/css/               # Tailwind CSS y estilos globales
│   ├── components/               # Componentes Vue
│   │   ├── ui/                   # Componentes shadcn-vue (Button, Card, etc.)
│   │   ├── calendar/             # Componentes de calendario
│   │   ├── layout/               # Layouts reutilizables
│   │   └── ...
│   ├── composables/              # Composables de Vue (useAppUserSession, etc.)
│   ├── layouts/                  # Layouts de Nuxt (default, dashboard)
│   ├── middleware/               # Middleware de rutas (auth, role.global)
│   ├── pages/                    # Páginas de la aplicación (rutas)
│   │   ├── admin/                # Sección de administración
│   │   ├── usuario/              # Sección de usuario
│   │   └── ...
│   ├── types/                    # Tipos TypeScript (auth.d.ts)
│   └── lib/                      # Utilidades del cliente (utils.ts, config.ts)
├── server/                       # Backend (Nitro/Nuxt Server)
│   ├── api/                      # Endpoints API REST
│   │   ├── auth/                 # Autenticación (login, logout, register)
│   │   ├── calendars/            # Gestión de calendarios
│   │   ├── schedules/            # Gestión de horarios
│   │   ├── studies/              # Gestión de estudios FP
│   │   ├── requests/             # Solicitudes y workflow
│   │   └── ...
│   └── utils/                    # Utilidades del servidor
│       └── workflow/             # Máquina de estados para workflow
├── prisma/                       # Base de datos
│   ├── schema/                   # Esquemas Prisma (divididos por dominio)
│   │   ├── schema.prisma         # Configuración principal
│   │   ├── user.prisma           # Usuarios y autenticación
│   │   ├── schedules.prisma      # Horarios
│   │   ├── calendars.prisma      # Calendarios
│   │   ├── studies.prisma        # Estudios FP
│   │   ├── workflow.prisma       # Solicitudes, tareas, workflow
│   │   ├── enums.prisma          # Enums compartidos
│   │   └── file.prisma           # Gestión de archivos
│   ├── migrations/               # Migraciones de Prisma
│   └── seed/                     # Seeders para datos iniciales
├── lib/                          # Código compartido
│   └── prisma.ts                 # Cliente Prisma para cliente
├── plugins/                      # Plugins de Nuxt
├── public/                       # Assets estáticos
└── dev_docus/                    # Documentación de desarrollo
```

---

## Stack Tecnológico

### Core
- **Nuxt 4.2.1** - Framework Vue full-stack
- **Vue 3.5.24** - Framework UI reactivo
- **TypeScript 5.1** - Tipado estático
- **Nitro** - Engine de servidor (incluido en Nuxt)

### Base de Datos
- **PostgreSQL** - Base de datos relacional
- **Prisma 7.3.0** - ORM y migraciones
- **@prisma/adapter-neon** - Adapter para Neon PostgreSQL

### UI/UX
- **Tailwind CSS 4.1.17** - Framework CSS utilitario
- **shadcn-vue 2.3.3** - Componentes accesibles (basado en Reka UI)
- **Reka UI 2.6.1** - Componentes headless accesibles (fork de Radix Vue)
- **Lucide Vue** - Iconos
- **@schedule-x/vue** - Calendario interactivo
- **vue-sonner** - Notificaciones toast

### Estado y Formularios
- **Pinia 3.0.4** - Estado global
- **pinia-plugin-persistedstate** - Persistencia de estado
- **Vee-Validate 4.15.1** - Validación de formularios
- **Zod 3.25.76** - Validación de esquemas

### Autenticación y Seguridad
- **nuxt-auth-utils 0.5.25** - Sesiones y autenticación
- **bcrypt 6.0.0** - Hash de contraseñas
- **nuxt-security 2.4.0** - Headers de seguridad
- **jsonwebtoken** - Tokens JWT

### Herramientas de Desarrollo
- **pnpm 10.12.1** - Package manager
- **ESLint 9** - Linter (configuración de Nuxt)
- **Prettier 3.6.2** - Formateo de código

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
pnpm prisma:migrate        # Crear/apply migraciones
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

## Arquitectura y Convenciones

### Sistema de Roles (RBAC)

El sistema tiene 6 niveles de roles definidos en `prisma/schema/enums.prisma`:

1. **USER** - Usuario básico (sin permisos especiales)
2. **PROFESOR** - Profesor del centro
3. **EXPERTO** - Experto/Colaborador
4. **JEFE_DEPT** - Jefe de departamento (puede crear tareas)
5. **ADMIN** - Administrador (gestiona solicitudes, usuarios)
6. **ROOT** - Superadministrador (acceso total)

### Middleware de Autenticación

- `app/middleware/auth.ts` - Protege rutas privadas, redirige a /login si no hay sesión
- `app/middleware/role.global.ts` - Valida roles permitidos por página usando `definePageMeta({ roles: ['ADMIN'] })`

### Convenciones de Código

**TypeScript / Vue:**
- Usar `<script setup lang="ts">` en todos los componentes
- UsarComposition API (no Options API)
- Tipar explícitamente las respuestas de API con `useFetch<T>`

**Estilos:**
- Usar Tailwind CSS con las variables CSS del tema
- Componentes UI en `app/components/ui/` siguen convención shadcn
- Colores personalizados en `app/assets/css/tailwind.css` (tema naranja/dorado)

**Nomenclatura:**
- Componentes: PascalCase (ej: `ScheduleViewer.vue`)
- Composables: camelCase con prefijo `use` (ej: `useAppUserSession.ts`)
- API routes: kebab-case (ej: `validate.post.ts`)
- Variables/funciones: camelCase en español (ej: `usuarioActual`, `cargarDatos`)

**Imports:**
- Usar aliases configurados en `components.json`:
  - `@/components/*` - Componentes
  - `@/lib/*` - Utilidades
  - `@/composables/*` - Composables

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

Ubicación: `server/utils/workflow/engine.ts`

- Workflows definidos en base de datos (`WorkflowDefinition`, `WorkflowState`, `WorkflowTransition`)
- Estados y transiciones configurables sin modificar código
- Soporta validaciones custom, acciones automáticas, notificaciones
- Historial de estados completo (`StateHistory`)

**Modelos:**
- `WorkflowDefinition` - Definición del workflow (código, nombre, tipo)
- `WorkflowState` - Estados posibles (código, nombre, color, isInitial, isFinal)
- `WorkflowTransition` - Transiciones permitidas (roles, validaciones, acciones)
- `StateHistory` - Auditoría de cambios de estado
- `WorkflowNotification` - Notificaciones automáticas

**Workflows predefinidos (seed):**
- `task_validation` - Validación con revisión (todo → in_progress → in_review → approved/rejected)
- `task_voting` - Votaciones (voting_open → voting_closed → resolved)
- `task_simple` - Tarea básica (todo → in_progress → done/cancelled)
- `request_free_day` - Días libres con revisión de jefe y admin
- `request_medical` - Visitas médicas con documentación
- `request_standard` - Solicitudes estándar simples

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

### Base de Datos (Prisma)

El esquema está dividido en archivos modulares:
- `schema.prisma` - Configuración del datasource y generator
- `user.prisma` - Usuarios, direcciones, perfiles
- `schedules.prisma` - Horarios y bloques horarios
- `calendars.prisma` - Calendarios escolares y eventos
- `studies.prisma` - Ciclos formativos, módulos, RAs, CEs
- `workflow.prisma` - Solicitudes, tareas, votaciones, logs
- `file.prisma` - Gestión de archivos
- `enums.prisma` - Enumeraciones compartidas

**Relaciones importantes:**
- Usuario tiene muchos Schedule (horarios)
- Schedule tiene muchos ScheduleBlock (bloques de tiempo)
- Calendar tiene muchos CalendarEvent (eventos)
- UserCalendarEvent (tabla intermedia) para asignaciones drag-drop
- Request/Document/Task para el workflow

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

---

## Testing

No hay framework de testing configurado actualmente. Si necesitas añadir tests:
- Considera **Vitest** para tests unitarios
- Considera **Playwright** para E2E

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

## Recursos tiles

- [Documentación Nuxt](https://nuxt.com/docs)
- [Documentación Prisma](https://www.prisma.io/docs)
- [shadcn-vue](https://www.shadcn-vue.com/)
- [Reka UI](https://reka-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

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
   - Modificar `prisma/seed/seeders/workflow.seeder.ts` para cambiar workflows predefinidos
   - El motor está en `server/utils/workflow/engine.ts`
   - Las entidades Task y Request requieren `workflowId` y `currentStateId` obligatoriamente
