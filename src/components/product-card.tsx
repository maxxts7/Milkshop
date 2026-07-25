import Link from "next/link";
import { formatPaise } from "@/lib/money";
import { entryPrice, isSoldOut, type ProductWithVariants } from "@/lib/store";
import { ProductPhoto } from "./product-photo";

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductWithVariants;
  priority?: boolean;
}) {
  const from = entryPrice(product);
  const soldOut = isSoldOut(product);
  const comingSoon = product.status === "coming_soon";
  const multiple = product.variants.length > 1;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="photo aspect-[4/5] mb-4">
        <ProductPhoto
          src={product.image}
          alt={product.name}
          name={product.name}
          house={product.house}
          priority={priority}
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />

        {comingSoon ? (
          <span className="tag absolute top-3 left-3 bg-ink text-paper">
            Coming soon
          </span>
        ) : soldOut ? (
          <span className="tag absolute top-3 left-3 bg-alert-soft text-alert">
            Out of stock
          </span>
        ) : product.kind === "fresh" ? (
          <span className="tag absolute top-3 left-3 bg-fresh-soft text-fresh">
            Fresh daily
          </span>
        ) : null}
      </div>

      <p className="eyebrow mb-1.5">{product.house}</p>
      <h3 className="font-display text-lg leading-snug mb-1 group-hover:underline underline-offset-4 decoration-1">
        {product.name}
      </h3>

      {comingSoon ? (
        <p className="text-sm text-ink-muted">Join the waiting list</p>
      ) : from !== null ? (
        <p className="text-sm text-ink-soft">
          {multiple ? "From " : ""}
          <span className="text-ink">{formatPaise(from)}</span>
          {product.variants.length === 1 ? (
            <span className="text-ink-muted"> · {product.variants[0].label}</span>
          ) : null}
        </p>
      ) : null}
    </Link>
  );
}
