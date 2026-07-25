import { istParts, istToEpoch, MONTH_NAMES } from "./delivery";

/**
 * The live bottle boards on the home page.
 *
 * Bottling runs one shift a day, 9:00 AM to 1:00 PM IST. The boards climb only
 * during that shift — 30 cow bottles and 1 goat bottle an hour — and hold
 * their reading for the rest of the day. Everything else on the page (this
 * month, this year) is derived from those two numbers so there is a single
 * source of truth, and so the panels never disagree with the boards above them.
 *
 * Times are computed in IST via the helpers in ./delivery, never with the local
 * getters: Netlify runs in UTC and the customer does not.
 */
export const SHIFT_START_HOUR = 9;
export const SHIFT_END_HOUR = 13;

export const MILK_PER_HOUR = 30;
export const GOAT_PER_HOUR = 1;

/** What each board reads the moment the shift opens. */
const MILK_OPENING = 1127;
const GOAT_OPENING = 685;

const SHIFT_HOURS = SHIFT_END_HOUR - SHIFT_START_HOUR;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

/** What each board reads once the shift has closed — one full day's bottling. */
export const MILK_PER_DAY = MILK_OPENING + MILK_PER_HOUR * SHIFT_HOURS;
export const GOAT_PER_DAY = GOAT_OPENING + GOAT_PER_HOUR * SHIFT_HOURS;

export interface BottleCount {
  milkToday: number;
  goatToday: number;
  milkMonth: number;
  goatMonth: number;
  milkYear: number;
  goatYear: number;
  /** True only while the shift is running and the boards are actually moving. */
  live: boolean;
  /** e.g. "July" — the IST month the panels are reporting on. */
  monthName: string;
  year: number;
}

/**
 * Both boards for a given moment.
 *
 * Rendered on the server for the first paint and then recomputed in the
 * browser once a second, so the numbers stay right even if a laptop sleeps
 * through the whole shift — nothing accumulates in memory, it is all derived
 * from the clock.
 */
export function getBottleCount(at: Date = new Date()): BottleCount {
  const p = istParts(at);

  const shiftStart = istToEpoch(p.year, p.month, p.day, SHIFT_START_HOUR);
  const shiftEnd = istToEpoch(p.year, p.month, p.day, SHIFT_END_HOUR);
  const now = at.getTime();

  // Clamped, so before the shift this is 0 and after it is the full shift.
  const hoursIn =
    (Math.min(Math.max(now, shiftStart), shiftEnd) - shiftStart) / MS_PER_HOUR;

  const milkToday = MILK_OPENING + Math.floor(hoursIn * MILK_PER_HOUR);
  const goatToday = GOAT_OPENING + Math.floor(hoursIn * GOAT_PER_HOUR);

  // Days already closed out, this month and this year. Today is added back
  // separately at its live value so the totals move with the boards.
  const daysDoneThisMonth = p.day - 1;
  const daysDoneThisYear = Math.round(
    (istToEpoch(p.year, p.month, p.day) - istToEpoch(p.year, 0, 1)) / MS_PER_DAY,
  );

  return {
    milkToday,
    goatToday,
    milkMonth: MILK_PER_DAY * daysDoneThisMonth + milkToday,
    goatMonth: GOAT_PER_DAY * daysDoneThisMonth + goatToday,
    milkYear: MILK_PER_DAY * daysDoneThisYear + milkToday,
    goatYear: GOAT_PER_DAY * daysDoneThisYear + goatToday,
    live: now >= shiftStart && now < shiftEnd,
    monthName: MONTH_NAMES[p.month],
    year: p.year,
  };
}

/** Indian digit grouping — 2,84,651 rather than 284,651. */
const INDIAN_NUMBER = new Intl.NumberFormat("en-IN");

export function formatBottles(value: number): string {
  return INDIAN_NUMBER.format(value);
}
