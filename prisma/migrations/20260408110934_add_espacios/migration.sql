/*
  Warnings:

  - You are about to drop the column `academicYear` on the `Calendar` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `TaskAssignment` table. All the data in the column will be lost.
  - Added the required column `currentStateId` to the `Request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workflowId` to the `Request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentStateId` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workflowId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('TASK', 'REQUEST');

-- AlterEnum
ALTER TYPE "CalendarType" ADD VALUE 'TEMPLATE';

-- AlterEnum
ALTER TYPE "ScheduleType" ADD VALUE 'EXPERTO';

-- DropIndex
DROP INDEX "Calendar_type_academicYear_idx";

-- DropIndex
DROP INDEX "Request_adminId_status_idx";

-- DropIndex
DROP INDEX "Request_requesterId_status_idx";

-- DropIndex
DROP INDEX "Request_type_status_idx";

-- DropIndex
DROP INDEX "Task_creatorId_status_idx";

-- DropIndex
DROP INDEX "Task_type_status_idx";

-- DropIndex
DROP INDEX "TaskAssignment_assigneeId_status_idx";

-- AlterTable
ALTER TABLE "Calendar" DROP COLUMN "academicYear",
ADD COLUMN     "academicYearId" TEXT;

-- AlterTable
ALTER TABLE "Request" DROP COLUMN "status",
DROP COLUMN "type",
ADD COLUMN     "context" TEXT,
ADD COLUMN     "currentStateId" TEXT NOT NULL,
ADD COLUMN     "workflowId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "academicYearId" TEXT,
ADD COLUMN     "parentScheduleId" TEXT;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "status",
DROP COLUMN "type",
ADD COLUMN     "context" TEXT,
ADD COLUMN     "currentStateId" TEXT NOT NULL,
ADD COLUMN     "workflowId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TaskAssignment" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "files" ADD COLUMN     "data" BYTEA,
ALTER COLUMN "path" DROP NOT NULL;

-- DropEnum
DROP TYPE "RequestType";

-- DropEnum
DROP TYPE "TaskType";

-- DropEnum
DROP TYPE "WorkflowStatus";

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleTemplateRole" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleTemplateRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Espacio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "planta" INTEGER NOT NULL,
    "observaciones" TEXT,
    "scheduleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Espacio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowDefinition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType" "EntityType" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowState" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'gray',
    "order" INTEGER NOT NULL,
    "isInitial" BOOLEAN NOT NULL DEFAULT false,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "config" TEXT,

    CONSTRAINT "WorkflowState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTransition" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "fromStateId" TEXT NOT NULL,
    "toStateId" TEXT NOT NULL,
    "allowedRoles" TEXT NOT NULL,
    "requiresComment" BOOLEAN NOT NULL DEFAULT false,
    "requiresFields" TEXT,
    "autoActions" TEXT,
    "validatorCode" TEXT,

    CONSTRAINT "WorkflowTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StateHistory" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "requestId" TEXT,
    "fromStateId" TEXT NOT NULL,
    "toStateId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "comment" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StateHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "taskId" TEXT,
    "requestId" TEXT,
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcademicYear_isActive_idx" ON "AcademicYear"("isActive");

-- CreateIndex
CREATE INDEX "AcademicYear_startDate_idx" ON "AcademicYear"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_name_key" ON "AcademicYear"("name");

-- CreateIndex
CREATE INDEX "ScheduleTemplateRole_scheduleId_idx" ON "ScheduleTemplateRole"("scheduleId");

-- CreateIndex
CREATE INDEX "ScheduleTemplateRole_role_idx" ON "ScheduleTemplateRole"("role");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleTemplateRole_scheduleId_role_key" ON "ScheduleTemplateRole"("scheduleId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Espacio_nombre_key" ON "Espacio"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Espacio_scheduleId_key" ON "Espacio"("scheduleId");

-- CreateIndex
CREATE INDEX "Espacio_planta_idx" ON "Espacio"("planta");

-- CreateIndex
CREATE INDEX "Espacio_nombre_idx" ON "Espacio"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowDefinition_code_key" ON "WorkflowDefinition"("code");

-- CreateIndex
CREATE INDEX "WorkflowDefinition_entityType_isActive_idx" ON "WorkflowDefinition"("entityType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowDefinition_code_version_key" ON "WorkflowDefinition"("code", "version");

-- CreateIndex
CREATE INDEX "WorkflowState_workflowId_isInitial_idx" ON "WorkflowState"("workflowId", "isInitial");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowState_workflowId_code_key" ON "WorkflowState"("workflowId", "code");

-- CreateIndex
CREATE INDEX "WorkflowTransition_workflowId_fromStateId_idx" ON "WorkflowTransition"("workflowId", "fromStateId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTransition_workflowId_fromStateId_toStateId_key" ON "WorkflowTransition"("workflowId", "fromStateId", "toStateId");

-- CreateIndex
CREATE INDEX "StateHistory_taskId_idx" ON "StateHistory"("taskId");

-- CreateIndex
CREATE INDEX "StateHistory_requestId_idx" ON "StateHistory"("requestId");

-- CreateIndex
CREATE INDEX "StateHistory_actorId_idx" ON "StateHistory"("actorId");

-- CreateIndex
CREATE INDEX "StateHistory_createdAt_idx" ON "StateHistory"("createdAt");

-- CreateIndex
CREATE INDEX "WorkflowNotification_userId_isRead_idx" ON "WorkflowNotification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "WorkflowNotification_createdAt_idx" ON "WorkflowNotification"("createdAt");

-- CreateIndex
CREATE INDEX "Calendar_type_academicYearId_idx" ON "Calendar"("type", "academicYearId");

-- CreateIndex
CREATE INDEX "Request_requesterId_idx" ON "Request"("requesterId");

-- CreateIndex
CREATE INDEX "Request_adminId_idx" ON "Request"("adminId");

-- CreateIndex
CREATE INDEX "Request_workflowId_idx" ON "Request"("workflowId");

-- CreateIndex
CREATE INDEX "Request_currentStateId_idx" ON "Request"("currentStateId");

-- CreateIndex
CREATE INDEX "Schedule_academicYearId_idx" ON "Schedule"("academicYearId");

-- CreateIndex
CREATE INDEX "Task_creatorId_idx" ON "Task"("creatorId");

-- CreateIndex
CREATE INDEX "Task_workflowId_idx" ON "Task"("workflowId");

-- CreateIndex
CREATE INDEX "Task_currentStateId_idx" ON "Task"("currentStateId");

-- CreateIndex
CREATE INDEX "TaskAssignment_assigneeId_idx" ON "TaskAssignment"("assigneeId");

-- AddForeignKey
ALTER TABLE "Calendar" ADD CONSTRAINT "Calendar_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_parentScheduleId_fkey" FOREIGN KEY ("parentScheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleTemplateRole" ADD CONSTRAINT "ScheduleTemplateRole_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Espacio" ADD CONSTRAINT "Espacio_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowState" ADD CONSTRAINT "WorkflowState_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "WorkflowDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "WorkflowDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_fromStateId_fkey" FOREIGN KEY ("fromStateId") REFERENCES "WorkflowState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_toStateId_fkey" FOREIGN KEY ("toStateId") REFERENCES "WorkflowState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StateHistory" ADD CONSTRAINT "StateHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StateHistory" ADD CONSTRAINT "StateHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StateHistory" ADD CONSTRAINT "StateHistory_toStateId_fkey" FOREIGN KEY ("toStateId") REFERENCES "WorkflowState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StateHistory" ADD CONSTRAINT "StateHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowNotification" ADD CONSTRAINT "WorkflowNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "WorkflowDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_currentStateId_fkey" FOREIGN KEY ("currentStateId") REFERENCES "WorkflowState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "WorkflowDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_currentStateId_fkey" FOREIGN KEY ("currentStateId") REFERENCES "WorkflowState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
