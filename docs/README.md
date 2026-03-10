# Documentación Campus Digital FP

Proyecto de documentación independiente usando **Nuxt 4 + Content v3 + @nuxt/ui**.

## Stack

- **Nuxt 4** - Framework full-stack
- **Content v3** - Gestión de contenido Markdown
- **@nuxt/ui** - Componentes UI (reemplaza a Docus)
- **Tailwind CSS** - Estilos

## Estructura

```
docs/
├── app/
│   ├── components/
│   │   └── DocsNavigation.vue    # Navegación lateral
│   ├── content/                   # Contenido Markdown
│   │   ├── index.md              # Landing page
│   │   ├── introduccion.md
│   │   ├── instalacion.md
│   │   ├── arquitectura.md
│   │   ├── api.md
│   │   └── workflows.md
│   ├── layouts/
│   │   └── default.vue           # Layout con sidebar
│   ├── pages/
│   │   ├── index.vue             # Home con tarjetas
│   │   └── [...slug].vue         # Página de contenido
│   └── assets/css/
│       └── main.css              # Estilos + Prose
├── nuxt.config.ts
└── package.json
```

## Comandos

```bash
# Instalar dependencias
pnpm install

# Desarrollo (puerto 3001)
pnpm dev

# Build
pnpm build

# Generar estático
pnpm generate
```

## Acceso

- Desarrollo: http://localhost:3001

## Desde la raíz del proyecto

```bash
# Solo docs
pnpm dev:docs

# App + Docs simultáneamente
pnpm dev:all
```

## Características

- ✅ Layout con sidebar responsivo
- ✅ Navegación automática desde contenido
- ✅ Breadcrumbs
- ✅ Prev/Next navigation
- ✅ Prose styles para markdown
- ✅ Dark mode integrado
- ✅ Código con syntax highlighting
