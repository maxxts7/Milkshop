import type { Metadata } from "next";
import { PolicyPage, Section, DraftNotice } from "@/components/policy";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = {
  title: "Cancellations & refunds",
  description:
    "How to cancel an order, and what happens if something arrives spoiled or damaged.",
};

export default async function RefundsPolicy() {
  const s = await getSettings();
  const cutoffLabel = `${s.cutoffHour > 12 ? s.cutoffHour - 12 : s.cutoffHour} ${s.cutoffHour >= 12 ? "pm" : "am"}`;

  return (
    <PolicyPage title="Cancellations & refunds" updated="25 July 2026">
      <DraftNotice />

      <Section heading="The short version">
        <p>
          Food is not returnable once it has left us. But if what arrives is
          spoiled, leaking, broken or simply wrong, tell us within 12 hours with
          a photo and we will replace it or refund it. No argument.
        </p>
      </Section>

      <Section heading="Cancelling an order">
        <ul>
          <li>
            <strong>Fresh orders</strong> can be cancelled free of charge any time
            before the {cutoffLabel} cutoff on the day you order. After that we
            have already bottled it for you.
          </li>
          <li>
            <strong>Pantry orders</strong> can be cancelled free of charge any
            time before they are handed to the courier.
          </li>
          <li>
            <strong>Subscriptions</strong> can be paused or cancelled from your
            account at any time. Changes made before the cutoff apply from the
            very next delivery.
          </li>
        </ul>
        <p>
          To cancel, call or WhatsApp{" "}
          <a href={`tel:+91${s.storePhone}`}>+91 {s.storePhone}</a> with your
          order number.
        </p>
      </Section>

      <Section heading="Returns">
        <p>
          For food-safety reasons we cannot accept returns of milk, dahi, eggs,
          honey, ghee, wari or pickle once delivered. This does not affect your
          rights where the goods were defective.
        </p>
      </Section>

      <Section heading="If something is wrong with your order">
        <p>Tell us within 12 hours of delivery if:</p>
        <ul>
          <li>the milk or dahi has turned, or smells sour on arrival;</li>
          <li>a bottle or jar arrived cracked, leaking or with a broken seal;</li>
          <li>eggs arrived broken;</li>
          <li>you received the wrong item, size or quantity;</li>
          <li>an item is missing from the delivery.</li>
        </ul>
        <p>
          Send us a photo on WhatsApp along with your order number. We will
          replace the item on the next delivery run, or refund it — your choice.
        </p>
        <p>
          We ask for 12 hours because that is the window in which we can tell
          the difference between a problem in our production and normal spoilage
          from storage at home. Raw milk is unpasteurised and must be refrigerated
          immediately and boiled before use.
        </p>
      </Section>

      <Section heading="How refunds are paid">
        <p>
          Because orders are paid in cash on delivery or on collection, refunds
          are normally given as cash on your next delivery, as a credit against
          your next order, or by UPI transfer if you would rather have it back
          straight away. Tell us which you prefer.
        </p>
        <p>
          Where an online payment method is added in future, refunds will return
          to the original payment method within 5–7 working days.
        </p>
      </Section>

      <Section heading="Orders we may cancel">
        <p>
          Very occasionally we cancel an order ourselves — a herd yield falls
          short, a batch fails our own check, or weather closes the road. We will
          call you, and you will never be charged for an order we could not
          fulfil.
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
