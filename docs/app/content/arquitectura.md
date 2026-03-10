---
title: 'Arquitectura'
icon: 'i-lucide-building-2'
description: 'Estructura y decisiones técnicas del proyecto'
---

# Arquitectura del Sistema

## Stack tecnológico

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

## Estructura de directorios

```
CampusDigitalFP_Intranet/
├── app/                    # Frontend Nuxt (Vue)
│   ├── assets/css/         # Tailwind CSS y estilos globales
│   ├── components/         # Componentes Vue
│   │   ├── ui/            # Componentes shadcn-vue
│   │   ├── calendar/      # Componentes de calendario
│   │   └── layout/        # Layouts reutilizables
│   ├── composables/       # Composables de Vue
│   ├── layouts/           # Layouts de Nuxt
│   ├── middleware/        # Middleware de rutas
│   ├── pages/             # Páginas de la aplicación
│   └── lib/               # Utilidades del cliente
├── server/                 # Backend (Nitro/Nuxt Server)
│   ├── api/               # Endpoints API REST
│   └── utils/             # Utilidades del servidor
├── prisma/                 # Base de datos
│   ├── schema/            # Esquemas Prisma
│   └── seed/              # Seeders
├── docs/                   # Documentación (Nuxt 4 + Content)
└── tests/                  # Tests
```

## Sistema de autenticación

- **nuxt-auth-utils** - Sesiones y autenticación
- Cookies HTTP-only para seguridad
- Middleware de roles en rutas

### Roles disponibles

1. **USER** - Usuario básico
2. **PROFESOR** - Profesor del centro
3. **EXPERTO** - Experto/Colaborador
4. **JEFE_DEPT** - Jefe de departamento
5. **ADMIN** - Administrador
6. **ROOT** - Superadministrador

## Sistema de workflows

Motor de workflows configurable data-driven ubicado en `server/utils/workflow/engine.ts`.

### Modelos principales

| Modelo | Descripción |
|--------|-------------|
| `WorkflowDefinition` | Definición del workflow (código, nombre, tipo) |
| `WorkflowState` | Estados posibles (código, nombre, color, isInitial, isFinal) |
| `WorkflowTransition` | Transiciones permitidas (roles, validaciones, acciones) |
| `StateHistory` | Auditoría de cambios de estado |

### Workflows predefinidos

- `request_new_user` - Alta de nuevos usuarios
- `request_free_day` - Días de libre disposición
- `request_sick_leave` - Comunicación de bajas
- `request_schedule_validation` - Validación de horarios

## Patrones de código

### TypeScript / Vue
- Usar `<script setup lang="ts">` en todos los componentes
- Usar Composition API (no Options API)
- Tipar explícitamente las respuestas de API con `useFetch<T>`

### Nomenclatura
| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Componentes | PascalCase | `ScheduleViewer.vue` |
| Composables | camelCase con `use` | `useAppUserSession.ts` |
| API routes | kebab-case | `validate.post.ts` |
| Variables/funciones | camelCase en español | `usuarioActual`, `cargarDatos` |

### Imports
Usar aliases configurados en `components.json`:
- `@/components/*` - Componentes
- `@/lib/*` - Utilidades
- `@/composables/*` - Composables
