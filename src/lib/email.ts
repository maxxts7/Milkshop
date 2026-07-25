import "server-only";
import { formatPaise } from "./money";
import { formatIstDate } from "./delivery";

/**
 * Order alerts, behind an adapter — same shape as sms.ts.
 * No RESEND_API_KEY means alerts print to the server log instead of failing.
 */

interface OrderAlertItem {
  productName: string;
  variantLabel: string;
  quantity: number;
  lineTotalPaise: number;
}

export interface OrderAlert {
  orderNumber: string;
  contactName: string;
  contactPhone: string;
  fulfilment: string;
  zone: string;
  address?: string | null;
  deliveryDate?: string | null;
  deliverySlot?: string | null;
  items: OrderAlertItem[];
  subtotalPaise: number;
  deliveryFeePaise: number;
  totalPaise: number;
  customerNote?: string | null;
}

function renderText(o: OrderAlert): string {
  const lines = o.items
    .map(
      (i) =>
        `  ${i.quantity} × ${i.productName} — ${i.variantLabel}   ${formatPaise(i.lineTotalPaise)}`,
    )
    .join("\n");

  return [
    `New order ${o.orderNumber}`,
    ``,
    `Customer:  ${o.contactName}  (+91 ${o.contactPhone})`,
    `Method:    ${o.fulfilment === "pickup" ? "Store pickup" : `Delivery (${o.zone})`}`,
    o.address ? `Address:   ${o.address}` : null,
    o.deliveryDate
      ? `When:      ${formatIstDate(o.deliveryDate)}${o.deliverySlot ? `, ${o.deliverySlot}` : ""}`
      : null,
    ``,
    `Items`,
    lines,
    ``,
    `Subtotal:  ${formatPaise(o.subtotalPaise)}`,
    `Delivery:  ${o.deliveryFeePaise === 0 ? "Free" : formatPaise(o.deliveryFeePaise)}`,
    `Total:     ${formatPaise(o.totalPaise)}  (cash on ${o.fulfilment === "pickup" ? "pickup" : "delivery"})`,
    o.customerNote ? `\nNote from customer:\n  ${o.customerNote}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

export async function sendOrderAlert(order: OrderAlert): Promise<void> {
  const body = renderText(order);
  const to = process.env.ORDER_ALERT_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || !to) {
    console.log(`\n[order-alert] ${"─".repeat(50)}\n${body}\n[order-alert] ${"─".repeat(50)}\n`);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.ORDER_ALERT_FROM || "orders@resend.dev",
        to: [to],
        subject: `New order ${order.orderNumber} — ${formatPaise(order.totalPaise)}`,
        text: body,
      }),
    });

    if (!res.ok) {
      console.error(`[order-alert] Resend returned ${res.status}`);
      console.log(body);
    }
  } catch (err) {
    // An email failure must never roll back a placed order.
    console.error("[order-alert] send failed:", err);
    console.log(body);
  }
}
