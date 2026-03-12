# Campus Digital FP Intranet

Aplicación web full-stack para la gestión de centros de Formación Profesional (FP) en España. Gestiona usuarios (profesores, expertos, jefes de departamento, administradores), horarios, calendarios escolares, estudios FP (ciclos, módulos, resultados de aprendizaje), solicitudes y tareas con flujos de validación.

---

## 📋 Tabla de Contenidos

1. [Instalación y Configuración Local](#instalación-y-configuración-local)
2. [Procesos del Sistema](#procesos-del-sistema)
3. [Workflows](#workflows)
4. [Scripts Disponibles](#scripts-disponibles)
5. [Stack Tecnológico](#stack-tecnológico)

---

## 🚀 Instalación y Configuración Local

### Requisitos Previos

- **Node.js** >= 18.0.0
- **pnpm** >= 10.0.0
- **Git**
- Cuenta en [Neon.tech](https://neon.tech) (PostgreSQL serverless)

### 1. Descarga del Proyecto

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/CampusDigitalFP_Intranet.git
cd CampusDigitalFP_Intranet

# Instalar dependencias
pnpm install
```

### 2. Configuración de Base de Datos (Neon.tech)

1. **Crear cuenta en Neon.tech**
   - Regístrate en https://neon.tech
   - Crea un nuevo proyecto
   - Selecciona la región más cercana (recomendado: `Frankfurt` para Europa)

2. **Crear base de datos**
   - En el dashboard de Neon, crea una nueva base de datos llamada `campus_intranet`
   - O usa la base de datos por defecto `neondb`

3. **Obtener credenciales de conexión**
   - En Neon, ve a tu proyecto → "Connection String"
   - Selecciona el formato **Prisma**
   - Copia la URL de conexión (tendrá el formato `postgresql://user:pass@host.neon.tech/db?sslmode=require`)

### 3. Configuración de Variables de Entorno

```bash
# Copiar el archivo de configuración de ejemplo
cp conf.env .env
```

Edita el archivo `.env` con tus credenciales:

```env
# Base de datos (Neon.tech)
DATABASE_URL="postgresql://username:password@host.neon.tech/database?sslmode=require&pgbouncer=true&connect_timeout=10"
DIRECT_DATABASE_URL="postgresql://username:password@host.neon.tech/database?sslmode=require"

# Configuración de sesión (genera valores aleatorios seguros)
NUXT_SESSION_PASSWORD="tu-secreto-muy-seguro-de-al-menos-32-caracteres"

# Opcional: Configuración de Supabase (para almacenamiento de archivos)
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_KEY="tu-anon-key"
```

> **Nota:** Asegúrate de que `DATABASE_URL` incluya `pgbouncer=true` para compatibilidad con el pooler de Neon.

### 4. Inicialización de la Base de Datos

```bash
# Generar el cliente de Prisma
pnpm prisma:generate

# Ejecutar migraciones iniciales
pnpm prisma:migrate

# Cuando te pregunte por el nombre de la migración, introduce:
# init

# Sembrar datos iniciales (workflows, usuarios de prueba, etc.)
npx prisma db seed
```

### 5. Iniciar el Servidor de Desarrollo

```bash
# Modo desarrollo con hot reload
pnpm dev
```

La aplicación estará disponible en: http://localhost:3000

### 6. Acceso Inicial

Tras ejecutar el seed, puedes acceder con:

| Rol | Email | Contraseña |
|-----|-------|------------|
| ROOT | admin@campus.es | admin123 |
| ADMIN | jefe@campus.es | admin123 |
| PROFESOR | profesor@campus.es | profesor123 |

> **Importante:** Cambia estas contraseñas en producción.

---

## ⚙️ Procesos del Sistema

### Gestión de Usuarios

El sistema implementa un modelo RBAC (Role-Based Access Control) con 6 niveles:

| Rol | Código | Descripción |
|-----|--------|-------------|
| USER | `USER` | Usuario básico sin permisos especiales |
| PROFESOR | `PROFESOR` | Profesor del centro |
| EXPERTO | `EXPERTO` | Experto/Colaborador externo |
| JEFE_DEPT | `JEFE_DEPT` | Jefe de departamento (puede crear tareas) |
| ADMIN | `ADMIN` | Administrador (gestiona solicitudes, usuarios) |
| ROOT | `ROOT` | Superadministrador (acceso total) |

**Proceso de alta de usuarios:**
1. Formulario público de solicitud de nuevo usuario
2. Workflow de aprobación por administrador
3. Creación automática del usuario al aprobar

### Gestión de Horarios

- Los profesores configuran sus horarios semanales
- Validación por parte de administración
- Asignación a departamentos y ciclos formativos

### Gestión de Calendarios

- **Calendario escolar:** Define el curso académico
- **Calendario de libre disposición:** Gestiona días libres de profesores
  - Máximo 3 profesores por día
  - Límite de días por profesor (configurable, por defecto 4)
  - Solicitud con aprobación administrativa

### Gestión de Estudios FP

- **Ciclos Formativos:** CFGS, CFGM con familia profesional
- **Módulos:** Asociados a ciclos con horas y curso
- **Resultados de Aprendizaje (RAs):** Desglose de módulos
- **Criterios de Evaluación (CEs):** Evaluación de RAs

### Gestión de Solicitudes

Tipos de solicitudes soportadas:

| Tipo | Descripción | Workflow |
|------|-------------|----------|
| `FREE_DAY` | Día de libre disposición | Aprobación simple |
| `SICK_LEAVE` | Comunicación de bajas médicas | Multi-paso con documentación |
| `NEW_USER` | Alta de nuevo usuario | Aprobación + creación automática |
| `SCHEDULE_VALIDATION` | Validación de horario | Aprobación simple |
| `MEDICAL_APPOINTMENT` | Visita médica | - |
| `TRAINING` | Formación | - |

### Sistema de Archivos

- Soporte para documentos adjuntos en solicitudes
- Validación de documentos por administradores
- Integración con Supabase Storage (opcional)

---

## 🔄 Workflows

El sistema utiliza un **motor de workflows configurable** data-driven que permite definir flujos de aprobación sin modificar código.

### Workflows Configurados

#### 1. Alta de Nuevo Usuario (`request_new_user`)

```
[Pendiente de Validación] → [Aprobada - Usuario Creado]
                     ↓
              [Rechazada]
```

**Estados:**
- `pending`: Pendiente de validación (inicial)
- `approved`: Aprobada - Usuario creado (final)
- `rejected`: Rechazada (final, terminal)

**Transiciones:**
- `pending` → `approved`: Requiere rol ADMIN/ROOT y comentario
- `pending` → `rejected`: Requiere rol ADMIN/ROOT y comentario

**Acción automática:** Crear notificación al solicitante

#### 2. Día Libre Disposición (`request_free_day`)

```
[Pendiente] → [Aprobada]
        ↓        ↓
   [Rechazada] [Cancelada por usuario]
```

**Estados:**
- `pending`: Pendiente (inicial)
- `approved`: Aprobada (final)
- `rejected`: Rechazada (final, terminal)
- `cancelled_by_user`: Cancelada por el usuario (final, terminal)

**Transiciones:**
- `pending` → `approved`: Solo ADMIN/ROOT
- `pending` → `rejected`: Solo ADMIN/ROOT
- `pending` → `cancelled_by_user`: Usuario propietario
- `approved` → `cancelled_by_user`: Usuario propietario (elimina evento de calendario)

#### 3. Comunicación de Bajas (`request_sick_leave`)

```
[Pendiente de Notificación] → [Notificado] → [Esperando Documentación] → 
                                               ↓
                                    [Enviado a Validación] → [Validado]
                                                            ↓
                                                    [Pendiente de Docs]
                                                            ↓
                                                        [Rechazado]
```

**Estados:**
- `pending_notification`: Pendiente de notificación (inicial)
- `notified`: Notificado
- `pending_docs`: Esperando documentación
- `pending_validation`: Esperando validación
- `validated`: Validado (final)
- `rejected`: Rechazado (final, terminal)

**Transiciones:**
- `pending_notification` → `notified`: ADMIN/ROOT
- `notified` → `pending_docs`: ADMIN/ROOT o PROFESOR
- `pending_docs` → `pending_validation`: PROFESOR
- `pending_validation` → `validated`: ADMIN/ROOT (valida documentos)
- `pending_validation` → `pending_docs`: ADMIN/ROOT (solicita corrección)
- `pending_validation` → `rejected`: ADMIN/ROOT

### Mantenimiento de Workflows

#### Añadir un Nuevo Workflow

1. **Editar el archivo de configuración:**
   ```bash
   # prisma/seed/data/workflows.ts
   ```

2. **Añadir la definición del workflow:**
   ```typescript
   export const myNewWorkflow = {
     code: 'my_workflow_code',
     name: 'Nombre del Workflow',
     description: 'Descripción',
     entityType: 'REQUEST', // o 'TASK'
     version: 1,
     isActive: true,
     states: [
       { code: 'pending', name: 'Pendiente', color: 'amber', order: 1, isInitial: true },
       { code: 'approved', name: 'Aprobado', color: 'green', order: 2, isFinal: true }
     ],
     transitions: [
       { fromCode: 'pending', toCode: 'approved', allowedRoles: ['ADMIN'], requiresComment: true }
     ]
   }
   ```

3. **Actualizar la exportación:**
   ```typescript
   export const allWorkflows = [
     freeDayWorkflow,
     requestNewUserWorkflow,
     sickLeaveWorkflow,
     scheduleValidationWorkflow,
     myNewWorkflow // Añadir aquí
   ]
   ```

4. **Aplicar cambios en la base de datos:**
   ```bash
   # Si el workflow es nuevo, ejecutar seed
   npx prisma db seed
   
   # O recrear solo los workflows
   npx tsx prisma/seed/seeders/workflow.seeder.ts
   ```

#### Modificar un Workflow Existente

1. **Editar la configuración** en `prisma/seed/data/workflows.ts`

2. **Aumentar la versión** del workflow:
   ```typescript
   version: 2, // Incrementar versión
   ```

3. **Crear migración de datos** si es necesario:
   ```bash
   pnpm prisma:migrate
   ```

4. **Actualizar workflows en producción:**
   > ⚠️ **Precaución:** Los cambios en workflows activos pueden afectar solicitudes en curso.

#### Estructura de Estados

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `code` | string | Identificador único del estado |
| `name` | string | Nombre legible para mostrar |
| `color` | string | Color para UI (amber, green, red, blue, etc.) |
| `order` | number | Orden de aparición |
| `isInitial` | boolean | Estado inicial del workflow |
| `isFinal` | boolean | Estado terminal |
| `isTerminal` | boolean | Estado final sin salida |

#### Estructura de Transiciones

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `fromCode` | string | Estado origen |
| `toCode` | string | Estado destino |
| `allowedRoles` | string[] | Roles que pueden ejecutar la transición |
| `requiresComment` | boolean | Si requiere comentario obligatorio |
| `validatorCode` | string | Código de validación personalizada (opcional) |
| `autoActions` | string[] | Acciones automáticas al ejecutar |

#### Acciones Automáticas Disponibles

| Acción | Descripción |
|--------|-------------|
| `create_notification` | Crea notificación al usuario |
| `remove_calendar_event` | Elimina evento de calendario (usado en cancelaciones) |

---

## 📜 Scripts Disponibles

### Desarrollo

```bash
# Iniciar servidor de desarrollo
pnpm dev

# Construir para producción
pnpm build

# Vista previa de producción local
pnpm preview
```

### Base de Datos

```bash
# Generar cliente Prisma (tipos TypeScript)
pnpm prisma:generate

# Crear nueva migración
pnpm prisma:migrate

# Setup completo: migraciones + seed
pnpm prisma:setup
```

### Testing

```bash
# Ejecutar todos los tests
pnpm test

# Tests en modo watch
pnpm test:watch

# Tests con UI interactiva
pnpm test:ui

# Cobertura de código
pnpm test:coverage

# Solo tests de workflows (integración)
pnpm test:workflows

# Solo tests unitarios de workflows
pnpm test:workflows:unit
```

### Utilidades

```bash
# Post-install (genera tipos y prepara Nuxt)
pnpm postinstall

# Generar sitio estático
pnpm generate
```

---

## 🛠️ Stack Tecnológico

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
| PostgreSQL | 15+ | Base de datos relacional (Neon.tech) |
| Prisma | 7.3.0 | ORM y migraciones |
| @prisma/adapter-neon | 7.3.0 | Adapter para Neon PostgreSQL |

### UI/UX
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| Tailwind CSS | 4.1.17 | Framework CSS utilitario |
| shadcn-vue | 2.3.3 | Componentes accesibles |
| Reka UI | 2.6.1 | Componentes headless |
| Lucide Vue | 0.554.0 | Iconos |
| @schedule-x/vue | 4.0.0 | Calendario interactivo |

### Estado y Formularios
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| Pinia | 3.0.4 | Estado global |
| Vee-Validate | 4.15.1 | Validación de formularios |
| Zod | 3.25.76 | Validación de esquemas |

### Autenticación y Seguridad
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| nuxt-auth-utils | 0.5.25 | Sesiones y autenticación |
| bcrypt | 6.0.0 | Hash de contraseñas |
| nuxt-security | 2.4.0 | Headers de seguridad |

---

## 📁 Estructura del Proyecto

```
CampusDigitalFP_Intranet/
├── app/                          # Frontend Nuxt (Vue)
│   ├── assets/css/               # Tailwind CSS y estilos globales
│   ├── components/               # Componentes Vue
│   ├── composables/              # Composables de Vue
│   ├── layouts/                  # Layouts de Nuxt
│   ├── middleware/               # Middleware de rutas
│   ├── pages/                    # Páginas de la aplicación
│   └── types/                    # Tipos TypeScript
├── server/                       # Backend (Nitro/Nuxt Server)
│   ├── api/                      # Endpoints API REST
│   └── utils/                    # Utilidades del servidor
├── prisma/                       # Base de datos
│   ├── schema/                   # Esquemas Prisma
│   ├── migrations/               # Migraciones
│   └── seed/                     # Seeders
├── tests/                        # Tests (Vitest)
│   ├── integration/              # Tests de integración
│   └── unit/                     # Tests unitarios
├── .github/workflows/            # CI/CD GitHub Actions
├── lib/                          # Código compartido
├── plugins/                      # Plugins de Nuxt
└── public/                       # Assets estáticos
```

---

## 🐛 Solución de Problemas

### Error "Can't reach database"
Verificar que `DATABASE_URL` y `DIRECT_DATABASE_URL` estén correctamente configuradas en `.env`.

### Error de migraciones
```bash
# Resetear base de datos (¡cuidado, borra datos!)
npx prisma migrate reset

# O forzar migración
npx prisma migrate deploy
```

### Error "useHead is not defined"
Asegúrate de ejecutar `pnpm postinstall` tras instalar dependencias.

---

## 📄 Licencia

[LICENSE](./LICENSE)

---

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

---

Para más información detallada sobre el desarrollo, consulta el archivo [AGENTS.md](./AGENTS.md).
