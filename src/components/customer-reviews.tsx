import { LeafIcon } from "./icons";

/**
 * What customers have actually said, verbatim.
 *
 * Nothing goes in this list that was not really said — an invented review is
 * worse than a short list. Add to it as feedback comes in; the layout centres
 * itself, so one, two or six all sit correctly.
 */
interface Review {
  quote: string;
  attribution: string;
}

const REVIEWS: Review[] = [
  {
    quote:
      "She asked, is this milk fresh? I said, little one, three hours ago it was grass.",
    attribution: "A morning delivery in Srinagar",
  },
];

export function CustomerReviews() {
  if (REVIEWS.length === 0) return null;

  return (
    <section className="bg-cream">
      <div className="wrap py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <p className="eyebrow mb-3">Customer reviews</p>
          <h2 className="font-display text-3xl md:text-5xl leading-tight">
            What people tell us
          </h2>
          <div className="flex items-center justify-center gap-4 mt-6">
            <span className="h-px w-14 sm:w-20 bg-fresh/30" />
            <LeafIcon className="h-4 w-4 text-fresh shrink-0" />
            <span className="h-px w-14 sm:w-20 bg-fresh/30" />
          </div>
        </div>

        <ul className="flex flex-wrap justify-center gap-6">
          {REVIEWS.map((review) => (
            <li
              key={review.quote}
              className="w-full sm:w-[22rem] bg-paper border border-rule p-7 md:p-8 flex flex-col"
            >
              <blockquote className="font-display text-xl md:text-2xl leading-relaxed text-ink grow">
                &ldquo;{review.quote}&rdquo;
              </blockquote>
              <p className="eyebrow mt-6">{review.attribution}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
