import { istParts, istToEpoch, MONTH_NAMES } from "./delivery";

/**
 * The live bottle boards on the home page.
 *
 * A day's bottling is counted out gradually between 9:00 AM and 11:59 PM IST:
 * each board opens the window at zero and lands on exactly one full day's
 * figure as the day closes. Everything else on the page (this month, this
 * year) is derived from those same two per-day figures, so there is a single
 * source of truth and the panels can never disagree with the boards above
 * them — change a per-day figure and the month and year totals follow.
 *
 * Times are computed in IST via the helpers in ./delivery, never with the local
 * getters: Netlify runs in UTC and the customer does not.
 */
export const COUNT_START_HOUR = 9;
export const COUNT_END_HOUR = 23;
export const COUNT_END_MINUTE = 59;

/**
 * One full day's bottling — the only numbers to edit. Today's boards ramp up
 * to these, and the month and year panels are multiples of them.
 */
export const MILK_PER_DAY = 200;
export const GOAT_PER_DAY = 5;

const MS_PER_DAY = 86_400_000;

export interface BottleCount {
  milkToday: number;
  goatToday: number;
  milkMonth: number;
  goatMonth: number;
  milkYear: number;
  goatYear: number;
  /** True only while the counting window is open and the boards are moving. */
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
 * through the whole day — nothing accumulates in memory, it is all derived
 * from the clock.
 */
export function getBottleCount(at: Date = new Date()): BottleCount {
  const p = istParts(at);

  const windowStart = istToEpoch(p.year, p.month, p.day, COUNT_START_HOUR);
  const windowEnd = istToEpoch(
    p.year,
    p.month,
    p.day,
    COUNT_END_HOUR,
    COUNT_END_MINUTE,
  );
  const now = at.getTime();

  // Clamped, so before 9:00 AM this is 0 and at 11:59 PM it is exactly 1 —
  // which is what lands each board on a whole day's figure, to the bottle.
  const progress = Math.min(
    Math.max((now - windowStart) / (windowEnd - windowStart), 0),
    1,
  );

  const milkToday = Math.round(progress * MILK_PER_DAY);
  const goatToday = Math.round(progress * GOAT_PER_DAY);

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
    live: now >= windowStart && now < windowEnd,
    monthName: MONTH_NAMES[p.month],
    year: p.year,
  };
}

/** Indian digit grouping — 2,84,651 rather than 284,651. */
const INDIAN_NUMBER = new Intl.NumberFormat("en-IN");

export function formatBottles(value: number): string {
  return INDIAN_NUMBER.format(value);
}
