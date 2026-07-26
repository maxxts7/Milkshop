import "server-only";
import { formatPaise } from "./money";
import { formatIstDate, istParts } from "./delivery";
import type { OrderAlert } from "./email";

/**
 * WhatsApp order alerts, behind an adapter — same shape as email.ts and sms.ts.
 *
 * The number the alert goes to is the WhatsApp number in Settings, so the shop
 * can change it without a deploy. Sending needs a WhatsApp Cloud API token; with
 * WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing the message prints to the
 * server log instead of failing, which keeps checkout working out of the box.
 *
 * Nothing in here may throw: an alert that fails must never lose an order.
 */

const API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0";

/**
 * Order numbers already alerted on, so a retried request cannot send twice.
 * Serverless instances are short-lived, so this is a belt-and-braces guard on
 * top of the real one — the alert is fired once, immediately after the single
 * successful INSERT that creates the order.
 */
const sent = new Set<string>();

/** "26/07/2026 at 18:24" — the moment the alert is being raised, in IST. */
function placedAtIst(): string {
  const p = istParts();
  return (
    `${String(p.day).padStart(2, "0")}/${String(p.month + 1).padStart(2, "0")}/${p.year}` +
    ` at ${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`
  );
}

/** Everything Minhal asked to see in the message, in reading order. */
function renderMessage(o: OrderAlert): string {
  const placedAt = placedAtIst();

  const items = o.items
    .map(
      (i) =>
        `• ${i.productName} — ${i.variantLabel} × ${i.quantity} = ${formatPaise(i.lineTotalPaise)}`,
    )
    .join("\n");

  return [
    `*New order ${o.orderNumber}*`,
    ``,
    `Name: ${o.contactName}`,
    `Mobile: +91 ${o.contactPhone}`,
    o.address
      ? `Address: ${o.address}`
      : `Collection: store pickup`,
    o.deliveryDate
      ? `Delivery: ${formatIstDate(o.deliveryDate)}${o.deliverySlot ? `, ${o.deliverySlot}` : ""}`
      : null,
    ``,
    `Items:`,
    items,
    ``,
    `Subtotal: ${formatPaise(o.subtotalPaise)}`,
    `Delivery charge: ${o.deliveryFeePaise === 0 ? "Free" : formatPaise(o.deliveryFeePaise)}`,
    `*Total: ${formatPaise(o.totalPaise)}* (cash on ${o.fulfilment === "pickup" ? "pickup" : "delivery"})`,
    ``,
    `Placed: ${placedAt} IST`,
    o.customerNote ? `\nNote from customer: ${o.customerNote}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

/** Everything the shop needs to start delivering a new subscription. */
export interface SubscriptionAlert {
  reference: string;
  contactName: string;
  contactPhone: string;
  address: string;
  landmark: string | null;
  pincode: string;
  productName: string;
  variantLabel: string;
  quantity: number;
  /** e.g. "Every day" or "Once a week — Mon, Thu". */
  schedule: string;
  /** ISO date the first delivery is due. */
  startDate: string;
  /** e.g. "6:00 – 9:00 AM". */
  deliverySlot: string;
  perDeliveryPaise: number;
}

function renderSubscriptionMessage(s: SubscriptionAlert): string {
  return [
    `*New subscription ${s.reference}*`,
    ``,
    `Name: ${s.contactName}`,
    `Mobile: +91 ${s.contactPhone}`,
    `Address: ${s.address}`,
    `Landmark: ${s.landmark || "—"}`,
    `Pincode: ${s.pincode}`,
    ``,
    `Product: ${s.productName} — ${s.variantLabel}`,
    `Quantity: ${s.quantity} per delivery`,
    `Schedule: ${s.schedule}`,
    `Starts: ${formatIstDate(s.startDate)}`,
    `Delivery time: ${s.deliverySlot}`,
    ``,
    `Per delivery: ${formatPaise(s.perDeliveryPaise)} (cash on delivery)`,
    ``,
    `Placed: ${placedAtIst()} IST`,
  ].join("\n");
}

/** Digits only, country code included — what the Cloud API expects. */
function normaliseWhatsappNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // A bare 10-digit Indian mobile saved in Settings still needs its 91.
  return digits.length === 10 ? `91${digits}` : digits;
}

/**
 * Log the whole message, not just the reason. A failed alert is an order the
 * shop has not seen, so the log has to carry enough to act on by hand.
 */
function logFailure(reason: string, to: string, body: string): void {
  console.error(
    `\n[whatsapp-alert] FAILED — ${reason}\n` +
      `[whatsapp-alert] intended recipient: ${to || "(not set)"}\n` +
      `${body}\n` +
      `[whatsapp-alert] ${"─".repeat(50)}\n`,
  );
}

export async function sendOrderWhatsapp(
  order: OrderAlert,
  whatsappNumber: string,
): Promise<void> {
  if (sent.has(order.orderNumber)) return;
  sent.add(order.orderNumber);

  await deliver(renderMessage(order), whatsappNumber);
}

/**
 * The same alert, for a subscription rather than a one-off order. The shop
 * needs the delivery details in exactly the same place, so it goes to the same
 * number and follows the same never-throw rule.
 */
export async function sendSubscriptionWhatsapp(
  subscription: SubscriptionAlert,
  whatsappNumber: string,
): Promise<void> {
  if (sent.has(subscription.reference)) return;
  sent.add(subscription.reference);

  await deliver(renderSubscriptionMessage(subscription), whatsappNumber);
}

async function deliver(body: string, whatsappNumber: string): Promise<void> {
  const to = normaliseWhatsappNumber(whatsappNumber ?? "");
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!to) {
    logFailure("no WhatsApp number set in Settings", to, body);
    return;
  }

  if (!token || !phoneNumberId) {
    console.log(
      `\n[whatsapp-alert] ${"─".repeat(50)}\n` +
        `[whatsapp-alert] to +${to} (console mode — set WHATSAPP_TOKEN and\n` +
        `[whatsapp-alert] WHATSAPP_PHONE_NUMBER_ID to send for real)\n` +
        `${body}\n` +
        `[whatsapp-alert] ${"─".repeat(50)}\n`,
    );
    return;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { preview_url: false, body },
        }),
      },
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      logFailure(`WhatsApp API returned ${res.status} ${detail}`.trim(), to, body);
    }
  } catch (err) {
    logFailure(
      err instanceof Error ? err.message : "unknown network error",
      to,
      body,
    );
  }
}
