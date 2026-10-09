import type { Booking } from "../store.js";

export interface Slot {
  startsAt: string;
  endsAt: string;
}

/**
 * Calcule les creneaux libres d'une salle sur une journee donnee.
 */
export function freeSlotsForDay(bookings: Booking[], date: string): Slot[] {
  const dayStart = `${date}T00:00:00Z`;
  const dayEndMs = Date.parse(dayStart) + 24 * 3600 * 1000;
  const busy = bookings
    .map((b) => ({
      start: Math.max(Date.parse(b.startsAt), Date.parse(dayStart)),
      end: Math.min(Date.parse(b.endsAt), dayEndMs),
    }))
    .filter((b) => b.start < b.end)
    .sort((a, b) => a.start - b.start);

  const free: Slot[] = [];
  let cursor = Date.parse(dayStart);
  for (const b of busy) {
    if (b.start > cursor) {
      free.push({
        startsAt: new Date(cursor).toISOString(),
        endsAt: new Date(b.start).toISOString(),
      });
    }
    cursor = Math.max(cursor, b.end);
  }
  if (cursor < dayEndMs) {
    free.push({
      startsAt: new Date(cursor).toISOString(),
      endsAt: new Date(dayEndMs).toISOString(),
    });
  }
  return free;
}
