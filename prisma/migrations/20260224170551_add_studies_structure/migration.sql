-- CreateEnum
CREATE TYPE "CalendarType" AS ENUM ('SCHOOL_YEAR', 'EVALUATION', 'FREE_DISPOSITION', 'MEETINGS', 'OTHER');

-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('HOLIDAY', 'LECTIVE', 'EVALUATION', 'FREE_DISPOSITION', 'MEETING', 'DEADLINE', 'OTHER');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'PROFESOR', 'EXPERTO', 'JEFE_DEPT', 'ADMIN', 'ROOT');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('NORMAL', 'EXAMENES', 'EXTRAORDINARIO');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- CreateEnum
CREATE TYPE "NivelFP" AS ENUM ('GRADO_MEDIO', 'GRADO_SUPERIOR', 'FP_BASICA');

-- CreateEnum
CREATE TYPE "FamiliaProfesional" AS ENUM ('INFORMATICA_COMUNICACIONES', 'ADMINISTRACION_GESTION', 'COMERCIO_MARKETING', 'ELECTRICIDAD_ELECTRONICA', 'MECANICA', 'SANIDAD', 'SERVICIOS_SOCIOCULTURALES', 'TRANSPORTE_LOGISTICA', 'HOSTELERIA_TURISMO', 'IMAGEN_PERSONAL', 'IMAGEN_SONIDO', 'INDUSTRIAS_ALIMENTARIAS', 'INSTALACION_MANTENIMIENTO', 'MADERA_MUEBLE_CORK', 'QUIMICA', 'SEGURIDAD_MEDIOAMBIENTE', 'TEXTIL_CONFECCION_PIEL', 'VIDRIO_CERAMICA', 'ARTES_PLASTICAS_DISENO', 'ARTES_ESCENICAS_MUSICA', 'DEPORTES_ACTIVIDADES_FISICAS', 'MARITIMO_PESQUERA', 'MANTENIMIENTO_SERVICIOS');

-- CreateEnum
CREATE TYPE "TipoRecurso" AS ENUM ('DOCUMENTO', 'PRESENTACION', 'VIDEO', 'ENLACE_WEB', 'EJERCICIO', 'PROYECTO', 'LECTURA', 'CODIGO', 'OTRO');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMMUNICATED', 'CLOSED', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('FREE_DAY', 'MEDICAL_APPOINTMENT', 'LEAVE', 'TRAINING', 'OTHER', 'SCHEDULE_VALIDATION');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('SYLLABUS_CREATION', 'MEETING', 'VOTE', 'REVIEW', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'SUBMITTED', 'VALID', 'INVALID', 'REPLACED');

