/**
 * SMS delivery, behind an adapter.
 *
 * With SMS_PROVIDER unset every message prints to the server log — the whole
 * OTP flow works end to end with no account and no spend, which is what you
 * want while testing. Set SMS_PROVIDER=msg91 and fill the keys to go live.
 */

export interface SmsResult {
  ok: boolean;
  provider: string;
  error?: string;
}

async function sendViaMsg91(phone: string, otp: string): Promise<SmsResult> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authKey || !templateId) {
    return {
      ok: false,
      provider: "msg91",
      error: "MSG91_AUTH_KEY or MSG91_TEMPLATE_ID missing",
    };
  }

  try {
    const res = await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: authKey,
      },
      body: JSON.stringify({
        template_id: templateId,
        mobile: `91${phone}`,
        otp,
        sender: process.env.MSG91_SENDER_ID || undefined,
      }),
    });

    if (!res.ok) {
      return { ok: false, provider: "msg91", error: `HTTP ${res.status}` };
    }
    return { ok: true, provider: "msg91" };
  } catch (err) {
    return {
      ok: false,
      provider: "msg91",
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

export async function sendOtpSms(phone: string, otp: string): Promise<SmsResult> {
  const provider = (process.env.SMS_PROVIDER || "").toLowerCase();

  if (provider === "msg91") {
    const result = await sendViaMsg91(phone, otp);
    if (!result.ok) {
      // Never strand the customer because a provider is misconfigured —
      // log the code so the flow stays testable, and surface the error.
      console.error(`[sms] msg91 failed: ${result.error}`);
      console.log(`[sms] OTP for ${phone} is ${otp}`);
    }
    return result;
  }

  console.log(
    `\n[sms] ─────────────────────────────────────\n` +
      `[sms]  OTP for +91 ${phone} is  ${otp}\n` +
      `[sms]  (console mode — set SMS_PROVIDER=msg91 to send real SMS)\n` +
      `[sms] ─────────────────────────────────────\n`,
  );
  return { ok: true, provider: "console" };
}
