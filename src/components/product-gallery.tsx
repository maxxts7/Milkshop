"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductPhoto } from "./product-photo";

export function ProductGallery({
  images,
  name,
  house,
}: {
  images: string[];
  name: string;
  house: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="photo aspect-[4/5]">
        <ProductPhoto src={null} alt={name} name={name} house={house} priority />
      </div>
    );
  }

  return (
    <div>
      <div className="photo aspect-[4/5] mb-3">
        <Image
          key={images[active]}
          src={images[active]}
          alt={`${name} — image ${active + 1} of ${images.length}`}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 ? (
        <div className="scroll-x -mx-1 px-1">
          <div className="flex gap-3 w-max">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === active}
                className={`relative h-20 w-20 shrink-0 overflow-hidden border transition-colors ${
                  i === active ? "border-ink" : "border-rule hover:border-rule-strong"
                }`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
