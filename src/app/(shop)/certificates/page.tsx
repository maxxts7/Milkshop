import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckIcon, LeafIcon, ShieldIcon } from "@/components/icons";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = {
  title: "Certificates & reports",
  description:
    "The certification and independent milk analysis behind Khanams Grassfed — issued by SKUAST Kashmir and IAH & BP, Zakura, Srinagar.",
};

/**
 * Every figure below is transcribed from the analysis sheet itself rather than
 * shown as a photograph of it, so the numbers stay legible on a phone and can
 * be read out by a screen reader. The certificate is a scan, so that one is an
 * image — full size behind a link for anyone who wants to inspect it.
 */
const ANALYSIS = [
  ["Fat %", "4.6"],
  ["SNF (Solid Not Fat) %", "9.9"],
  ["Density", "31"],
  ["Protein %", "3.3"],
  ["Lactose %", "5.0"],
  ["Water content % (added)", "0.00"],
  ["Temperature of milk (°C)", "0.7"],
  ["Salt %", "0.7"],
  ["CLR (Corrected Lactometer Reading)", "34.5"],
  ["Freezing point (°C)", "0.601"],
];

const REPORT_META = [
  ["Tested by", "IAH & BP, Zakura, Srinagar"],
  ["Date of analysis", "16 November 2023"],
  ["Report no.", "AP/22/29"],
];

export default async function CertificatesPage() {
  const settings = await getSettings();

  return (
    <>
      <section className="wrap py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">Certificates &amp; reports</p>
          <h1 className="font-display text-4xl md:text-6xl leading-tight mb-8">
            Purity you can check for yourself
          </h1>
          <p className="text-lg text-ink-soft leading-relaxed">
            We would rather show you the paperwork than ask you to take our word
            for it. Below is our certification and the independent analysis of
            our milk, alongside our FSSAI licence number.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------- the certificate */}
      <section className="bg-cream">
        <div className="wrap py-16 md:py-24">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display text-3xl md:text-4xl leading-tight mb-4">
              Certificate of completion
            </h2>
            <p className="text-ink-soft leading-relaxed">
              Issued by Sher-e-Kashmir University of Agricultural Sciences and
              Technology through the Daksh Kisan portal of the Agriculture
              Production Department, J&amp;K. Certificate no. HADP/DK/1695,
              dated 14 December 2024.
            </p>
          </div>

          <figure className="max-w-4xl">
            <a
              href="/images/certificates/skuast-daksh-kisan.jpg"
              target="_blank"
              rel="noopener noreferrer"
              className="block photo border border-rule-strong bg-paper"
            >
              <Image
                src="/images/certificates/skuast-daksh-kisan.jpg"
                alt="Certificate of completion issued to Khanams Grassfed by SKUAST Kashmir, certificate number HADP/DK/1695, dated 14 December 2024"
                width={1032}
                height={602}
                sizes="(min-width: 1024px) 56rem, 100vw"
                className="w-full h-auto"
              />
            </a>
            <figcaption className="text-sm text-ink-muted mt-3">
              Tap the certificate to open it full size.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ---------------------------------------------- the milk analysis */}
      <section className="wrap py-16 md:py-24">
        <div className="max-w-2xl mb-10">
          <h2 className="font-display text-3xl md:text-4xl leading-tight mb-4">
            Milk analysis report
          </h2>
          <p className="text-ink-soft leading-relaxed">
            Lacto-scan values from an independent laboratory. Note line six:
            no added water, which is the one most people want to see.
          </p>
        </div>

        <dl className="grid gap-6 sm:grid-cols-3 max-w-3xl mb-10">
          {REPORT_META.map(([label, value]) => (
            <div key={label}>
              <dt className="eyebrow mb-1.5">{label}</dt>
              <dd className="text-sm text-ink-soft leading-relaxed">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="scroll-x border border-rule max-w-3xl">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Milk analysis report AP/22/29, lacto-scan values
            </caption>
            <thead>
              <tr className="bg-fresh text-paper text-left">
                <th scope="col" className="font-medium px-4 py-3">
                  Parameter
                </th>
                <th scope="col" className="font-medium px-4 py-3 text-right">
                  Lacto-scan value
                </th>
              </tr>
            </thead>
            <tbody>
              {ANALYSIS.map(([parameter, value], i) => (
                <tr
                  key={parameter}
                  className={i % 2 === 1 ? "bg-paper-warm" : undefined}
                >
                  <th
                    scope="row"
                    className="font-normal text-left px-4 py-3 border-t border-rule"
                  >
                    {parameter}
                  </th>
                  <td className="px-4 py-3 text-right tabular-nums border-t border-rule">
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-ink-muted mt-4 max-w-3xl">
          Signed by the Assistant Research Officer, Parasitology / Pathology
          Lab, IAH &amp; BP, Zakura.
        </p>
      </section>

      {/* --------------------------------------------------------- FSSAI */}
      <section className="bg-fresh text-paper">
        <div className="wrap py-12 md:py-16 grid gap-7 sm:grid-cols-3">
          {[
            {
              icon: <ShieldIcon className="h-5 w-5" />,
              title: `FSSAI Lic. No. ${settings.fssai}`,
              body: "Licensed and inspected",
            },
            {
              icon: <CheckIcon className="h-5 w-5" />,
              title: "Lab tested",
              body: "No water, no powder, no preservatives",
            },
            {
              icon: <LeafIcon className="h-5 w-5" />,
              title: "Grass-fed herds",
              body: "Open grazing, not feedlot concentrate",
            },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-4">
              <span className="inline-flex shrink-0 items-center justify-center h-11 w-11 rounded-full border border-white/35">
                {f.icon}
              </span>
              <div>
                <h3 className="font-display text-base leading-snug mb-0.5">
                  {f.title}
                </h3>
                <p className="text-sm text-white/65 leading-snug">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap py-16 md:py-24">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl md:text-4xl mb-6 leading-tight">
            Anything else you would like to see?
          </h2>
          <p className="text-ink-soft leading-relaxed mb-8">
            Come to the farm, or ask us — we are happy to show you around and
            answer anything about how the milk is produced.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop" className="btn btn-solid">
              Shop the range
            </Link>
            <Link href="/contact" className="btn btn-outline">
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
