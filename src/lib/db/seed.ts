/**
 * Seeds the catalogue, delivery pincodes, settings and the first admin user.
 * Safe to re-run: it clears catalogue tables first, but never touches orders,
 * customers or subscriptions.
 *
 *   npm run db:seed
 */
import "./load-env";
import bcrypt from "bcryptjs";
import { db } from "./index";
import {
  products,
  variants,
  settings,
  deliveryPincodes,
  adminUsers,
} from "./schema";
import { eq } from "drizzle-orm";

const rupees = (n: number) => Math.round(n * 100);

type SeedVariant = {
  label: string;
  price: number;
  subscriberPrice?: number;
  inStock?: boolean;
  sku?: string;
};

type SeedProduct = {
  slug: string;
  name: string;
  house: string;
  tagline?: string;
  description: string;
  kind: "fresh" | "dry";
  status?: "active" | "coming_soon" | "hidden";
  image?: string;
  gallery?: string[];
  highlights?: string[];
  subscribable?: boolean;
  variants: SeedVariant[];
};

const CATALOGUE: SeedProduct[] = [
  {
    slug: "fresh-cow-milk",
    name: "Fresh Cow Milk",
    house: "Milk House",
    tagline: "From our farm to your home.",
    description:
      "Raw, premium cow milk from grass-fed herds, bottled the morning it is milked and delivered in certified eco-friendly glass. Touch-free milking, automated bottling, no adulterants and no chemicals — the way milk is supposed to reach you.",
    kind: "fresh",
    image: "/images/products/cow-milk.jpg",
    gallery: [
      "/images/products/cow-milk.jpg",
      "/images/products/cow-milk-alt.jpg",
      "/images/lifestyle/grass-bottle.jpg",
    ],
    highlights: [
      "Touch-free milking, automated bottling",
      "No adulterants or chemicals",
      "Grass-fed cows",
      "Delivered in certified eco-friendly glass bottles",
    ],
    subscribable: true,
    variants: [
      { label: "500 ml", price: 32, subscriberPrice: 30, sku: "MH-CM-500" },
      { label: "1 litre", price: 63, subscriberPrice: 60, sku: "MH-CM-1000" },
      { label: "2 litres", price: 126, subscriberPrice: 120, sku: "MH-CM-2000" },
    ],
  },
  {
    slug: "fresh-goat-milk",
    name: "Fresh Goat Milk",
    house: "Milk House",
    tagline: "Naturally nutritious, easy to digest.",
    description:
      "Fresh goat milk from our own herds — naturally easier to digest than cow milk, rich in calcium and protein, and suitable for all ages. Bottled fresh each morning.",
    kind: "fresh",
    image: "/images/products/goat-milk.jpg",
    gallery: [
      "/images/products/goat-milk.jpg",
      "/images/products/goat-milk-study.jpg",
    ],
    highlights: [
      "Easy to digest",
      "Rich in calcium and protein",
      "Boosts immunity, supports strong bones",
      "Suitable for all ages",
    ],
    subscribable: true,
    variants: [
      { label: "500 ml", price: 125, sku: "MH-GM-500" },
      { label: "1 litre", price: 250, sku: "MH-GM-1000" },
    ],
  },
  {
    slug: "handmade-dahi",
    name: "Handmade Dahi",
    house: "Milk House",
    tagline: "Pure & yummy.",
    description:
      "Set by hand every day from our own fresh milk. Choose a glass, a traditional matka, or a clay handi — the earthenware keeps it cool and gives the dahi its character.",
    kind: "fresh",
    image: "/images/products/dahi.jpg",
    gallery: [
      "/images/products/dahi.jpg",
      "/images/products/dahi-matka.jpg",
      "/images/products/dahi-handi.jpg",
      "/images/products/dahi-alt.jpg",
    ],
    highlights: [
      "Set fresh daily from our own milk",
      "Traditional clay matka and handi",
      "No stabilisers or milk powder",
      "FSSAI certified",
    ],
    subscribable: true,
    variants: [
      { label: "Glass — 200 ml", price: 25, sku: "MH-DH-G200" },
      { label: "Matka — 200 ml", price: 30, sku: "MH-DH-M200" },
      { label: "Handi — 350 ml", price: 45, sku: "MH-DH-H350" },
      { label: "Handi — 500 ml", price: 75, sku: "MH-DH-H500" },
      { label: "Handi — 1,200 ml", price: 140, sku: "MH-DH-H1200" },
    ],
  },
  {
    slug: "kashmiri-desi-eggs",
    name: "Kashmiri Desi Eggs",
    house: "Khanams Grassfed",
    tagline: "Farm fresh, 100% natural.",
    description:
      "Desi eggs from free-roaming Kashmiri hens. High in protein, rich in vitamins, and collected fresh — never cold-stored for weeks.",
    kind: "fresh",
    image: "/images/products/eggs.jpg",
    gallery: ["/images/products/eggs.jpg"],
    highlights: [
      "High in protein",
      "Rich in vitamins",
      "Farm fresh, free-roaming hens",
      "₹25 per egg",
    ],
    subscribable: true,
    variants: [
      { label: "Half dozen (6)", price: 150, sku: "KG-EG-6" },
      { label: "Dozen (12)", price: 300, sku: "KG-EG-12" },
      { label: "Tray (30)", price: 750, sku: "KG-EG-30" },
    ],
  },
  {
    slug: "raw-organic-honey",
    name: "Raw Organic Honey",
    house: "Honey House",
    tagline: "100% raw and premium.",
    description:
      "Produce of Kashmir. Medium to dark amber, with a floral, fruity, slightly smoky and earthy taste. Raw, unheated and unfiltered — nothing added, nothing taken away. Ingredients: 100% bee love.",
    kind: "dry",
    image: "/images/products/honey.jpg",
    gallery: [
      "/images/products/honey.jpg",
      "/images/products/honey-alt.jpg",
      "/images/lifestyle/honey-pour.jpg",
      "/images/products/honey-label.jpg",
    ],
    highlights: [
      "Raw, unheated, unfiltered",
      "Produce of Kashmir",
      "Boosts immunity, rich in antioxidants",
      "No added sugar",
    ],
    variants: [
      { label: "250 g", price: 260, sku: "HH-RH-250" },
      { label: "500 g", price: 500, sku: "HH-RH-500" },
      { label: "1 kg", price: 950, sku: "HH-RH-1000" },
    ],
  },
  {
    slug: "honey-with-honeycomb",
    name: "Raw Honey with Honeycomb",
    house: "Honey House",
    tagline: "Raw & unfiltered, premium quality.",
    description:
      "A whole cut of natural honeycomb suspended in our raw Kashmiri honey. Comb and all — chew it, spread it, or serve it on a board. Pure, raw, unheated.",
    kind: "dry",
    image: "/images/products/honeycomb.jpg",
    gallery: ["/images/products/honeycomb.jpg"],
    highlights: [
      "Whole natural comb in raw honey",
      "Pure • Raw • Unheated",
      "Produce of Kashmir",
      "Presentation box included",
    ],
    variants: [{ label: "Comb box", price: 1600, sku: "HH-HC-BOX" }],
  },
  {
    slug: "authentic-cow-ghee",
    name: "Authentic Cow Ghee",
    house: "Khanams Grassfed",
    tagline: "Made the traditional way.",
    description:
      "Slow-cooked from pure desi cow milk using the traditional bilona method. Golden, deeply aromatic, and grainy the way real ghee should be. Easy to digest, good for the heart, rich in nutrition.",
    kind: "dry",
    image: "/images/products/ghee.jpg",
    gallery: ["/images/products/ghee.jpg"],
    highlights: [
      "Made from pure desi cow milk",
      "Slow cooked, traditional method",
      "Easy to digest, good for the heart",
      "Boosts energy",
    ],
    variants: [
      { label: "250 g", price: 420, sku: "KG-GH-250" },
      { label: "500 g", price: 800, sku: "KG-GH-500" },
      { label: "1 kg", price: 1600, sku: "KG-GH-1000" },
    ],
  },
  {
    slug: "kashmiri-wari",
    name: "Kashmiri Wari",
    house: "Khanams Grassfed",
    tagline: "Sun-dried lentil dumplings.",
    description:
      "Traditional Kashmiri wari — spiced lentil dumplings, hand-shaped and sun-dried the old way. A staple of the Kashmiri kitchen: crumble into a curry, or fry and eat as they are.",
    kind: "dry",
    highlights: [
      "Hand-shaped and sun-dried",
      "Traditional Kashmiri recipe",
      "No preservatives",
    ],
    variants: [
      { label: "150 g", price: 250, sku: "KG-WR-150" },
      { label: "300 g", price: 480, sku: "KG-WR-300" },
    ],
  },
  {
    slug: "mixed-vegetable-pickle",
    name: "Mixed Vegetable Pickle",
    house: "Khanams Grassfed",
    tagline: "Made in small batches.",
    description:
      "A traditional mixed vegetable achar made in small batches with local produce, mustard oil and hand-ground spices. Sharp, warming, and made to last the winter.",
    kind: "dry",
    image: "/images/products/pickle.jpg",
    gallery: ["/images/products/pickle.jpg"],
    highlights: [
      "Small-batch, hand-ground spices",
      "Local Kashmiri produce",
      "Mustard oil base",
      "No artificial preservatives",
    ],
    // Marked out of stock to match the "What's Available Today" poster.
    variants: [
      { label: "250 g", price: 110, inStock: false, sku: "KG-PK-250" },
      { label: "500 g", price: 215, inStock: false, sku: "KG-PK-500" },
      { label: "1 kg", price: 420, inStock: false, sku: "KG-PK-1000" },
    ],
  },
  {
    slug: "goat-cheese",
    name: "Goat Cheese",
    house: "Milk House",
    tagline: "Coming soon.",
    description:
      "Fresh goat cheese made from our own goat milk. In development now — leave your number and we'll message you the day the first batch is ready.",
    kind: "fresh",
    status: "coming_soon",
    highlights: ["Made from our own goat milk", "Launching soon"],
    variants: [],
  },
  {
    slug: "masala-tikki",
    name: "Masala Tikki",
    house: "Khanams Grassfed",
    tagline: "Coming back soon.",
    description:
      "Spiced Kashmiri tikki, shallow-fried and packed fresh. Currently unavailable — leave your number and we'll let you know the moment they're back.",
    kind: "fresh",
    status: "coming_soon",
    image: "/images/products/masala-tikki.jpg",
    gallery: ["/images/products/masala-tikki.jpg"],
    highlights: ["Traditional Kashmiri recipe", "Made to order in small batches"],
    variants: [],
  },
];

