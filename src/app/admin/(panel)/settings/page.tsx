import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { deliveryPincodes } from "@/lib/db/schema";
import { getSettings } from "@/lib/store";
import { toRupees } from "@/lib/money";
import { saveSettings, addPincode, togglePincode } from "../../actions";
import { ChangePasswordForm } from "./password-form";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function AdminSettings() {
  const [settings, pincodes] = await Promise.all([
    getSettings(),
    db.select().from(deliveryPincodes).orderBy(asc(deliveryPincodes.pincode)),
  ]);

  const activeDays = settings.deliveryDays ?? [0, 1, 2, 3, 4, 5, 6];

  return (
    <>
      <h1 className="font-display text-3xl mb-2">Settings</h1>
      <p className="text-sm text-ink-muted mb-8">
        Everything here is live on the shop the moment you save.
      </p>

      <form action={saveSettings} className="grid lg:grid-cols-2 gap-6 items-start mb-8">
        {/* ------------------------------------------------ store front */}
        <section className="bg-paper border border-rule p-5 space-y-4">
          <h2 className="font-display text-xl">Store</h2>

          <div>
            <label className="label" htmlFor="s-name">Store name</label>
            <input id="s-name" name="storeName" className="field" defaultValue={settings.storeName} required />
          </div>

          <div>
            <label className="label" htmlFor="s-address">Pickup address</label>
            <textarea
              id="s-address"
              name="storeAddress"
              className="field min-h-20"
              defaultValue={settings.storeAddress}
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="s-phone">Phone</label>
              <input id="s-phone" name="storePhone" className="field" defaultValue={settings.storePhone} required />
            </div>
            <div>
              <label className="label" htmlFor="s-wa">WhatsApp (with 91)</label>
              <input id="s-wa" name="whatsappNumber" className="field" defaultValue={settings.whatsappNumber} required />
            </div>
            <div>
              <label className="label" htmlFor="s-email">Email</label>
              <input id="s-email" name="storeEmail" type="email" className="field" defaultValue={settings.storeEmail ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="s-fssai">FSSAI licence</label>
              <input id="s-fssai" name="fssai" className="field" defaultValue={settings.fssai} required />
            </div>
            <div>
              <label className="label" htmlFor="s-ig">Instagram handle</label>
              <input id="s-ig" name="instagram" className="field" defaultValue={settings.instagram ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="s-fb">Facebook handle</label>
              <input id="s-fb" name="facebook" className="field" defaultValue={settings.facebook ?? ""} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="s-yt">YouTube handle</label>
              <input id="s-yt" name="youtube" className="field" defaultValue={settings.youtube ?? ""} />
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- delivery */}
        <section className="bg-paper border border-rule p-5 space-y-4">
          <h2 className="font-display text-xl">Delivery &amp; charges</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="s-localfee">Local fee ₹</label>
              <input
                id="s-localfee"
                name="localFee"
                type="number"
                min="0"
                step="1"
                className="field"
                defaultValue={toRupees(settings.localDeliveryFeePaise)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="s-localfree">Local free above ₹</label>
              <input
                id="s-localfree"
                name="localFreeAbove"
                type="number"
                min="0"
                step="1"
                className="field"
                defaultValue={toRupees(settings.localFreeAbovePaise)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="s-courierfee">Courier fee ₹</label>
              <input
                id="s-courierfee"
                name="courierFee"
                type="number"
                min="0"
                step="1"
                className="field"
                defaultValue={toRupees(settings.courierFeePaise)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="s-courierfree">Courier free above ₹</label>
              <input
                id="s-courierfree"
                name="courierFreeAbove"
                type="number"
                min="0"
                step="1"
                className="field"
                defaultValue={toRupees(settings.courierFreeAbovePaise)}
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label" htmlFor="s-cutoffh">Cutoff hour (0–23)</label>
              <input
                id="s-cutoffh"
                name="cutoffHour"
                type="number"
                min="0"
                max="23"
                className="field"
                defaultValue={settings.cutoffHour}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="s-cutoffm">Minute</label>
              <input
                id="s-cutoffm"
                name="cutoffMinute"
                type="number"
                min="0"
                max="59"
                className="field"
                defaultValue={settings.cutoffMinute}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="s-city">Fresh delivery city</label>
              <input
                id="s-city"
                name="freshDeliveryCity"
                className="field"
                defaultValue={settings.freshDeliveryCity}
                required
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="s-slot">Delivery window</label>
            <input
              id="s-slot"
              name="deliverySlot"
              className="field"
              defaultValue={settings.deliverySlot}
              required
            />
          </div>

          <fieldset>
            <legend className="label">Days we deliver</legend>
            <div className="flex flex-wrap gap-3">
              {DAYS.map((day, index) => (
                <label key={day} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name={`day_${index}`}
                    defaultChecked={activeDays.includes(index)}
                    className="h-4 w-4"
                  />
                  {day.slice(0, 3)}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label className="label" htmlFor="s-announce">Announcement bar</label>
            <input
              id="s-announce"
              name="announcement"
              className="field"
              defaultValue={settings.announcement ?? ""}
              placeholder="Shown across the top of every page. Leave empty to hide."
            />
          </div>

          <label className="flex items-start gap-2.5 text-sm border-t border-rule pt-4">
            <input
              type="checkbox"
              name="ordersPaused"
              defaultChecked={settings.ordersPaused}
              className="h-4 w-4 mt-0.5"
            />
            <span>
              <strong className="font-medium">Pause all orders</strong>
              <span className="block text-xs text-ink-muted mt-0.5">
                Hides checkout across the site. Use for holidays or when the
                herd is off.
              </span>
            </span>
          </label>
        </section>

        <div className="lg:col-span-2">
          <button type="submit" className="btn btn-solid">
            Save settings
          </button>
        </div>
      </form>

      {/* ------------------------------------------------------ pincodes */}
      <section className="bg-paper border border-rule p-5 mb-8">
        <h2 className="font-display text-xl mb-1">
          Fresh delivery pincodes
        </h2>
        <p className="text-xs text-ink-muted mb-5">
          Only these pincodes can order milk, dahi and eggs, or start a
          subscription. Everything else is offered pantry items by courier.
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {pincodes.map((row) => (
            <form key={row.id} action={togglePincode}>
              <input type="hidden" name="pincodeId" value={row.id} />
              <button
                type="submit"
                title={row.active ? "Click to switch off" : "Click to switch on"}
                className={`px-3 py-1.5 text-xs border transition-colors ${
                  row.active
                    ? "bg-ink text-paper border-ink"
                    : "border-rule-strong text-ink-muted line-through"
                }`}
              >
                {row.pincode}
                {row.area ? (
                  <span className="opacity-60"> · {row.area}</span>
                ) : null}
              </button>
            </form>
          ))}
        </div>

        <form action={addPincode} className="grid sm:grid-cols-[8rem_1fr_auto] gap-2 max-w-lg">
          <input
            name="pincode"
            className="field"
            placeholder="190026"
            inputMode="numeric"
            maxLength={6}
            required
            aria-label="Pincode"
          />
          <input name="area" className="field" placeholder="Area name (optional)" aria-label="Area" />
          <button type="submit" className="btn btn-outline btn-sm">
            Add
          </button>
        </form>
      </section>

      {/* ------------------------------------------------------ password */}
      <section className="bg-paper border border-rule p-5 max-w-lg">
        <h2 className="font-display text-xl mb-5">Change your password</h2>
        <ChangePasswordForm />
      </section>
    </>
  );
}
