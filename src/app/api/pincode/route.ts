import { NextResponse } from "next/server";
import { isPincode } from "@/lib/delivery";
import { getSettings, isPincodeServiceable } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim() ?? "";

  if (!isPincode(code)) {
    return NextResponse.json(
      { valid: false, serviceable: false, message: "Enter a 6-digit pincode." },
      { status: 400 },
    );
  }

  const [serviceable, settings] = await Promise.all([
    isPincodeServiceable(code),
    getSettings(),
  ]);

  return NextResponse.json({
    valid: true,
    serviceable,
    message: serviceable
      ? `We deliver fresh to ${code} — milk, dahi and eggs included.`
      : `${code} is outside our fresh delivery area. Honey, ghee, wari and pickle still ship to you.`,
    city: settings.freshDeliveryCity,
  });
}