// Srinagar city pincodes.
const SRINAGAR_PINCODES: [string, string][] = [
  ["190001", "Srinagar GPO / Lal Chowk"],
  ["190002", "Habba Kadal"],
  ["190003", "Nowhatta / Rainawari"],
  ["190004", "Soura"],
  ["190005", "Chanapora"],
  ["190006", "Bemina"],
  ["190008", "Batmaloo"],
  ["190009", "Shalteng"],
  ["190010", "Zakura"],
  ["190011", "Nishat"],
  ["190012", "Hazratbal"],
  ["190014", "Parimpora"],
  ["190015", "Barzulla / Natipora"],
  ["190017", "Pantha Chowk"],
  ["190018", "Buchpora"],
  ["190019", "Lawaypora"],
  ["190020", "Harwan"],
  ["190021", "Nowgam"],
  ["190023", "Sanat Nagar"],
  ["190025", "Aloochi Bagh"],
];

async function main() {
  console.log("→ Seeding Khanams Grassfed…\n");

  // Catalogue is rebuilt from scratch; orders/customers are never touched.
  await db.delete(variants);
  await db.delete(products);

  let productCount = 0;
  let variantCount = 0;

  for (const [index, p] of CATALOGUE.entries()) {
    const [row] = await db
      .insert(products)
      .values({
        slug: p.slug,
        name: p.name,
        house: p.house,
        tagline: p.tagline,
        description: p.description,
        kind: p.kind,
        status: p.status ?? "active",
        image: p.image ?? null,
        gallery: p.gallery ?? [],
        highlights: p.highlights ?? [],
        subscribable: p.subscribable ?? false,
        sortOrder: index,
      })
      .returning();
    productCount++;

    for (const [vIndex, v] of p.variants.entries()) {
      await db.insert(variants).values({
        productId: row.id,
        label: v.label,
        sku: v.sku,
        pricePaise: rupees(v.price),
        subscriberPricePaise: v.subscriberPrice ? rupees(v.subscriberPrice) : null,
        inStock: v.inStock ?? true,
        sortOrder: vIndex,
      });
      variantCount++;
    }
    console.log(`  ✓ ${p.name} (${p.variants.length} variants)`);
  }

  // ---- pincodes
  await db.delete(deliveryPincodes);
  for (const [pincode, area] of SRINAGAR_PINCODES) {
    await db.insert(deliveryPincodes).values({ pincode, area, active: true });
  }
  console.log(`\n  ✓ ${SRINAGAR_PINCODES.length} Srinagar pincodes`);

  // ---- settings (single row, only created if missing)
  const existingSettings = await db.select().from(settings).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(settings).values({ id: 1 });
    console.log("  ✓ Settings row created with defaults");
  } else {
    console.log("  · Settings row already exists — left untouched");
  }

  // ---- first admin
  const email = process.env.ADMIN_EMAIL ?? "manuxtmail@gmail.com";
  const password = process.env.ADMIN_PASSWORD ?? "khanams@2026";
  const existingAdmin = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  if (existingAdmin.length === 0) {
    await db.insert(adminUsers).values({
      email,
      name: "Khanams Admin",
      passwordHash: await bcrypt.hash(password, 10),
    });
    console.log(`\n  ✓ Admin created`);
    console.log(`      email:    ${email}`);
    console.log(`      password: ${password}`);
    console.log(`      ⚠  Change this immediately after first login.`);
  } else {
    console.log(`\n  · Admin ${email} already exists — password unchanged`);
  }

  console.log(
    `\n✔ Done. ${productCount} products, ${variantCount} variants.\n`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("\n✖ Seed failed:\n", err);
  process.exit(1);
});
