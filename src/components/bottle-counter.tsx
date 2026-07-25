"use client";

import { useEffect, useState } from "react";
import {
  formatBottles,
  getBottleCount,
  type BottleCount,
} from "@/lib/bottle-count";
import { BottleIcon, ClockIcon, GoatIcon, LeafIcon, TrendUpIcon } from "./icons";

/**
 * Keeps a board in step with the clock.
 *
 * The first render uses the count the server worked out, so the markup matches
 * and hydration stays quiet; the ticking only starts once we are in the
 * browser. Every tick recomputes from scratch rather than adding to a running
 * total, so a backgrounded tab catches up the moment it wakes.
 */
function useBottleCount(initial: BottleCount): BottleCount {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    setCount(getBottleCount());
    const id = setInterval(() => setCount(getBottleCount()), 1000);
    return () => clearInterval(id);
  }, []);

  return count;
}

const REEL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** One split-flap tile. The reel slides; only the tile's window is visible. */
function Digit({ digit }: { digit: number }) {
  return (
    <span className="digit-tile" aria-hidden="true">
      <span
        className="digit-reel"
        style={{ transform: `translateY(-${digit * 10}%)` }}
      >
        {REEL.map((n) => (
          <span key={n} className="digit-cell">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

function Odometer({ value, places = 5 }: { value: number; places?: number }) {
  const digits = String(value).padStart(places, "0").slice(-places);

  return (
    <span
      className="flex justify-center gap-1 sm:gap-1.5"
      role="img"
      aria-label={`${formatBottles(value)} bottles`}
    >
      {digits.split("").map((d, i) => (
        <Digit key={i} digit={Number(d)} />
      ))}
    </span>
  );
}

function Board({
  label,
  icon,
  value,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
}) {
  return (
    <div className="flex-1 rounded-xl bg-paper-warm/95 backdrop-blur-sm px-4 py-5 sm:px-6 sm:py-6 shadow-lg shadow-ink/10 text-center">
      <p className="eyebrow !text-fresh mb-3 sm:mb-4">{label}</p>
      <div className="flex justify-center text-fresh mb-3 sm:mb-4">{icon}</div>
      <Odometer value={value} />
      <p className="eyebrow !text-fresh mt-3 sm:mt-4">Bottles</p>
    </div>
  );
}

/** The pair of live boards that sit in the home page hero. */
export function BottleBoards({ initial }: { initial: BottleCount }) {
  const count = useBottleCount(initial);

  return (
    <div>
      <h2 className="font-display text-xl sm:text-2xl md:text-3xl text-fresh text-center mb-5 md:mb-6">
        Live bottle count — today
      </h2>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 max-w-3xl mx-auto">
        <Board
          label="Milk bottles sold today"
          icon={<BottleIcon className="h-7 w-7 sm:h-8 sm:w-8" />}
          value={count.milkToday}
        />
        <Board
          label="Goat milk bottles sold today"
          icon={<GoatIcon className="h-7 w-7 sm:h-8 sm:w-8" />}
          value={count.goatToday}
        />
      </div>

      <p className="flex items-center justify-center gap-2 mt-4 text-xs sm:text-sm text-ink-soft">
        <ClockIcon className="h-4 w-4 shrink-0" />
        {count.live
          ? "Live count — updating through the morning"
          : `Today's bottling is done — the boards move again from 9:00 AM`}
      </p>
    </div>
  );
}

function StatFigure({
  label,
  icon,
  value,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
}) {
  return (
    <div className="flex-1 text-center">
      <p className="eyebrow mb-4">{label}</p>
      <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-fresh text-paper mb-4">
        {icon}
      </span>
      <p className="font-display text-3xl md:text-4xl text-fresh tabular-nums leading-none">
        {formatBottles(value)}
      </p>
      <p className="eyebrow mt-2">Bottles</p>
    </div>
  );
}

function StatPanel({
  title,
  milk,
  goat,
  note,
}: {
  title: string;
  milk: number;
  goat: number;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-rule bg-paper-warm p-6 md:p-8">
      <p className="flex items-center justify-center gap-2.5 eyebrow !text-fresh mb-7">
        <LeafIcon className="h-3.5 w-3.5 shrink-0" />
        {title}
        <LeafIcon className="h-3.5 w-3.5 shrink-0 -scale-x-100" />
      </p>

      <div className="flex gap-4 divide-x divide-rule">
        <StatFigure
          label="Milk bottles sold"
          icon={<BottleIcon className="h-6 w-6" />}
          value={milk}
        />
        <StatFigure
          label="Goat milk bottles sold"
          icon={<GoatIcon className="h-6 w-6" />}
          value={goat}
        />
      </div>

      <p className="flex items-center justify-center gap-2 mt-7 rounded-lg bg-cream px-4 py-3 text-xs sm:text-sm text-ink-soft text-center">
        <TrendUpIcon className="h-4 w-4 shrink-0 text-fresh" />
        {note}
      </p>
    </div>
  );
}

/** Month and year panels, both derived from the same live boards. */
export function BottleStats({ initial }: { initial: BottleCount }) {
  const count = useBottleCount(initial);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <StatPanel
        title={`This month (${count.monthName} ${count.year})`}
        milk={count.milkMonth}
        goat={count.goatMonth}
        note="Thank you for choosing purity and supporting local."
      />
      <StatPanel
        title={`This year (${count.year})`}
        milk={count.milkYear}
        goat={count.goatYear}
        note="Your trust motivates us to keep improving every day."
      />
    </div>
  );
}
