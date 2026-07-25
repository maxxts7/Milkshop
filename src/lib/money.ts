/** Money is integer paise everywhere. These are the only places it becomes a string. */

export const toPaise = (rupees: number) => Math.round(rupees * 100);
export const toRupees = (paise: number) => paise / 100;

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const inrWithPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹1,600 — drops the decimals when the amount is whole rupees. */
export function formatPaise(paise: number): string {
  return paise % 100 === 0
    ? inr.format(paise / 100)
    : inrWithPaise.format(paise / 100);
}

/** "1,600" with no symbol, for inputs and tables. */
export function formatPaiseBare(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}
