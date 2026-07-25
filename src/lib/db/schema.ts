import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * All money is stored as INTEGER PAISE (₹60 => 6000).
 * Never store money as a float.
 */

// ---------------------------------------------------------------- catalogue

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    // "Milk House" | "Honey House" | "Khanams Grassfed"
    house: text("house").notNull().default("Khanams Grassfed"),
    tagline: text("tagline"),
    description: text("description"),
    // fresh = perishable, Srinagar-only. dry = shelf stable, ships pan-India.
    kind: text("kind").notNull().default("dry"), // 'fresh' | 'dry'
    // active = buyable, coming_soon = waitlist only, hidden = off the site
    status: text("status").notNull().default("active"),
    image: text("image"),
    gallery: jsonb("gallery").$type<string[]>().default([]),
    // bullet points shown on the product page
    highlights: jsonb("highlights").$type<string[]>().default([]),
    subscribable: boolean("subscribable").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("products_slug_idx").on(t.slug)],
);

export const variants = pgTable(
  "variants",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    // "1 litre", "500 g", "Dozen (12)"
    label: text("label").notNull(),
    sku: text("sku"),
    pricePaise: integer("price_paise").notNull(),
    // null => subscriptions use the normal price
    subscriberPricePaise: integer("subscriber_price_paise"),
    inStock: boolean("in_stock").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("variants_product_idx").on(t.productId)],
);

// ---------------------------------------------------------------- customers

export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    phone: text("phone").notNull(), // 10-digit, no country code
    name: text("name"),
    email: text("email"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("customers_phone_idx").on(t.phone)],
);

export const addresses = pgTable(
  "addresses",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    label: text("label").default("Home"),
    line1: text("line1").notNull(),
    line2: text("line2"),
    landmark: text("landmark"),
    city: text("city").notNull().default("Srinagar"),
    state: text("state").notNull().default("Jammu & Kashmir"),
    pincode: text("pincode").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("addresses_customer_idx").on(t.customerId)],
);

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: serial("id").primaryKey(),
    phone: text("phone").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("otp_phone_idx").on(t.phone)],
);

