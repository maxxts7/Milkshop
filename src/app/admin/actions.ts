"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  orders,
  products,
  variants,
  settings as settingsTable,
  deliveryPincodes,
  adminUsers,
} from "@/lib/db/schema";
import {
  verifyAdminPassword,
  createAdminSession,
  clearAdminSession,
  getCurrentAdmin,
  hashPassword,
} from "@/lib/auth";
import { toPaise } from "@/lib/money";
import { isPincode } from "@/lib/delivery";

/** Every mutating action funnels through this. */
async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

function num(value: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : fallback;
}

function str(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

// ------------------------------------------------------------------ auth

export async function adminLogin(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = str(formData.get("email"));
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const admin = await verifyAdminPassword(email, password);
  if (!admin) {
    return { error: "Those details don't match an account." };
  }

  await createAdminSession(admin.id);
  redirect("/admin");
}

export async function adminLogout() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function changeAdminPassword(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const admin = await requireAdmin();

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");

  if (next.length < 8) {
    return { error: "Your new password must be at least 8 characters." };
  }

  const verified = await verifyAdminPassword(admin.email, current);
  if (!verified) {
    return { error: "Your current password is not right." };
  }

  await db
    .update(adminUsers)
    .set({ passwordHash: await hashPassword(next) })
    .where(eq(adminUsers.id, admin.id));

  return { ok: true };
}

// ---------------------------------------------------------------- orders

const ORDER_STATUSES = [
  "placed",
  "confirmed",
  "packed",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export async function setOrderStatus(formData: FormData) {
  await requireAdmin();

  const id = num(formData.get("orderId"));
  const status = str(formData.get("status"));

  if (!id || !ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    return;
  }

  // Delivered means the cash has been handed over.
  const paymentStatus = status === "delivered" ? "paid" : undefined;

  await db
    .update(orders)
    .set({
      status,
      ...(paymentStatus ? { paymentStatus } : {}),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, id));

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
}

export async function setOrderPayment(formData: FormData) {
  await requireAdmin();
  const id = num(formData.get("orderId"));
  const paymentStatus = str(formData.get("paymentStatus"));
  if (!id || !["pending", "paid"].includes(paymentStatus)) return;

  await db
    .update(orders)
    .set({ paymentStatus, updatedAt: new Date() })
    .where(eq(orders.id, id));

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function saveOrderNote(formData: FormData) {
  await requireAdmin();
  const id = num(formData.get("orderId"));
  if (!id) return;

  await db
    .update(orders)
    .set({ adminNote: str(formData.get("adminNote")) || null, updatedAt: new Date() })
    .where(eq(orders.id, id));

  revalidatePath(`/admin/orders/${id}`);
}

// -------------------------------------------------------------- products

export async function saveProduct(formData: FormData) {
  await requireAdmin();

  const id = num(formData.get("productId"));
  if (!id) return;

  const status = str(formData.get("status"));

  await db
    .update(products)
    .set({
      name: str(formData.get("name")),
      tagline: str(formData.get("tagline")) || null,
      description: str(formData.get("description")) || null,
      house: str(formData.get("house")) || "Khanams Grassfed",
      kind: str(formData.get("kind")) === "fresh" ? "fresh" : "dry",
      status: ["active", "coming_soon", "hidden"].includes(status) ? status : "active",
      subscribable: formData.get("subscribable") === "on",
      image: str(formData.get("image")) || null,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/shop");
  revalidatePath("/");
}

/** Saves every variant row of one product in a single submit. */
export async function saveVariants(formData: FormData) {
  await requireAdmin();

  const productId = num(formData.get("productId"));
  const ids = formData.getAll("variantId").map((v) => num(v));
  if (!productId || ids.length === 0) return;

  for (const variantId of ids) {
    if (!variantId) continue;

    const price = num(formData.get(`price_${variantId}`), -1);
    const subPriceRaw = str(formData.get(`subPrice_${variantId}`));
    const label = str(formData.get(`label_${variantId}`));
    const inStock = formData.get(`inStock_${variantId}`) === "on";

    if (price < 0 || !label) continue;

    await db
      .update(variants)
      .set({
        label,
        pricePaise: toPaise(price),
        subscriberPricePaise: subPriceRaw ? toPaise(Number(subPriceRaw)) : null,
        inStock,
      })
      .where(eq(variants.id, variantId));
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/shop");
  revalidatePath("/");
}

export async function addVariant(formData: FormData) {
  await requireAdmin();

  const productId = num(formData.get("productId"));
  const label = str(formData.get("newLabel"));
  const price = num(formData.get("newPrice"), -1);

  if (!productId || !label || price < 0) return;

  const existing = await db
    .select()
    .from(variants)
    .where(eq(variants.productId, productId));

  await db.insert(variants).values({
    productId,
    label,
    pricePaise: toPaise(price),
    sortOrder: existing.length,
    inStock: true,
  });

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/shop");
}

export async function deleteVariant(formData: FormData) {
  await requireAdmin();

  const variantId = num(formData.get("variantId"));
  const productId = num(formData.get("productId"));
  if (!variantId) return;

  await db.delete(variants).where(eq(variants.id, variantId));

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/shop");
}

// -------------------------------------------------------------- settings

export async function saveSettings(formData: FormData) {
  await requireAdmin();

  const deliveryDays = [0, 1, 2, 3, 4, 5, 6].filter(
    (d) => formData.get(`day_${d}`) === "on",
  );

  await db
    .update(settingsTable)
    .set({
      storeName: str(formData.get("storeName")),
      storePhone: str(formData.get("storePhone")),
      whatsappNumber: str(formData.get("whatsappNumber")),
      storeEmail: str(formData.get("storeEmail")) || null,
      storeAddress: str(formData.get("storeAddress")),
      fssai: str(formData.get("fssai")),
      instagram: str(formData.get("instagram")) || null,
      facebook: str(formData.get("facebook")) || null,
      youtube: str(formData.get("youtube")) || null,

      localDeliveryFeePaise: toPaise(num(formData.get("localFee"))),
      localFreeAbovePaise: toPaise(num(formData.get("localFreeAbove"))),
      courierFeePaise: toPaise(num(formData.get("courierFee"))),
      courierFreeAbovePaise: toPaise(num(formData.get("courierFreeAbove"))),

      cutoffHour: Math.min(23, Math.max(0, num(formData.get("cutoffHour"), 20))),
      cutoffMinute: Math.min(59, Math.max(0, num(formData.get("cutoffMinute"), 0))),
      deliverySlot: str(formData.get("deliverySlot")),
      deliveryDays: deliveryDays.length > 0 ? deliveryDays : [0, 1, 2, 3, 4, 5, 6],
      freshDeliveryCity: str(formData.get("freshDeliveryCity")),

      announcement: str(formData.get("announcement")) || null,
      ordersPaused: formData.get("ordersPaused") === "on",
      updatedAt: new Date(),
    })
    .where(eq(settingsTable.id, 1));

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}

export async function addPincode(formData: FormData) {
  await requireAdmin();

  const pincode = str(formData.get("pincode"));
  if (!isPincode(pincode)) return;

  try {
    await db.insert(deliveryPincodes).values({
      pincode,
      area: str(formData.get("area")) || null,
      active: true,
    });
  } catch {
    // Already in the list — nothing to do.
  }

  revalidatePath("/admin/settings");
}

export async function togglePincode(formData: FormData) {
  await requireAdmin();

  const id = num(formData.get("pincodeId"));
  if (!id) return;

  const [row] = await db
    .select()
    .from(deliveryPincodes)
    .where(eq(deliveryPincodes.id, id))
    .limit(1);
  if (!row) return;

  await db
    .update(deliveryPincodes)
    .set({ active: !row.active })
    .where(eq(deliveryPincodes.id, id));

  revalidatePath("/admin/settings");
}
