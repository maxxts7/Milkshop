import type { Metadata } from "next";
import { PolicyPage, Section, DraftNotice } from "@/components/policy";
import { getSettings } from "@/lib/store";
import { formatPaise } from "@/lib/money";

export const metadata: Metadata = {
  title: "Delivery & pickup policy",
  description:
    "How Khanams Grassfed delivers fresh dairy across Srinagar and ships pantry goods across India.",
};

export default async function ShippingPolicy() {
  const s = await getSettings();
  const cutoffLabel = `${s.cutoffHour > 12 ? s.cutoffHour - 12 : s.cutoffHour}${s.cutoffMinute ? `:${String(s.cutoffMinute).padStart(2, "0")}` : ""} ${s.cutoffHour >= 12 ? "pm" : "am"}`;

  return (
    <PolicyPage title="Delivery & pickup" updated="25 July 2026">
      <DraftNotice />

      <Section heading="Two kinds of product, two kinds of delivery">
        <p>
          We sell perishable fresh produce and shelf-stable pantry goods, and
          they travel differently.
        </p>
        <ul>
          <li>
            <strong>Fresh items</strong> — cow milk, goat milk, dahi and eggs.
            These are delivered inside {s.freshDeliveryCity} only. We will not
            post them, because they will not survive the journey.
          </li>
          <li>
            <strong>Pantry items</strong> — raw honey, honeycomb, cow ghee,
            Kashmiri wari and pickle. These ship anywhere in India.
          </li>
        </ul>
        <p>
          If your basket contains both and your address is outside{" "}
          {s.freshDeliveryCity}, checkout will ask you to either remove the fresh
          items or collect the order from our store.
        </p>
      </Section>

      <Section heading="When fresh orders arrive">
        <p>
          Order before <strong>{cutoffLabel}</strong> and your fresh items are
          delivered the next morning between{" "}
          <strong>{s.deliverySlot}</strong>. Orders placed after the cutoff go
          onto the following morning&rsquo;s run.
        </p>
        <p>
          The website shows a live countdown to the cutoff and names the exact
          date you will receive your order before you pay.
        </p>
      </Section>

      <Section heading="Delivery charges">
        <ul>
          <li>
            Inside {s.freshDeliveryCity}:{" "}
            <strong>{formatPaise(s.localDeliveryFeePaise)}</strong>, free on
            orders above {formatPaise(s.localFreeAbovePaise)}.
          </li>
          <li>
            Elsewhere in India:{" "}
            <strong>{formatPaise(s.courierFeePaise)}</strong> flat, free on
            orders above {formatPaise(s.courierFreeAbovePaise)}.
          </li>
          <li>
            Store pickup: <strong>free</strong>, always.
          </li>
        </ul>
        <p>
          Courier orders usually reach you in 3–7 working days depending on your
          state. Remote pincodes may take longer.
        </p>
      </Section>

      <Section heading="Collecting from the store">
        <p>
          You are welcome to collect any order from {s.storeAddress}. Choose
          &ldquo;Collect from store&rdquo; at checkout and we will call you when
          it is ready. Pay in cash when you arrive.
        </p>
      </Section>

      <Section heading="If nobody is home">
        <p>
          Our rider will call the number on your order. If we cannot reach you,
          fresh items are brought back — we will not leave milk in the sun. We
          will contact you to arrange the next morning&rsquo;s delivery.
        </p>
        <p>
          For repeated failed deliveries on the same order we may ask for payment
          in advance before trying again.
        </p>
      </Section>

      <Section heading="Glass bottles">
        <p>
          Milk is delivered in certified, reusable glass bottles. Please rinse
          and hand them back to the rider on your next delivery, or return them
          to the store.
        </p>
      </Section>

      <Section heading="Questions">
        <p>
          Call or WhatsApp us on{" "}
          <a href={`tel:+91${s.storePhone}`}>+91 {s.storePhone}</a>.
        </p>
      </Section>
    </PolicyPage>
  );
}
