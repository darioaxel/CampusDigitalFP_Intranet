# GESTIÓN SOLICITUD DÍAS LIBRE DISPOSICIÓN

* Cada profesor dispone de 4 días de libre disposición a lo largo del curso.
* A principio de curso admin crea un calendario para esta tarea, por ejemplo: "dias libre disposición 2025/2026". 
* En él se mostrarán todos los días en los que se pueden solicitar, el resto aparecerá como no disponible. 
* El calendario de dias de libre disposición se puede crear desde 0 o desde una plantilla ya creada.
* Este calendario será mostrado en la vista libre-dispocion.vue de todos los profesores.
* En cada celda del calendario de los días en los que se puede solicitar la ausencia, se verá el número de solicitudes ya aprobadas para esa fecha, siendo 0 si no hay ninguna y 3 el máximo que lo inhabilita para más solicitudes. Si en un día hay 3 solicitudes ya aprobadas, la celda del calendario se pinta de color rojo.
* Cuando un profesor solicita un día de libre disposición desde la vista, ese día queda marcado en su vista como pendiente, se genera una solicitud que irá al administrador (esta solicitud también aparecerá en la lista de tareas del profesor) como pendiente de validar.
* Un administrador puede aprobar la solicitud directamente desde la lista de tareas, pasando a estado aceptada o puede pulsar sobre *ver solicitud* que abrirá un dialog con: nombre y apellidos del profesor, número de días que tiene solicidados y aprobados, número de profesores que tienen ya aprobado el mismo días como día de libre disposición. Aparecerán también los botones de aprobar, denegar y un cuadro de texto para incluir una observación que quedará registrada en la solicitud.