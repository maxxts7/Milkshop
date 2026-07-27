import type { Settings } from "./db/schema";

/**
 * Everything time-related is computed in IST regardless of where the server runs.
 *
 * The trick used throughout: shift the epoch by +5:30 and then read the date
 * with getUTC* accessors. Those accessors then return IST wall-clock fields.
 * Never use the local getters here — Netlify runs in UTC, your customer does not.
 */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export type Zone = "srinagar" | "india" | "pickup";
export type Fulfilment = "delivery" | "pickup";

export interface IstParts {
  year: number;
  month: number; // 0-11
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0=Sun … 6=Sat
}

export function istParts(at: Date = new Date()): IstParts {
  const s = new Date(at.getTime() + IST_OFFSET_MS);
  return {
    year: s.getUTCFullYear(),
    month: s.getUTCMonth(),
    day: s.getUTCDate(),
    hour: s.getUTCHours(),
    minute: s.getUTCMinutes(),
    weekday: s.getUTCDay(),
  };
}

/** Real epoch ms for a given IST wall-clock moment. */
export function istToEpoch(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
): number {
  return Date.UTC(year, month, day, hour, minute) - IST_OFFSET_MS;
}

/** "2026-07-26" for an IST calendar date. */
export function isoDate(year: number, month: number, day: number): string {
  const d = new Date(Date.UTC(year, month, day));
  return d.toISOString().slice(0, 10);
}

export function todayIST(at: Date = new Date()): string {
  const p = istParts(at);
  return isoDate(p.year, p.month, p.day);
}

export interface CutoffInfo {
  /** Epoch ms of the cutoff customers are currently racing. */
  cutoffAt: number;
  /** ISO date the order will be delivered if placed now. */
  deliveryDate: string;
  /** Human label, e.g. "Sunday 26 July". */
  deliveryDateLabel: string;
  /** e.g. "6:00 – 9:00 AM" */
  slot: string;
  /** True when today's cutoff has already passed. */
  missedToday: boolean;
}

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Subscriptions ride their own morning round, later than the one-off fresh
 * delivery in Settings. Kept separate on purpose: changing settings.deliverySlot
 * would move one-time and pre-order deliveries too.
 */
export const SUBSCRIPTION_DELIVERY_SLOT = "8:00 – 11:00 AM";

export function formatIstDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${WEEKDAY_NAMES[weekday]} ${d} ${MONTH_NAMES[m - 1]}`;
}

/**
 * Given the store settings, work out when a fresh order placed *now* arrives.
 *
 * Before the cutoff  → tomorrow morning.
 * After the cutoff   → the morning after that.
 * Either way, skip forward over any weekday the store doesn't deliver on.
 */
export function getCutoffInfo(
  settings: Pick<
    Settings,
    "cutoffHour" | "cutoffMinute" | "deliverySlot" | "deliveryDays"
  >,
  at: Date = new Date(),
): CutoffInfo {
  const p = istParts(at);
  const todaysCutoff = istToEpoch(
    p.year,
    p.month,
    p.day,
    settings.cutoffHour,
    settings.cutoffMinute,
  );
  const missedToday = at.getTime() >= todaysCutoff;

  // Racing today's cutoff, or tomorrow's if it has gone.
  const cutoffAt = missedToday
    ? istToEpoch(p.year, p.month, p.day + 1, settings.cutoffHour, settings.cutoffMinute)
    : todaysCutoff;

  const activeDays =
    settings.deliveryDays && settings.deliveryDays.length > 0
      ? settings.deliveryDays
      : [0, 1, 2, 3, 4, 5, 6];

  let offset = missedToday ? 2 : 1;
  // Guard the loop: 7 tries covers every possible weekday configuration.
  for (let i = 0; i < 8; i++) {
    const candidate = new Date(Date.UTC(p.year, p.month, p.day + offset));
    if (activeDays.includes(candidate.getUTCDay())) break;
    offset++;
  }

  const target = new Date(Date.UTC(p.year, p.month, p.day + offset));
  const deliveryDate = target.toISOString().slice(0, 10);

  return {
    cutoffAt,
    deliveryDate,
    deliveryDateLabel: formatIstDate(deliveryDate),
    slot: settings.deliverySlot,
    missedToday,
  };
}

// ------------------------------------------------------------------ fees

export interface FeeInput {
  subtotalPaise: number;
  zone: Zone;
  settings: Pick<
    Settings,
    | "localDeliveryFeePaise"
    | "localFreeAbovePaise"
    | "courierFeePaise"
    | "courierFreeAbovePaise"
  >;
}

export interface FeeResult {
  feePaise: number;
  freeThresholdPaise: number | null;
  /** Paise still to spend to unlock free delivery, or null when already free. */
  remainingForFreePaise: number | null;
}

export function calculateDeliveryFee({
  subtotalPaise,
  zone,
  settings,
}: FeeInput): FeeResult {
  if (zone === "pickup") {
    return { feePaise: 0, freeThresholdPaise: null, remainingForFreePaise: null };
  }

  const isLocal = zone === "srinagar";
  const fee = isLocal ? settings.localDeliveryFeePaise : settings.courierFeePaise;
  const threshold = isLocal
    ? settings.localFreeAbovePaise
    : settings.courierFreeAbovePaise;

  if (threshold > 0 && subtotalPaise >= threshold) {
    return {
      feePaise: 0,
      freeThresholdPaise: threshold,
      remainingForFreePaise: null,
    };
  }

  return {
    feePaise: fee,
    freeThresholdPaise: threshold > 0 ? threshold : null,
    remainingForFreePaise: threshold > 0 ? threshold - subtotalPaise : null,
  };
}

// ------------------------------------------------------------------ zones

/**
 * Fresh items are perishable and only travel inside the delivery city.
 * Dry goods ship anywhere in India. A cart holding both can only be delivered
 * locally or collected — this is what the checkout enforces.
 */
export function resolveZone(
  hasFresh: boolean,
  fulfilment: Fulfilment,
  pincodeServiceable: boolean,
): Zone {
  if (fulfilment === "pickup") return "pickup";
  if (hasFresh) return "srinagar";
  return pincodeServiceable ? "srinagar" : "india";
}

export function isPincode(value: string): boolean {
  return /^[1-9][0-9]{5}$/.test(value.trim());
}

/**
 * Every pincode inside Srinagar district — the whole 190001–190025 block.
 *
 * The delivery_pincodes table lists the areas the one-off fresh round covers and
 * is edited from the admin panel. Subscriptions run across the entire city, so
 * they check this range instead of being held to whatever rows happen to be in
 * that table.
 */
export function isSrinagarPincode(value: string): boolean {
  const code = value.trim();
  if (!isPincode(code)) return false;
  const n = Number(code);
  return n >= 190001 && n <= 190025;
}

export function isPhone(value: string): boolean {
  return /^[6-9][0-9]{9}$/.test(value.replace(/\s|-/g, ""));
}

export function normalisePhone(value: string): string {
  return value.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "").slice(-10);
}
