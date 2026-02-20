import { defineEventHandler, readBody, createError } from 'h3';
import { z } from 'zod'; // validación recomendada

const blockSchema = z.object({
  dayOfWeek: z.enum(['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:MM requerido'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:MM requerido'),
  subject: z.string().optional(),
  room: z.string().optional(),
  isBreak: z.boolean().default(false)
});

const scheduleSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(['NORMAL', 'EXAMENES', 'EXTRAORDINARIO']),
  description: z.string().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  blocks: z.array(blockSchema).min(1, 'Al menos un bloque requerido')
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const data = scheduleSchema.parse(body);

  // Verificar usuario existe
  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) throw createError({ statusCode: 404, message: 'Usuario no encontrado' });

  // Crear horario + bloques en transacción
  try {
    const schedule = await prisma.$transaction(async (tx) => {
      // 1. Crear el horario
      const newSchedule = await tx.schedule.create({
        data: {
          name: data.name,
          type: data.type,
          userId: data.userId,
          description: data.description,
          validFrom: data.validFrom ? new Date(data.validFrom) : null,
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          color: data.color
        }
      });

      // 2. Validar y crear bloques
      for (const block of data.blocks) {
        const start = timeToMinutes(block.startTime);
        const end = timeToMinutes(block.endTime);
        
        if (start >= end) {
          throw new Error(`Bloque inválido: ${block.startTime} >= ${block.endTime}`);
        }

        // Verificar solapamiento contra bloques ya creados en esta transacción
        const existing = await tx.scheduleBlock.findMany({
          where: {
            scheduleId: newSchedule.id,
            dayOfWeek: block.dayOfWeek
          }
        });

        const hasOverlap = existing.some(b => {
          const bs = timeToMinutes(b.startTime);
          const be = timeToMinutes(b.endTime);
          return start < be && end > bs;
        });

        if (hasOverlap) {
          throw new Error(`Solapamiento detectado el ${block.dayOfWeek}: ${block.startTime}-${block.endTime}`);
        }

        await tx.scheduleBlock.create({
          data: {
            scheduleId: newSchedule.id,
            dayOfWeek: block.dayOfWeek,
            startTime: block.startTime,
            endTime: block.endTime,
            subject: block.subject,
            room: block.room,
            isBreak: block.isBreak
          }
        });
      }

      return newSchedule;
    });

    return { success: true, scheduleId: schedule.id };
    
  } catch (error: any) {
    throw createError({ 
      statusCode: 400, 
      message: error.message || 'Error creando horario' 
    });
  }
});