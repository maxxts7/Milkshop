import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Khanams Grassfed — Fresh Kashmiri dairy, honey & ghee",
    template: "%s · Khanams Grassfed",
  },
  description:
    "Raw grass-fed cow and goat milk, handmade dahi, raw Kashmiri honey, traditional cow ghee and desi eggs. Delivered fresh across Srinagar, shipped across India.",
  keywords: [
    "Kashmiri dairy",
    "raw milk Srinagar",
    "Milk House",
    "Honey House",
    "cow ghee",
    "raw honey Kashmir",
    "desi eggs Srinagar",
  ],
  openGraph: {
    type: "website",
    siteName: "Khanams Grassfed",
    title: "Khanams Grassfed — Fresh Kashmiri dairy, honey & ghee",
    description:
      "From our farm to your home. Grass-fed milk, handmade dahi, raw honey and traditional ghee.",
    images: ["/images/brand/poster-khanams.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
