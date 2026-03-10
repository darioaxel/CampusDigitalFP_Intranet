---
title: 'Instalación'
icon: 'i-lucide-download'
description: 'Configura tu entorno de desarrollo'
---

# Instalación

Guía completa para configurar el entorno de desarrollo de la Intranet Campus Digital FP.

## Requisitos previos

- **Node.js** 20.x o superior
- **pnpm** 10.x 
- **PostgreSQL** 14+ (o usar [Neon](https://neon.tech) para desarrollo)
- **Git**

## Paso 1: Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd CampusDigitalFP_Intranet
```

## Paso 2: Instalar dependencias

```bash
pnpm install
```

Esto instalará todas las dependencias del proyecto principal y del workspace de documentación.

## Paso 3: Configurar variables de entorno

Copia el archivo de configuración de ejemplo:

```bash
cp conf.env .env
```

Edita `.env` con tus credenciales de base de datos:

```env
DATABASE_URL="postgresql://user:pass@host/db?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://user:pass@host/db"
```

### Usando Neon (recomendado para desarrollo)

1. Crea una cuenta en [neon.tech](https://neon.tech)
2. Crea un nuevo proyecto
3. Copia la connection string desde el dashboard
4. Pégala en tu archivo `.env`

## Paso 4: Configurar la base de datos

### Generar cliente Prisma

```bash
pnpm prisma:generate
```

### Ejecutar migraciones

```bash
pnpm prisma:migrate
```

### Cargar datos iniciales (seed)

```bash
pnpm prisma:setup
```

Esto creará:
- Usuarios de ejemplo (admin, profesores)
- Workflows configurables
- Calendarios escolares base

## Paso 5: Iniciar el servidor

```bash
pnpm dev
```

La aplicación estará disponible en:
- **App principal**: http://localhost:3000
- **Documentación**: http://localhost:3001 (si está en ejecución)

## Verificación

Abre http://localhost:3000 y deberías ver la página de login. Los usuarios de seed son:

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@campus.es | admin123 | ADMIN |
| profesor@campus.es | prof123 | PROFESOR |

## Solución de problemas

### Error: "Can't reach database"

Verifica que:
1. La base de datos está corriendo
2. Las credenciales en `.env` son correctas
3. Tu IP tiene acceso (si usas Neon/Supabase)

### Error de tipos de Prisma

```bash
pnpm prisma:generate
```

### Limpiar todo y empezar de nuevo

```bash
rm -rf node_modules .nuxt
pnpm install
pnpm prisma:generate
```

## Siguientes pasos

- [Arquitectura](/arquitectura) - Conoce la estructura del proyecto
- [Workflows](/workflows) - Aprende sobre el sistema de workflows
- [API](/api) - Referencia de la API REST
