# Implementación: Solicitud de Alta de Usuario (Self-Registration)

## 1. Resumen Ejecutivo

**Objetivo**: Permitir a usuarios externos solicitar acceso al sistema generando una `Request` de tipo `NEW_USER` que fluye hacia el equipo administrativo para su revisión y aprobación.

**Flujo General**:
1. Usuario externo accede a `/usuario/alta-usuario` (página pública)
2. Completa formulario con datos personales + contraseña
3. Se crea `Request` con workflow `request_new_user` (estado `pending`)
4. Admin revisa en `/admin/solicitudes/{id}` y Aprueba/Rechaza
5. Si se aprueba: se crea el `User` automáticamente y se notifica

---

## 2. Workflow Configurable

El sistema usa el workflow `request_new_user` definido en `prisma/seed/seeders/workflow.seeder.ts`.

### Estados

| Código | Nombre | Descripción |
|--------|--------|-------------|
| `pending` | Pendiente de Validación | Estado inicial cuando se crea la solicitud |
| `approved` | Aprobada - Usuario Creado | Estado final exitoso (usuario creado) |
| `rejected` | Rechazada | Estado final negativo |

### Transiciones

| Desde | Hacia | Roles Permitidos | Acción Automática |
|-------|-------|-----------------|-------------------|
| `pending` | `approved` | ADMIN, ROOT | `create_notification` |
| `pending` | `rejected` | ADMIN, ROOT | `create_notification` |

---

## 3. Componentes del Sistema

### Frontend

#### Formulario Público (`/app/pages/usuario/alta-usuario.vue`)
- **Ruta**: `/usuario/alta-usuario`
- **Acceso**: Público (`auth: false`)
- **Validaciones**: DNI español, email, teléfono, contraseña segura
- **Payload**: Envía tipo `NEW_USER` con datos del usuario a crear

#### Panel Admin (`/app/pages/admin/solicitudes/[id].vue`)
- **Ruta**: `/admin/solicitudes/{id}`
- **Funcionalidad**: 
  - Muestra datos del solicitante desde el contexto
  - Permite seleccionar rol del nuevo usuario (PROFESOR, EXPERTO, etc.)
  - Ejecuta transiciones de workflow (aprobar/rechazar)

### Backend

#### Crear Solicitud (`/server/api/requests/index.post.ts`)
- Acepta solicitudes públicas de tipo `NEW_USER`
- Verifica que el email no exista ya
- Crea la solicitud con el workflow `request_new_user`
- Guarda los datos del usuario en el campo `context` como JSON

#### Transición (`/server/api/requests/[id]/transition.post.ts`)
- Al aprobar (`toState === 'approved'` y `type === 'NEW_USER'`):
  - Crea el usuario con `prisma.user.create()`
  - Hashea la contraseña con `bcrypt`
  - Usa el rol seleccionado por el admin (del metadata)

#### Detalle Solicitud (`/server/api/requests/[id]/index.get.ts`)
- Enriquece la respuesta para solicitudes `NEW_USER`
- Incluye `newUserData`, `requesterInfo`, `additionalInfo` parseados del contexto

#### Listado Admin (`/server/api/user/workflow-items.get.ts`)
- Incluye solicitudes públicas (`NEW_USER`) en el listado de pendientes para admin
- Filtra por `context` que contiene `"type":"NEW_USER"`

---

## 4. Estructura de Datos

### Contexto de la Solicitud

```typescript
// Guardado en Request.context (JSON stringificado)
{
  type: "NEW_USER",
  requester: {
    name: string,      // Nombre del referente/solicitante
    email: string,     // Email de contacto
    phone?: string     // Teléfono de contacto
  },
  userData: {
    firstName: string,
    lastName: string,
    email: string,           // Email institucional (login)
    dni?: string,
    phone?: string,
    password: string,        // Contraseña en texto plano (se hashea al crear usuario)
    birthDate?: string,
    emailPersonal?: string
  },
  department?: string,       // Departamento (si aplica)
  specialty?: string,        // Especialidad (si aplica)
  experience?: string        // Experiencia (si aplica)
}
```

### Creación de Usuario

Cuando un admin aprueba la solicitud:

```typescript
// En transition.post.ts
if (toState === 'approved' && requestType === 'NEW_USER') {
  const userData = requestContext.userData
  
  createdUser = await prisma.user.create({
    data: {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      dni: userData.dni,
      phone: userData.phone,
      role: metadata?.role || 'PROFESOR',  // Rol seleccionado por admin
      passwordHash: await bcrypt.hash(userData.password, 10),
      isActive: true,
      emailPersonal: userData.emailPersonal,
    }
  })
}
```

---

## 5. Permisos

| Acción | Roles Permitidos |
|--------|------------------|
| Ver formulario | Público (sin autenticación) |
| Crear solicitud | Público (tipo `NEW_USER` solo) |
| Ver listado solicitudes | ADMIN, ROOT |
| Aprobar/Rechazar solicitud | ADMIN, ROOT |
| Seleccionar rol del nuevo usuario | ADMIN, ROOT |

---

## 6. Notas de Implementación

1. **Contraseña**: El usuario define su contraseña en el formulario inicial. El admin no necesita establecerla.

2. **Email duplicado**: El sistema verifica que el email institucional no exista antes de crear la solicitud.

3. **Solicitante**: Como es un formulario público, el `requesterId` se asigna a un admin placeholder o al primer admin encontrado.

4. **Notificaciones**: Al aprobar/rechazar se generan notificaciones automáticas vía `WorkflowNotification`.

5. **Rol del usuario**: El admin puede seleccionar el rol del nuevo usuario en el momento de aprobar (PROFESOR, EXPERTO, JEFE_DEPT, ADMIN).

---

## 7. Testing Manual

1. Acceder a `/usuario/alta-usuario` (sin estar logueado)
2. Completar formulario con datos válidos
3. Verificar que la solicitud aparece en `/admin` (pestaña "Activas/Pendientes")
4. Click en la solicitud para ver detalle
5. Verificar datos del nuevo usuario en la tarjeta lateral
6. Seleccionar rol y aprobar
7. Verificar que el usuario se crea correctamente intentando login