// ---------------------------------------------------------------- orders

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    orderNumber: text("order_number").notNull(),
    customerId: integer("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),

    contactName: text("contact_name").notNull(),
    contactPhone: text("contact_phone").notNull(),
    contactEmail: text("contact_email"),

    fulfilment: text("fulfilment").notNull(), // 'delivery' | 'pickup'
    zone: text("zone").notNull(), // 'srinagar' | 'india' | 'pickup'

    // address snapshot — orders must not change when an address is edited
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    landmark: text("landmark"),
    city: text("city"),
    state: text("state"),
    pincode: text("pincode"),

    subtotalPaise: integer("subtotal_paise").notNull(),
    deliveryFeePaise: integer("delivery_fee_paise").notNull().default(0),
    totalPaise: integer("total_paise").notNull(),

    paymentMethod: text("payment_method").notNull().default("cod"), // 'cod' | 'pickup'
    paymentStatus: text("payment_status").notNull().default("pending"), // 'pending' | 'paid'

    // placed → confirmed → packed → out_for_delivery → delivered | cancelled
    status: text("status").notNull().default("placed"),

    deliveryDate: date("delivery_date"),
    deliverySlot: text("delivery_slot"),
    customerNote: text("customer_note"),
    adminNote: text("admin_note"),

    // set when this order was generated from a subscription run
    subscriptionId: integer("subscription_id"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("orders_number_idx").on(t.orderNumber),
    index("orders_customer_idx").on(t.customerId),
    index("orders_status_idx").on(t.status),
    index("orders_delivery_date_idx").on(t.deliveryDate),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    variantId: integer("variant_id").references(() => variants.id, {
      onDelete: "set null",
    }),
    // snapshots — an order receipt must survive a catalogue rename
    productName: text("product_name").notNull(),
    variantLabel: text("variant_label").notNull(),
    image: text("image"),
    unitPricePaise: integer("unit_price_paise").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalPaise: integer("line_total_paise").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

// ---------------------------------------------------------------- subscriptions

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    variantId: integer("variant_id")
      .notNull()
      .references(() => variants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    // 'daily' | 'alternate' | 'weekly'
    frequency: text("frequency").notNull().default("daily"),
    // for 'weekly': 0=Sun … 6=Sat
    weekdays: jsonb("weekdays").$type<number[]>().default([]),
    startDate: date("start_date").notNull(),
    addressId: integer("address_id").references(() => addresses.id, {
      onDelete: "set null",
    }),
    // 'active' | 'paused' | 'cancelled'
    status: text("status").notNull().default("active"),
    pausedFrom: date("paused_from"),
    pausedUntil: date("paused_until"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("subs_customer_idx").on(t.customerId),
    index("subs_status_idx").on(t.status),
  ],
);

/** One-off skips ("I'm away on the 14th") on top of an active subscription. */
export const subscriptionSkips = pgTable(
  "subscription_skips",
  {
    id: serial("id").primaryKey(),
    subscriptionId: integer("subscription_id")
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    skipDate: date("skip_date").notNull(),
  },
  (t) => [uniqueIndex("skip_unique_idx").on(t.subscriptionId, t.skipDate)],
);

// ---------------------------------------------------------------- misc

export const waitlist = pgTable(
  "waitlist",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    phone: text("phone").notNull(),
    name: text("name"),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("waitlist_unique_idx").on(t.productId, t.phone)],
);

export const deliveryPincodes = pgTable(
  "delivery_pincodes",
  {
    id: serial("id").primaryKey(),
    pincode: text("pincode").notNull(),
    area: text("area"),
    active: boolean("active").notNull().default(true),
  },
  (t) => [uniqueIndex("pincode_unique_idx").on(t.pincode)],
);

export const adminUsers = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("admin_email_idx").on(t.email)],
);

/** Single row (id = 1) holding every operator-tunable number on the site. */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),

  storeName: text("store_name").notNull().default("Khanams Grassfed"),
  storePhone: text("store_phone").notNull().default("7006543918"),
  whatsappNumber: text("whatsapp_number").notNull().default("917006543918"),
  storeEmail: text("store_email").default("manuxtmail@gmail.com"),
  storeAddress: text("store_address")
    .notNull()
    .default("Naid Kadal, Makhdoom Mandav, near Ranger Masjid, Srinagar, Jammu & Kashmir"),
  fssai: text("fssai").notNull().default("21023414000059"),
  instagram: text("instagram").default("milkhouseby"),
  facebook: text("facebook").default("milkhouseby"),
  youtube: text("youtube").default("milkhouseby"),

  // delivery fees, all in paise
  localDeliveryFeePaise: integer("local_delivery_fee_paise").notNull().default(4000),
  localFreeAbovePaise: integer("local_free_above_paise").notNull().default(50000),
  courierFeePaise: integer("courier_fee_paise").notNull().default(9900),
  courierFreeAbovePaise: integer("courier_free_above_paise").notNull().default(150000),

  // fresh-order cutoff, 24h clock in IST
  cutoffHour: integer("cutoff_hour").notNull().default(20),
  cutoffMinute: integer("cutoff_minute").notNull().default(0),
  deliverySlot: text("delivery_slot").notNull().default("6:00 – 9:00 AM"),
  // 0=Sun … 6=Sat — days fresh delivery runs
  deliveryDays: jsonb("delivery_days").$type<number[]>().default([0, 1, 2, 3, 4, 5, 6]),

  freshDeliveryCity: text("fresh_delivery_city").notNull().default("Srinagar"),
  announcement: text("announcement"),
  ordersPaused: boolean("orders_paused").notNull().default(false),

  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------- types

export type Product = typeof products.$inferSelect;
export type Variant = typeof variants.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Settings = typeof settings.$inferSelect;
