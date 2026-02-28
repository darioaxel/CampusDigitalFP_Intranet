a) Veinte días por razón de matrimonio o inscripción en el registro de parejas estables no
casadas.
b) Dos días en caso de **divorcio, separación legal o nulidad**.
c) Hasta seis días por **fallecimiento de cónyuge o de familiar en primer grado** y hasta
cuatro por **fallecimiento de pariente hasta el segundo grado**, por consanguinidad o afinidad.
d) Cinco días, no necesariamente ininterrumpidos, por **enfermedad grave, intervención
quirúrgica o ingreso hospitalario del cónyuge, pareja de hecho o persona con quien se
conviva maritalmente, hijos, padres y hermanos**; que se utilizará durante el proceso
terapéutico del que trae causa y debidamente justificado.
Para el resto de **parientes hasta el primer grado de afinidad**, tres días o cinco días de
permiso si el suceso se produce en distinta localidad.
Para el resto de **parientes hasta el segundo grado de consanguinidad** o afinidad, el
personal docente tendrá derecho a dos días o cuatro días si el suceso se produce en
distinta localidad.
Estos permisos serán compatibles con la reducción de jornada por cónyuge o familiar
en primer grado de consanguinidad o afinidad por razón de enfermedad muy grave,
contenido en el artículo 7.b) de la presente Orden. Esta reducción de jornada se verá
minorada en su caso, en el equivalente a los días utilizados en este permiso retribuido.
e) Un día en caso de **matrimonio de cualquier pariente hasta tercer grado** de consanguinidad o
segundo de afinidad. Por causa debidamente justificada el permiso será de dos días.
f) Por el tiempo indispensable para el cumplimiento de un deber inexcusable de carácter
público o personal.
g) Un día por **traslado de domicilio** y por causas debidamente justificadas hasta tres días.
h) Para concurrir a **exámenes** finales y demás pruebas definitivas de aptitud y evaluación
en centros oficiales, durante los días de su celebración.
i) Se tendrá derecho a ausentarse del lugar de trabajo un máximo de dos horas diarias
no lectivas en caso de **nacimiento de hijos prematuros** o en los casos en que, por cualquier motivo, éstos deban permanecer hospitalizados a continuación del parto.
Excepcionalmente podrá concederse el disfrute de este permiso en horario lectivo,
cuando quede acreditada y justificada la coincidencia del horario de visitas hospitalarias con el horario lectivo.
j) Para recibir **atención médica y para someterse a técnicas de fecundación asistida**,
previa justificación de su realización dentro de su jornada de trabajo.
k) Para asistir a las **clases de preparación al parto y para la realización de exámenes prenatales**:
Las empleadas públicas docentes tendrán derecho a ausentarse del trabajo para asistir
a las clases de preparación al parto y para la realización de exámenes prenatales por
el tiempo necesario para su realización y con justificación debidamente acreditada.
En los casos de adopción o acogimiento o guarda con fines de adopción, para la asistencia a las preceptivas sesiones de información y preparación y para la realización de
los preceptivos informes psicológicos y sociales previos a la declaración de idoneidad,
que deban realizarse dentro de la jornada de trabajo.
l) Para **acompañar a visita médica a hijos o hijas menores de dieciocho años** o, siendo
mayores, cuando lo exija el tratamiento y al cónyuge o parientes dentro del primer
grado de consanguinidad o afinidad que no puedan valerse por sí mismos por razón de
edad o enfermedad, por el tiempo necesario con la debida justificación.
m) Para asistir a las **reuniones de los órganos de coordinación de los centros de educación especial donde el hijo o hija con discapacidad** reciba atención, por el tiempo necesario
con justificación previa y debidamente acreditada.
n) Para asistir a las reuniones de coordinación del centro educativo donde el hijo o hija
recibe atención temprana, por el tiempo necesario con justificación previa y debidamente acreditado.
ñ) Para asistir a las tutorías del hijo o hija en el centro educativo con un máximo de tres
tutorías por hijo en un curso escolar, por el tiempo necesario con justificación previa y
debidamente acreditada.
o) Para asistir a un máximo de tres **exámenes prenatales** para el progenitor diferente de
la madre biológica, siempre que no puedan realizarse fuera del horario lectivo, durante
el tiempo necesario con justificación previa y debidamente acreditada.
Los permisos enumerados en este artículo se entenderán referidos a días laborables,
excluidos los sábados, requiriéndose en todo caso que el hecho causante se produzca
o tenga sus efectos durante el periodo de disfrute de aquél.

He implementado el sistema completo de comunicación de bajas. Aquí tienes un resumen de lo que se ha creado:

Resumen de Implementación
1. Workflow de Comunicación de Bajas (prisma/seed/data/workflows.ts)
Estados: pending_notification → notified → pending_docs → pending_validation → validated/rejected
Transiciones configuradas según el flujo solicitado
2. Vistas del Profesor
/app/pages/usuario/solicitudes/comunicar-baja.vue
Calendario para seleccionar fechas (modo individual o rango)
Selector de tipo de baja (Médica, Maternidad, Accidente, etc.)
Listado de solicitudes del profesor con estados
Modal para subir documentos PDF cuando está en estado pending_docs
3. Vistas de Administración
/app/pages/admin/solicitudes/bajas.vue
Dashboard con estadísticas de solicitudes por estado
Filtros por estado y búsqueda
Vista detallada con historial de estados
Descarga de documentos adjuntos
Acciones: Aceptar notificación, Validar, Devolver para corrección, Rechazar
4. Componentes
/app/components/requests/DocumentUploader.vue
Subida drag & drop de PDFs
Soporte para múltiples archivos
Reemplazo de documentos inválidos
5. API Endpoints
POST /api/requests - Crear solicitud con workflowCode y context
GET /api/requests/my-requests?type=SICK_LEAVE - Listar solicitudes del usuario
GET /api/requests?type=SICK_LEAVE - Listar todas (admin)
POST /api/requests/[id]/documents - Subir documentos (multipart/form-data)
GET /api/documents/[id]/download - Descargar documento
POST /api/requests/[id]/transition - Ejecutar transiciones de workflow
6. Configuración de Navegación (app/lib/config.ts)
Enlace a "Comunicación de Bajas" en menú de profesor
Enlace a "Gestión de Bajas" en menú de administración
Flujo de Trabajo
Profesor crea solicitud seleccionando fechas y tipo → Estado: pending_notification
Admin acepta notificación → Estado: notified → Automáticamente pasa a pending_docs
Profesor sube documentos PDF y solicita validación → Estado: pending_validation
Admin revisa documentos:
Si correcto: Valida → Estado: validated
Si incorrecto: Devuelve con mensaje → Estado: pending_docs (vuelve al paso 3)
Profesor puede reemplazar documentos y volver a solicitar validación
Para probar el sistema:

pnpm prisma:migrate  # Aplicar migraciones si es necesario
pnpm prisma:setup    # Ejecutar seeders con el nuevo workflow
pnpm dev             # Iniciar servidor