# CHECKLIST - Gestión de Calendarios

Basado en `gestion-calendarios.md`

## Requisitos y Estado

| # | Requisito | Estado | Detalles |
|---|-----------|--------|----------|
| 1 | Solo admin/root pueden acceder a gestión de calendarios | ✅ **CUMPLE** | Middleware en páginas + validación en APIs |
| 2 | Calendarios: 1 septiembre - 31 julio (curso académico) | ✅ **CUMPLE** | Validación estricta en backend (POST/PUT). Seed actualizado a 31 julio |
| 3 | Admin pueden crear calendarios como templates/plantillas | ✅ **CUMPLE** | Tipo TEMPLATE implementado en schema y APIs |
| 4 | Vista grid de meses y años del curso académico | ✅ **CUMPLE** | Nueva página `/admin/calendarios/[id]/dias` con grid de meses |
| 5 | Fines de semana por defecto como no laborables | ✅ **CUMPLE** | Visualización en gris y no seleccionables en el grid |
| 6 | Selección múltiple de días para marcar como festivos | ✅ **CUMPLE** | Botón "Marcar festivos" con selección múltiple + drag |
| 7 | Selección múltiple de días para periodo de exámenes (con tipo) | ✅ **CUMPLE** | Modal con campo para tipo de evaluación (DAM/DAW, etc.) |
| 8 | Toggle para activar/desactivar calendario | ✅ **CUMPLE** | Switch en tabla con validación de único calendario libre disposición activo |
| 9 | Crear calendarios "días de libre disposición" desde plantillas | ✅ **CUMPLE** | Implementado con `/api/calendars/templates/[id]/clone` |
| 10 | Solo un calendario de libre disposición activo a la vez | ✅ **CUMPLE** | Validación en POST/PUT que evita activar si ya existe otro |

## Resumen
- ✅ **CUMPLE**: 10/10 (100%)
- ⚠️ **PARCIAL**: 0/10 (0%)
- ❌ **NO CUMPLE**: 0/10 (0%)

## Archivos Implementados/Modificados

### Backend
- `prisma/schema/calendars.prisma` - Añadido tipo TEMPLATE
- `server/api/calendars/index.post.ts` - Validación período curso + único libre disposición activo
- `server/api/calendars/[id].put.ts` - Validación período curso + único libre disposición activo
- `server/api/calendars/templates/index.get.ts` - Listar plantillas
- `server/api/calendars/templates/[id]/clone.post.ts` - Clonar desde plantilla
- `server/api/calendars/[id]/events/index.post.ts` - Crear eventos (movido)
- `server/api/calendars/[id]/events/[eventId].delete.ts` - Eliminar evento

### Frontend
- `app/pages/admin/calendarios/index.vue` - Toggle activo/inactivo + botón editar días
- `app/pages/admin/calendarios/[id]/dias.vue` - Grid de selección múltiple (NUEVO)

### Seed
- `prisma/seed/data/calendars-free-disposition.ts` - Fechas actualizadas a 31 julio
- `prisma/seed/data/calendars.ts` - Fechas actualizadas a 31 julio
