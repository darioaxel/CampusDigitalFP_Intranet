---
title: 'Referencia API'
icon: 'i-lucide-code'
description: 'Documentación completa de la API REST'
---

# Referencia API

Documentación de los endpoints de la API REST de la Intranet Campus Digital FP.

## Autenticación

La API usa sesiones basadas en cookies HTTP-only. Todas las rutas protegidas requieren una sesión válida.

### Verificar sesión

```http
GET /api/auth/session
```

Respuesta:
```json
{
  "user": {
    "id": "...",
    "email": "...",
    "role": "ADMIN"
  }
}
```

## Usuarios

### Obtener usuarios

```http
GET /api/users
```

Query params:
- `role` - Filtrar por rol
- `search` - Búsqueda por nombre/email

### Crear usuario

```http
POST /api/users
```

Body:
```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "role": "PROFESOR"
}
```

## Solicitudes (Requests)

### Listar solicitudes

```http
GET /api/requests
```

Query params:
- `type` - Tipo: `SICK_LEAVE`, `FREE_DAY`
- `status` - Estado actual
- `include` - Incluir datos relacionados: `all`

### Crear solicitud

```http
POST /api/requests
```

Body:
```json
{
  "title": "Baja médica",
  "description": "...",
  "workflowCode": "request_sick_leave",
  "type": "SICK_LEAVE",
  "startDate": "2026-03-10",
  "endDate": "2026-03-15"
}
```

## Workflows

### Obtener transiciones disponibles

```http
GET /api/requests/:id/transitions
```

### Ejecutar transición

```http
POST /api/requests/:id/transition
```

Body:
```json
{
  "toState": "validated",
  "comment": "Documentación correcta"
}
```

## Calendario de Ausencias

### Obtener ausencias

```http
GET /api/admin/ausencias
```

Query params:
- `startDate` - Fecha inicio (YYYY-MM-DD)
- `endDate` - Fecha fin (YYYY-MM-DD)

Respuesta:
```json
{
  "success": true,
  "data": {
    "startDate": "2026-03-01",
    "endDate": "2026-03-31",
    "totalAbsences": 10,
    "absencesByDate": {
      "2026-03-10": [
        {
          "id": "...",
          "type": "SICK_LEAVE",
          "typeLabel": "Baja Médica",
          "firstName": "Juan",
          "lastName": "Pérez",
          "date": "2026-03-10"
        }
      ]
    }
  }
}
```

## Códigos de estado

| Código | Descripción |
|--------|-------------|
| 200 | OK |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

## Errores comunes

### 401 - No autenticado

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Solución**: Iniciar sesión antes de hacer la petición.

### 403 - Sin permisos

```json
{
  "statusCode": 403,
  "message": "No tienes permisos para acceder a este recurso"
}
```

**Solución**: Verificar que el usuario tiene el rol necesario.

### 404 - No encontrado

```json
{
  "statusCode": 404,
  "message": "Recurso no encontrado"
}
```

**Solución**: Verificar el ID del recurso.
