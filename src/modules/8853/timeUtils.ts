import { TimeSlot } from '../../types';
import { BUSINESS_START, BUSINESS_END, TIME_SLOT_DURATION } from '../../data/initialData';

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startMinutes = timeToMinutes(BUSINESS_START);
  const endMinutes = timeToMinutes(BUSINESS_END);

  for (let current = startMinutes; current < endMinutes; current += TIME_SLOT_DURATION) {
    slots.push({
      startTime: minutesToTime(current),
      endTime: minutesToTime(current + TIME_SLOT_DURATION),
      available: true,
    });
  }

  return slots;
}

export function checkTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && s2 < e1;
}

export function getSlotsInRange(
  allSlots: TimeSlot[],
  startTime: string,
  endTime: string
): TimeSlot[] {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  return allSlots.filter(slot => {
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);
    return slotStart >= start && slotEnd <= end;
  });
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
