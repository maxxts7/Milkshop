import type { Metadata } from "next";
import { PolicyPage, Section, DraftNotice } from "@/components/policy";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What Khanams Grassfed collects, why, and what we never do with it.",
};

export default async function PrivacyPolicy() {
  const s = await getSettings();

  return (
    <PolicyPage title="Privacy policy" updated="25 July 2026">
      <DraftNotice />

      <Section heading="The short version">
        <p>
          We collect your name, phone number and address so we can bring you milk.
          We do not sell your data to anyone, and we do not run advertising
          trackers on this site.
        </p>
      </Section>

      <Section heading="What we collect">
        <ul>
          <li>
            <strong>Your contact details</strong> — name, mobile number, and
            email if you give one.
          </li>
          <li>
            <strong>Your delivery address</strong> — including pincode and any
            landmark you add.
          </li>
          <li>
            <strong>Your orders and subscriptions</strong> — what you bought,
            when, and what it cost.
          </li>
          <li>
            <strong>Waiting-list entries</strong> — the number you give us to be
            told when a product launches.
          </li>
          <li>
            <strong>A login session cookie</strong> — a signed token so you stay
            signed in. Your cart is kept in your own browser&rsquo;s storage, not
            on our servers.
          </li>
        </ul>
        <p>
          We do not collect or store card details, because payment is taken in
          cash on delivery.
        </p>
      </Section>

      <Section heading="Why we hold it">
        <ul>
          <li>To deliver your order and to call you if we cannot find you.</li>
          <li>To run your subscription on the schedule you chose.</li>
          <li>To show you your own order history when you sign in.</li>
          <li>To message you once when a waiting-list product becomes available.</li>
          <li>To keep the sales records that Indian tax and food-safety law requires.</li>
        </ul>
      </Section>

      <Section heading="Who else sees it">
        <p>
          Only the people and services that are needed to get the order to you:
        </p>
        <ul>
          <li>our own delivery riders and store staff;</li>
          <li>the courier company, for orders shipped outside {s.freshDeliveryCity};</li>
          <li>
            our hosting and database providers, who store the site&rsquo;s data on
            our behalf;
          </li>
          <li>
            an SMS provider, purely to send you the one-time code when you sign
            in.
          </li>
        </ul>
        <p>
          We never sell, rent or trade your details, and we do not send marketing
          messages you did not ask for.
        </p>
      </Section>

      <Section heading="How long we keep it">
        <p>
          Order records are kept for as long as tax law requires. Waiting-list
          numbers are deleted once the product has launched and you have been
          told. Login codes expire after ten minutes.
        </p>
      </Section>

      <Section heading="Your choices">
        <p>
          You can ask us at any time to show you what we hold about you, correct
          it, or delete it — except for records we are legally required to keep.
          Message us on WhatsApp or email and we will deal with it.
        </p>
      </Section>

      <Section heading="Children">
        <p>
          This site is not intended for children, and we do not knowingly collect
          details from anyone under 18.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          If we change this policy we will update the date at the top of this
          page.
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
