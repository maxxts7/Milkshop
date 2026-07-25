CREATE TABLE "addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"label" text DEFAULT 'Home',
	"line1" text NOT NULL,
	"line2" text,
	"landmark" text,
	"city" text DEFAULT 'Srinagar' NOT NULL,
	"state" text DEFAULT 'Jammu & Kashmir' NOT NULL,
	"pincode" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"name" text,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_pincodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"pincode" text NOT NULL,
	"area" text,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer,
	"variant_id" integer,
	"product_name" text NOT NULL,
	"variant_label" text NOT NULL,
	"image" text,
	"unit_price_paise" integer NOT NULL,
	"quantity" integer NOT NULL,
	"line_total_paise" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"customer_id" integer,
	"contact_name" text NOT NULL,
	"contact_phone" text NOT NULL,
	"contact_email" text,
	"fulfilment" text NOT NULL,
	"zone" text NOT NULL,
	"address_line1" text,
	"address_line2" text,
	"landmark" text,
	"city" text,
	"state" text,
	"pincode" text,
	"subtotal_paise" integer NOT NULL,
	"delivery_fee_paise" integer DEFAULT 0 NOT NULL,
	"total_paise" integer NOT NULL,
	"payment_method" text DEFAULT 'cod' NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"status" text DEFAULT 'placed' NOT NULL,
	"delivery_date" date,
	"delivery_slot" text,
	"customer_note" text,
	"admin_note" text,
	"subscription_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"house" text DEFAULT 'Khanams Grassfed' NOT NULL,
	"tagline" text,
	"description" text,
	"kind" text DEFAULT 'dry' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"image" text,
	"gallery" jsonb DEFAULT '[]'::jsonb,
	"highlights" jsonb DEFAULT '[]'::jsonb,
	"subscribable" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"store_name" text DEFAULT 'Khanams Grassfed' NOT NULL,
	"store_phone" text DEFAULT '7006543918' NOT NULL,
	"whatsapp_number" text DEFAULT '917006543918' NOT NULL,
	"store_email" text DEFAULT 'manuxtmail@gmail.com',
	"store_address" text DEFAULT 'Naid Kadal, Makhdoom Mandav, near Ranger Masjid, Srinagar, Jammu & Kashmir' NOT NULL,
	"fssai" text DEFAULT '21023414000059' NOT NULL,
	"instagram" text DEFAULT 'milkhouseby',
	"facebook" text DEFAULT 'milkhouseby',
	"youtube" text DEFAULT 'milkhouseby',
	"local_delivery_fee_paise" integer DEFAULT 4000 NOT NULL,
	"local_free_above_paise" integer DEFAULT 50000 NOT NULL,
	"courier_fee_paise" integer DEFAULT 9900 NOT NULL,
	"courier_free_above_paise" integer DEFAULT 150000 NOT NULL,
	"cutoff_hour" integer DEFAULT 20 NOT NULL,
	"cutoff_minute" integer DEFAULT 0 NOT NULL,
	"delivery_slot" text DEFAULT '6:00 – 9:00 AM' NOT NULL,
	"delivery_days" jsonb DEFAULT '[0,1,2,3,4,5,6]'::jsonb,
	"fresh_delivery_city" text DEFAULT 'Srinagar' NOT NULL,
	"announcement" text,
	"orders_paused" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_skips" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscription_id" integer NOT NULL,
	"skip_date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"variant_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"frequency" text DEFAULT 'daily' NOT NULL,
	"weekdays" jsonb DEFAULT '[]'::jsonb,
	"start_date" date NOT NULL,
	"address_id" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"paused_from" date,
	"paused_until" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"label" text NOT NULL,
	"sku" text,
	"price_paise" integer NOT NULL,
	"subscriber_price_paise" integer,
	"in_stock" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"phone" text NOT NULL,
	"name" text,
	"notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_skips" ADD CONSTRAINT "subscription_skips_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "addresses_customer_idx" ON "addresses" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_email_idx" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "pincode_unique_idx" ON "delivery_pincodes" USING btree ("pincode");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_number_idx" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_delivery_date_idx" ON "orders" USING btree ("delivery_date");--> statement-breakpoint
CREATE INDEX "otp_phone_idx" ON "otp_codes" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "skip_unique_idx" ON "subscription_skips" USING btree ("subscription_id","skip_date");--> statement-breakpoint
CREATE INDEX "subs_customer_idx" ON "subscriptions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "subs_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "variants_product_idx" ON "variants" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_unique_idx" ON "waitlist" USING btree ("product_id","phone");