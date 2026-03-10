---
title: 'Introducción'
icon: 'i-lucide-book-open'
description: 'Bienvenido a la documentación de Campus Digital FP'
---

# Bienvenido

Esta es la documentación oficial de la **Intranet del Campus Digital FP**. Aquí encontrarás guías, referencias de API y recursos para desarrolladores.

## ¿Qué es Campus Digital FP?

Es una aplicación web full-stack desarrollada como intranet para centros de Formación Profesional (FP) en España. Gestiona:

- **Usuarios**: Profesores, expertos, jefes de departamento, administradores
- **Horarios**: Gestión de horarios de profesores
- **Calendarios**: Calendarios escolares y eventos
- **Estudios**: Ciclos formativos, módulos, resultados de aprendizaje
- **Solicitudes**: Bajas, días de libre disposición con flujos de validación
- **Tareas**: Asignaciones y votaciones

## Stack tecnológico

| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| Nuxt | 4.2.1 | Framework Vue full-stack |
| Vue | 3.5.24 | Framework UI reactivo |
| TypeScript | 5.1 | Tipado estático |
| PostgreSQL | - | Base de datos relacional |
| Prisma | 7.3.0 | ORM y migraciones |
| Tailwind CSS | 4.1.17 | Framework CSS utilitario |

## Empezar rápidamente

```bash
# Clonar
git clone <repo-url>
cd CampusDigitalFP_Intranet

# Instalar
pnpm install

# Configurar
cp conf.env .env
# Editar .env con tus credenciales
pnpm prisma:setup

# Desarrollo
pnpm dev
```

## Estructura del proyecto

```
CampusDigitalFP_Intranet/
├── app/              # Frontend Nuxt
├── server/           # Backend Nitro
├── prisma/          # Esquema de base de datos
├── docs/            # Documentación (este sitio)
└── tests/           # Tests
```

## Contribuir

Si encuentras errores o quieres mejorar la documentación, por favor crea un pull request en el repositorio.
