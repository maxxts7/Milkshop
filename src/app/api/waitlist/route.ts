import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, waitlist } from "@/lib/db/schema";
import { isPhone, normalisePhone } from "@/lib/delivery";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  productId: z.number().int().positive(),
  phone: z.string().trim().min(1),
  name: z.string().trim().max(80).optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in the form." }, { status: 400 });
  }

  const phone = normalisePhone(parsed.data.phone);
  if (!isPhone(phone)) {
    return NextResponse.json(
      { error: "Please enter a valid 10-digit Indian mobile number." },
      { status: 400 },
    );
  }

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, parsed.data.productId))
    .limit(1);

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  try {
    await db.insert(waitlist).values({
      productId: product.id,
      phone,
      name: parsed.data.name || null,
    });
  } catch {
    // Unique index on (productId, phone) — signing up twice is a success,
    // not an error the customer should ever see.
  }

  return NextResponse.json({ ok: true });
}
