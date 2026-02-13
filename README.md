# Campus Digital FP - Intranet

## ¿Qué necesito en un MVP?
* Interfaz con sidebar y una landingpage
* Prisma para Conexión con base de datos
* Login con Google
* Solicitudes
* Tipos de usuarios:
  * Profesor - Tiene clases, horario
  * Jefe de Departamento - 
  * Root
  * Administracion - No tiene clases, el horario viene fijado
  * Jefatura
* Modelos
  * DEPARTAMENTO - tiene un - JEFE DEPARTAMENTO
  * JEFE DEPARTAMENTO - es un - PROFESOR
  * DEPARTAMENTO - tiene 1 o N - PROFESOR
  * Un PROFESOR - pertenece 1 o N - DEPARTAMENTO
* Calendario del docente
  * JdD: quiero poder generar la plantilla de horarios.
  * JdD: quiero poder asignar módulos a cada profesor.
  * P: quiero poder crear mi horario en base a la plantilla.  
* Tareas
  * JdD: quiero poder asignar tareas a los profesores.
  * JdD: quiero poder crear tareas de tipo (template).
* Solicitudes
  * P: quiero poder hacer solicitudes varias que conllevan múltiples pasos.

### VISTAS
* Vista Landing (Blog de noticias)
* Vista Dashboard - USUARIO
  * Horario si PROFESOR
  * Tareas
  * Noticias