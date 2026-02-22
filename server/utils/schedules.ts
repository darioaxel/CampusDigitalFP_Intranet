import { prisma } from '../utils/db'
import pkg from '@prisma/client'
const { DayOfWeek } = pkg

// Validación de formato HH:MM
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Convierte "HH:MM" a minutos desde medianoche (para comparaciones)
export function timeToMinutes(time: string): number {
  if (!TIME_REGEX.test(time)) throw new Error(`Formato hora inválido: ${time}`);
  const [hh, mm] = time.split(':').map(Number);
  return hh * 60 + mm;
}

// Verifica solapamientos dentro del mismo horario/día
export async function checkOverlap(
  scheduleId: string, 
  dayOfWeek: DayOfWeek, 
  startTime: string, 
  endTime: string,
  excludeBlockId?: string
): Promise<boolean> {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  
  if (start >= end) throw new Error('Hora inicio debe ser menor que hora fin');

  const existingBlocks = await prisma.scheduleBlock.findMany({
    where: {
      scheduleId,
      dayOfWeek,
      ...(excludeBlockId && { id: { not: excludeBlockId } })
    }
  });

  return existingBlocks.some(block => {
    const blockStart = timeToMinutes(block.startTime);
    const blockEnd = timeToMinutes(block.endTime);
    // Solapamiento: (StartA < EndB) y (EndA > StartB)
    return start < blockEnd && end > blockStart;
  });
}

// Crear bloque con validación
export async function createBlock(data: {
  scheduleId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  subject?: string;
  room?: string;
}) {
  const hasOverlap = await checkOverlap(
    data.scheduleId, 
    data.dayOfWeek, 
    data.startTime, 
    data.endTime
  );
  
  if (hasOverlap) {
    throw new Error('El bloque se solapa con otro existente en este horario');
  }

  return prisma.scheduleBlock.create({ data });
}