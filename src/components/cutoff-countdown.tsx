"use client";

import { useEffect, useState } from "react";
import { ClockIcon } from "./icons";

/**
 * The cutoff moment is computed on the server (in IST) and passed in as an
 * epoch, so a customer with a wrong device clock still sees the right deadline
 * relative to their own now — and the number never disagrees with the server.
 */
export function CutoffCountdown({
  cutoffAt,
  deliveryLabel,
  slot,
  className = "",
}: {
  cutoffAt: number;
  deliveryLabel: string;
  slot: string;
  className?: string;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(cutoffAt - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cutoffAt]);

  // Render the static half on the server; the clock appears on hydration.
  const countdown = (() => {
    if (remaining === null) return null;
    if (remaining <= 0) return null;
    const totalMinutes = Math.floor(remaining / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = Math.floor((remaining % 60000) / 1000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  })();

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <ClockIcon className="h-5 w-5 shrink-0 mt-0.5 text-ink-soft" />
      <p className="text-sm leading-relaxed">
        {countdown ? (
          <>
            <span className="font-medium">Order within {countdown}</span> for
            delivery on{" "}
          </>
        ) : (
          <>Next delivery is </>
        )}
        <span className="font-medium">{deliveryLabel}</span>, {slot}.
      </p>
    </div>
  );
}
