"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function LoginForm({ redirectTo = "/account" }: { redirectTo?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consoleMode, setConsoleMode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function post(body: Record<string, unknown>) {
    const res = await fetch("/api/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { res, json: await res.json() };
  }

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { res, json } = await post({ action: "request", phone });
      if (!res.ok) {
        setError(json.error ?? "Could not send the code.");
        if (json.retryAfterSeconds) setCooldown(json.retryAfterSeconds);
      } else {
        setConsoleMode(Boolean(json.consoleMode));
        setStep("code");
        setCooldown(60);
      }
    } catch {
      setError("Could not reach the server.");
    }
    setBusy(false);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { res, json } = await post({ action: "verify", phone, code });
      if (!res.ok) {
        setError(json.error ?? "That code is not right.");
        setBusy(false);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
      setBusy(false);
    }
  }

  return (
    <div className="max-w-sm">
      {step === "phone" ? (
        <form onSubmit={requestCode}>
          <label className="label" htmlFor="login-phone">
            Mobile number
          </label>
          <input
            id="login-phone"
            className="field mb-1"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit mobile"
            inputMode="numeric"
            autoComplete="tel"
            autoFocus
            required
          />
          <p className="text-xs text-ink-muted mb-5">
            We&rsquo;ll text you a 6-digit code. No password to remember.
          </p>

          {error ? (
            <p className="text-sm text-alert mb-4" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn-solid w-full" disabled={busy}>
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode}>
          <p className="text-sm text-ink-soft mb-5">
            Code sent to <strong className="text-ink font-medium">+91 {phone}</strong>.{" "}
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
              className="underline underline-offset-2"
            >
              Change
            </button>
          </p>

          {consoleMode ? (
            <p className="text-xs border border-rule bg-paper-warm px-3 py-2.5 mb-5 leading-relaxed">
              <strong className="font-medium">Test mode:</strong> no SMS provider is
              configured, so the code was printed to the server console instead of
              being texted.
            </p>
          ) : null}

          <label className="label" htmlFor="login-code">
            6-digit code
          </label>
          <input
            id="login-code"
            ref={codeRef}
            className="field mb-5 tracking-[0.5em] text-center text-lg"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
          />

          {error ? (
            <p className="text-sm text-alert mb-4" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn btn-solid w-full mb-3"
            disabled={busy || code.length < 6}
          >
            {busy ? "Checking…" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={() => requestCode()}
            disabled={cooldown > 0 || busy}
            className="text-sm text-ink-soft underline underline-offset-2 disabled:opacity-40 disabled:no-underline w-full text-center"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </form>
      )}
    </div>
  );
}
