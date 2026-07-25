import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-6 text-center">
      <div>
        <Image
          src="/images/brand/logo-mark.png"
          alt="Milk House by Khanams Grassfed"
          width={768}
          height={712}
          className="h-24 w-auto mx-auto mb-10"
        />
        <p className="eyebrow mb-4">404</p>
        <h1 className="font-display text-4xl md:text-5xl mb-4">
          This page has gone off
        </h1>
        <p className="text-ink-soft mb-8 max-w-sm mx-auto leading-relaxed">
          We couldn&rsquo;t find what you were looking for. The milk, however, is
          still fresh.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/" className="btn btn-solid">
            Back home
          </Link>
          <Link href="/shop" className="btn btn-outline">
            Go to the shop
          </Link>
        </div>
      </div>
    </div>
  );
}
