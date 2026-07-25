/**
 * Wipes everything transactional — orders, customers, subscriptions, OTPs and
 * waiting-list entries — while leaving the catalogue, settings, pincodes and
 * admin accounts intact.
 *
 * Used to clear test data before going live:
 *   npm run db:clear
 *
 * This is destructive and asks for no confirmation. Do not run it against a
 * database that has real customer orders in it.
 */
import "./load-env";
import { db } from "./index";
import {
  orderItems,
  orders,
  subscriptionSkips,
  subscriptions,
  addresses,
  customers,
  otpCodes,
  waitlist,
} from "./schema";

async function main() {
  console.log("→ Clearing transactional data…");

  // Child rows first — foreign keys point upward.
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(subscriptionSkips);
  await db.delete(subscriptions);
  await db.delete(addresses);
  await db.delete(otpCodes);
  await db.delete(waitlist);
  await db.delete(customers);

  console.log("✔ Orders, customers, subscriptions and waiting lists cleared.");
  console.log("  Catalogue, settings, pincodes and admin logins were not touched.");
  process.exit(0);
}

main().catch((err) => {
  console.error("✖ Failed:\n", err);
  process.exit(1);
});
