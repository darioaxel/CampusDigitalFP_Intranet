# Implementación: Solicitud de Alta de Usuario (Self-Registration)

## 1. Resumen Ejecutivo

**Objetivo**: Permitir a usuarios externos solicitar acceso al sistema generando una `Request` de tipo `SOLICITUD_ALTA` que fluye hacia el equipo administrativo para su revisión y aprobación.

**Flujo General**:
1. Usuario externo accede a `/usuario/alta-usuario` (página pública)
2. Completa formulario con datos personales + documentación
3. Se crea `Request` (SOLICITUD_ALTA) + `Task` para ADMIN
4. Admin revisa en dashboard y Acepta/Rechaza
5. Si se aprueba: se crea el `User` real y se notifica al solicitante

---