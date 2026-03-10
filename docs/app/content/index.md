---
title: 'Documentación'
navigation: false
---

# Intranet Campus Digital FP

Documentación completa, referencias de API y guías para desarrolladores del sistema de gestión de FP.

## ¿Qué encontrarás aquí?

- **Guías de inicio**: Configura tu entorno y empieza a desarrollar
- **Referencia API**: Documentación completa de endpoints
- **Arquitectura**: Entiende la estructura del proyecto
- **Workflows**: Aprende sobre el sistema de workflows configurable

## Empezar rápidamente

```bash
# Clonar el repositorio
git clone <repo-url>

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp conf.env .env

# Configurar base de datos
pnpm prisma:setup

# Iniciar servidor
pnpm dev
```

## Estructura del proyecto

```
CampusDigitalFP_Intranet/
├── app/              # Frontend Nuxt
├── server/           # Backend Nitro
├── docs/            # Documentación (este proyecto)
└── prisma/          # Esquema de base de datos
```

## Enlaces rápidos

- [Introducción](/introduccion)
- [Instalación](/instalacion)
- [Arquitectura](/arquitectura)
- [Referencia API](/api)
- [Workflows](/workflows)
