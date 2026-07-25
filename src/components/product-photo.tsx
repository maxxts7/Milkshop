import Image from "next/image";

/**
 * Kashmiri Wari and Goat Cheese have no photograph in the brand assets.
 * Rather than borrow a stock image that isn't the actual product, they get a
 * typographic plate in the brand's own type. Replace via the admin when you
 * have real photography.
 */
export function ProductPhoto({
  src,
  alt,
  name,
  house,
  priority = false,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  className = "",
}: {
  src?: string | null;
  alt: string;
  name: string;
  house?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div className="absolute inset-0 grid place-items-center bg-cream px-6 text-center">
      <div>
        {house ? (
          <p className="eyebrow mb-3">{house}</p>
        ) : null}
        <p className="font-display text-2xl md:text-3xl leading-tight text-ink">
          {name}
        </p>
        <div className="mt-4 mx-auto h-px w-10 bg-rule-strong" />
        <p className="mt-3 text-[0.625rem] tracking-[0.18em] uppercase text-ink-muted">
          Photography coming soon
        </p>
      </div>
    </div>
  );
}
