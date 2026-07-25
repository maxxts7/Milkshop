/** Shared typography for the four policy documents. */

export function PolicyPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <h1 className="font-display text-4xl md:text-5xl mb-3 leading-tight">
        {title}
      </h1>
      <p className="eyebrow mb-10">Last updated {updated}</p>
      <div className="space-y-8">{children}</div>
    </>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-xl mb-3">{heading}</h2>
      <div className="space-y-3 text-ink-soft leading-relaxed [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-ink [&_strong]:font-medium">
        {children}
      </div>
    </section>
  );
}

export function DraftNotice() {
  return (
    <aside className="border border-rule bg-paper-warm px-5 py-4 text-sm text-ink-soft leading-relaxed">
      <strong className="text-ink font-medium">A note for the store owner:</strong>{" "}
      this document is a working draft written for a fresh-produce business in
      India. Please read it against how you actually operate, and have it checked
      by a legal adviser before you rely on it. It is not legal advice.
    </aside>
  );
}