-- CreateTable
CREATE TABLE "Calendar" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CalendarType" NOT NULL,
    "academicYear" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "allowDragDrop" BOOLEAN NOT NULL DEFAULT false,
    "maxEventsPerUser" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "CalendarEventType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isAllDay" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT,
    "endTime" TEXT,
    "color" TEXT,
    "maxAssignments" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCalendarEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "type" "ScheduleType" NOT NULL DEFAULT 'NORMAL',
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "color" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "validationStatus" TEXT NOT NULL DEFAULT 'BORRADOR',
    "userId" TEXT NOT NULL,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleBlock" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "room" TEXT,
    "subject" TEXT,
    "isBreak" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CicloFormativo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nivel" "NivelFP" NOT NULL,
    "familia" "FamiliaProfesional" NOT NULL,
    "horasTotales" INTEGER NOT NULL,
    "duracion" TEXT NOT NULL,
    "cursoAcademico" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CicloFormativo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuloProfesional" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "siglas" TEXT,
    "horasTotales" INTEGER NOT NULL,
    "horasAnuales" INTEGER,
    "curso" INTEGER NOT NULL,
    "cicloId" TEXT NOT NULL,
    "docenteId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuloProfesional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultadoAprendizaje" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "duracion" TEXT,
    "moduloId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResultadoAprendizaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriterioEvaluacion" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "nivel" TEXT,
    "raId" TEXT NOT NULL,
    "instrumentos" TEXT[],
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriterioEvaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tema" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "duracion" TEXT,
    "moduloId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContenidoTema" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "temaId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContenidoTema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecursoTema" (
    "id" TEXT NOT NULL,
    "tipo" "TipoRecurso" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "url" TEXT,
    "archivoId" TEXT,
    "temaId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecursoTema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "floorDoor" TEXT,
    "postalCode" TEXT NOT NULL,
    "locality" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailPersonal" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "dni" TEXT,
    "birthDate" TIMESTAMP(3),
    "picture" TEXT,
    "passwordHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deactivatedAt" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "provider" TEXT NOT NULL DEFAULT 'local',
    "providerId" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "type" "RequestType" NOT NULL,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requestedDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "adminId" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestDocument" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "fileId" TEXT NOT NULL,
    "notes" TEXT,
    "replacedById" TEXT,
    "validatedById" TEXT,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'TODO',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "votingEndsAt" TIMESTAMP(3),
    "votingOptions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'TODO',
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "option" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "requestId" TEXT,
    "taskId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TemaResultados" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TemaResultados_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Calendar_type_academicYear_idx" ON "Calendar"("type", "academicYear");

-- CreateIndex
CREATE INDEX "Calendar_isActive_idx" ON "Calendar"("isActive");

-- CreateIndex
CREATE INDEX "Calendar_createdById_idx" ON "Calendar"("createdById");

-- CreateIndex
CREATE INDEX "CalendarEvent_calendarId_startDate_idx" ON "CalendarEvent"("calendarId", "startDate");

-- CreateIndex
CREATE INDEX "CalendarEvent_type_idx" ON "CalendarEvent"("type");

-- CreateIndex
CREATE INDEX "CalendarEvent_isActive_idx" ON "CalendarEvent"("isActive");

-- CreateIndex
CREATE INDEX "UserCalendarEvent_userId_status_idx" ON "UserCalendarEvent"("userId", "status");

-- CreateIndex
CREATE INDEX "UserCalendarEvent_eventId_idx" ON "UserCalendarEvent"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCalendarEvent_eventId_userId_key" ON "UserCalendarEvent"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "files_path_key" ON "files"("path");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_requestId_key" ON "Schedule"("requestId");

-- CreateIndex
CREATE INDEX "Schedule_userId_isActive_idx" ON "Schedule"("userId", "isActive");

-- CreateIndex
CREATE INDEX "Schedule_type_idx" ON "Schedule"("type");

-- CreateIndex
CREATE INDEX "Schedule_validFrom_validUntil_idx" ON "Schedule"("validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "ScheduleBlock_scheduleId_dayOfWeek_idx" ON "ScheduleBlock"("scheduleId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleBlock_scheduleId_dayOfWeek_startTime_endTime_key" ON "ScheduleBlock"("scheduleId", "dayOfWeek", "startTime", "endTime");

-- CreateIndex
CREATE UNIQUE INDEX "CicloFormativo_codigo_key" ON "CicloFormativo"("codigo");

-- CreateIndex
CREATE INDEX "CicloFormativo_nivel_familia_idx" ON "CicloFormativo"("nivel", "familia");

-- CreateIndex
CREATE INDEX "CicloFormativo_activo_idx" ON "CicloFormativo"("activo");

-- CreateIndex
CREATE INDEX "ModuloProfesional_cicloId_curso_idx" ON "ModuloProfesional"("cicloId", "curso");

-- CreateIndex
CREATE INDEX "ModuloProfesional_docenteId_idx" ON "ModuloProfesional"("docenteId");

-- CreateIndex
CREATE UNIQUE INDEX "ModuloProfesional_cicloId_codigo_key" ON "ModuloProfesional"("cicloId", "codigo");

-- CreateIndex
CREATE INDEX "ResultadoAprendizaje_moduloId_idx" ON "ResultadoAprendizaje"("moduloId");

-- CreateIndex
CREATE UNIQUE INDEX "ResultadoAprendizaje_moduloId_numero_key" ON "ResultadoAprendizaje"("moduloId", "numero");

-- CreateIndex
CREATE INDEX "CriterioEvaluacion_raId_idx" ON "CriterioEvaluacion"("raId");

-- CreateIndex
CREATE UNIQUE INDEX "CriterioEvaluacion_raId_numero_key" ON "CriterioEvaluacion"("raId", "numero");

-- CreateIndex
CREATE INDEX "Tema_moduloId_idx" ON "Tema"("moduloId");

-- CreateIndex
CREATE UNIQUE INDEX "Tema_moduloId_numero_key" ON "Tema"("moduloId", "numero");

-- CreateIndex
CREATE INDEX "ContenidoTema_temaId_idx" ON "ContenidoTema"("temaId");

-- CreateIndex
CREATE INDEX "RecursoTema_temaId_idx" ON "RecursoTema"("temaId");

-- CreateIndex
CREATE UNIQUE INDEX "Address_userId_key" ON "Address"("userId");

-- CreateIndex
CREATE INDEX "Address_postalCode_province_idx" ON "Address"("postalCode", "province");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailPersonal_key" ON "User"("emailPersonal");

-- CreateIndex
CREATE UNIQUE INDEX "User_dni_key" ON "User"("dni");

-- CreateIndex
CREATE INDEX "User_isActive_role_idx" ON "User"("isActive", "role");

-- CreateIndex
CREATE INDEX "User_provider_providerId_idx" ON "User"("provider", "providerId");

-- CreateIndex
CREATE INDEX "Request_requesterId_status_idx" ON "Request"("requesterId", "status");

-- CreateIndex
CREATE INDEX "Request_adminId_status_idx" ON "Request"("adminId", "status");

-- CreateIndex
CREATE INDEX "Request_type_status_idx" ON "Request"("type", "status");

-- CreateIndex
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RequestDocument_fileId_key" ON "RequestDocument"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestDocument_replacedById_key" ON "RequestDocument"("replacedById");

-- CreateIndex
CREATE INDEX "RequestDocument_requestId_status_idx" ON "RequestDocument"("requestId", "status");

-- CreateIndex
CREATE INDEX "RequestDocument_uploadedById_idx" ON "RequestDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "Task_creatorId_status_idx" ON "Task"("creatorId", "status");

-- CreateIndex
CREATE INDEX "Task_type_status_idx" ON "Task"("type", "status");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "TaskAssignment_assigneeId_status_idx" ON "TaskAssignment"("assigneeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignment_taskId_assigneeId_key" ON "TaskAssignment"("taskId", "assigneeId");

-- CreateIndex
CREATE INDEX "Vote_taskId_option_idx" ON "Vote"("taskId", "option");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_taskId_voterId_key" ON "Vote"("taskId", "voterId");

-- CreateIndex
CREATE INDEX "ActivityLog_actorId_createdAt_idx" ON "ActivityLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_requestId_idx" ON "ActivityLog"("requestId");

-- CreateIndex
CREATE INDEX "ActivityLog_taskId_idx" ON "ActivityLog"("taskId");

-- CreateIndex
CREATE INDEX "_TemaResultados_B_index" ON "_TemaResultados"("B");

-- AddForeignKey
ALTER TABLE "Calendar" ADD CONSTRAINT "Calendar_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "Calendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCalendarEvent" ADD CONSTRAINT "UserCalendarEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCalendarEvent" ADD CONSTRAINT "UserCalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleBlock" ADD CONSTRAINT "ScheduleBlock_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuloProfesional" ADD CONSTRAINT "ModuloProfesional_cicloId_fkey" FOREIGN KEY ("cicloId") REFERENCES "CicloFormativo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuloProfesional" ADD CONSTRAINT "ModuloProfesional_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoAprendizaje" ADD CONSTRAINT "ResultadoAprendizaje_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "ModuloProfesional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterioEvaluacion" ADD CONSTRAINT "CriterioEvaluacion_raId_fkey" FOREIGN KEY ("raId") REFERENCES "ResultadoAprendizaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tema" ADD CONSTRAINT "Tema_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "ModuloProfesional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContenidoTema" ADD CONSTRAINT "ContenidoTema_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "Tema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecursoTema" ADD CONSTRAINT "RecursoTema_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "Tema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestDocument" ADD CONSTRAINT "RequestDocument_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestDocument" ADD CONSTRAINT "RequestDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestDocument" ADD CONSTRAINT "RequestDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestDocument" ADD CONSTRAINT "RequestDocument_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "RequestDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestDocument" ADD CONSTRAINT "RequestDocument_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TemaResultados" ADD CONSTRAINT "_TemaResultados_A_fkey" FOREIGN KEY ("A") REFERENCES "ResultadoAprendizaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TemaResultados" ADD CONSTRAINT "_TemaResultados_B_fkey" FOREIGN KEY ("B") REFERENCES "Tema"("id") ON DELETE CASCADE ON UPDATE CASCADE;
