/**
 * Tarification des reservations (nettoye, ticket FACT-88).
 */
import type { Room } from "../store.js";

const WEEKEND_SURCHARGE = 20;

/**
 * Dis si une reservation demarre un week-end (samedi ou dimanche, UTC).
 */
export function isWeekend(startsAt: string): boolean {
  const day = new Date(startsAt).getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Compte les heures entre deux bornes ISO 8601 UTC.
 */
export function hoursBetween(startsAt: string, endsAt: string): number {
  return (Date.parse(endsAt) - Date.parse(startsAt)) / 3600000;
}

/**
 * Calcule le prix d'une reservation au tarif de la salle, majore le week-end.
 */
export function priceFor(room: Room, startsAt: string, endsAt: string): number {
  const base = room.hourlyRate * hoursBetween(startsAt, endsAt);
  if (isWeekend(startsAt)) {
    return base + WEEKEND_SURCHARGE;
  }
  return base;
}
