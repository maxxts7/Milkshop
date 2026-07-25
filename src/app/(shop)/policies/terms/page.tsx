import type { Metadata } from "next";
import { PolicyPage, Section, DraftNotice } from "@/components/policy";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms on which Khanams Grassfed sells and delivers.",
};

export default async function TermsPolicy() {
  const s = await getSettings();

  return (
    <PolicyPage title="Terms of service" updated="25 July 2026">
      <DraftNotice />

      <Section heading="Who you are buying from">
        <p>
          This website is operated by {s.storeName}, {s.storeAddress}. FSSAI
          Licence No. {s.fssai}. In these terms &ldquo;we&rdquo; and
          &ldquo;us&rdquo; mean {s.storeName}, and &ldquo;you&rdquo; means the
          person placing an order.
        </p>
        <p>
          By placing an order you agree to these terms, our{" "}
          <a href="/policies/shipping">delivery policy</a> and our{" "}
          <a href="/policies/refunds">cancellation and refund policy</a>.
        </p>
      </Section>

      <Section heading="Orders">
        <p>
          An order placed on this site is an offer to buy. The contract is formed
          when we confirm your order by phone, WhatsApp or delivery. We may
          decline an order — for example if the item is out of stock, the address
          is outside our delivery area, or we cannot reach you to confirm.
        </p>
        <p>
          You must be 18 or older to place an order, and the delivery address and
          phone number you give must be correct and reachable.
        </p>
      </Section>

      <Section heading="Prices and payment">
        <p>
          Prices are shown in Indian Rupees and include applicable taxes unless
          stated otherwise. Delivery charges are shown separately at checkout
          before you confirm.
        </p>
        <p>
          Orders are currently paid in cash on delivery, or in cash when you
          collect from our store. Online payment is not yet available on this
          site.
        </p>
        <p>
          We may change prices at any time, but never after you have placed an
          order — the price you saw at checkout is the price you pay.
        </p>
      </Section>

      <Section heading="Subscriptions">
        <p>
          A subscription is a standing instruction to deliver a set quantity on a
          set rhythm. It has no minimum term and no advance payment. You pay for
          each delivery as it arrives.
        </p>
        <p>
          You may change the quantity, pause, or cancel at any time from your
          account. Changes made before the daily cutoff apply from the next
          delivery; changes made after it apply from the delivery after that.
        </p>
        <p>
          We may pause or end a subscription if we cannot deliver to your area,
          if payment is repeatedly not made on delivery, or if we stop producing
          the item. We will tell you if that happens.
        </p>
      </Section>

      <Section heading="Fresh and raw products">
        <p>
          Our milk is raw and unpasteurised. It must be refrigerated on arrival
          and boiled before consumption. Dahi, milk and eggs are perishable and
          should be consumed promptly.
        </p>
        <p>
          Raw honey may crystallise over time. This is natural and is not a
          defect — warm the jar gently to return it to liquid.
        </p>
        <p>
          Nothing on this website is medical advice. Any claims about the
          nutritional character of our products are general and are not intended
          to diagnose, treat or prevent any condition.
        </p>
      </Section>

      <Section heading="Availability">
        <p>
          We are a small farm and yields vary. Products shown as available may
          sell out, and items marked &ldquo;coming soon&rdquo; carry no promise of
          a launch date. Where an item you ordered is unavailable we will contact
          you and you will not be charged for it.
        </p>
      </Section>

      <Section heading="Your account">
        <p>
          Signing in uses a one-time code sent to your mobile number. Keep access
          to that number secure — anyone who can receive your messages can sign
          in as you. Tell us immediately if you think someone else has used your
          account.
        </p>
      </Section>

      <Section heading="Our content">
        <p>
          The Khanams Grassfed, Milk House and Honey House names, logos,
          photography and text on this site belong to us. Please do not reuse
          them commercially without asking.
        </p>
      </Section>

      <Section heading="Liability">
        <p>
          We take responsibility for the quality and safety of what we produce.
          We are not liable for loss caused by storage or handling after delivery,
          by an address or phone number given incorrectly, or by events outside
          our reasonable control such as weather, strikes or road closures.
        </p>
        <p>
          Nothing in these terms limits liability that cannot lawfully be limited.
        </p>
      </Section>

      <Section heading="Governing law">
        <p>
          These terms are governed by the laws of India, and the courts at
          Srinagar, Jammu &amp; Kashmir have jurisdiction over any dispute.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          {s.storeName}, {s.storeAddress}. Phone and WhatsApp{" "}
          <a href={`tel:+91${s.storePhone}`}>+91 {s.storePhone}</a>
          {s.storeEmail ? (
            <>
              , email <a href={`mailto:${s.storeEmail}`}>{s.storeEmail}</a>
            </>
          ) : null}
          .
        </p>
      </Section>
    </PolicyPage>
  );
}
