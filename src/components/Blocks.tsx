/**
 * The page-building blocks of the reading system (DESIGN.md), adapted from
 * caprock.dev. A page is a stack of bands; each band has at most one heading
 * block and one body, at one of two widths.
 */

export function Band({
  id,
  soft = false,
  read = false,
  children,
  className = "",
}: {
  id?: string;
  soft?: boolean;
  /** One centred column at reading width instead of the 1200px grid. */
  read?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`band scroll-mt-6 ${soft ? "band-soft" : ""} ${className}`}>
      <div className={read ? "wrap-read" : "wrap"}>{children}</div>
    </section>
  );
}

/** Eyebrow, title and lead. */
export function Head({
  eyebrow,
  title,
  lead,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <div className="max-w-[46rem]">
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <Tag className={Tag === "h1" ? "t-page" : "t-title"}>{title}</Tag>
      {lead && <p className="t-lead measure mt-5">{lead}</p>}
    </div>
  );
}

/**
 * A row of big figures. Every figure comes from content or is true by
 * construction; `note` carries the date or the source.
 */
export function Stats({
  items,
}: {
  items: { value: string; label: string; note?: string; accent?: boolean }[];
}) {
  return (
    <dl className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((s) => (
        <div key={s.label} className="border-t border-line pt-5">
          <dt className="sr-only">{s.label}</dt>
          <dd className={`t-stat ${s.accent ? "text-accent" : "text-ink"}`}>{s.value}</dd>
          <dd className="mt-3 text-[1.0625rem] leading-snug text-ink">{s.label}</dd>
          {s.note && <dd className="t-small mt-1.5">{s.note}</dd>}
        </div>
      ))}
    </dl>
  );
}

/** Things that each have a name and an explanation: a heading line, a text line under it. */
export function Items({
  items,
  cols = 1,
  numbered = false,
}: {
  items: { title: React.ReactNode; body: React.ReactNode }[];
  cols?: 1 | 2 | 3;
  numbered?: boolean;
}) {
  const grid = cols === 3 ? "md:grid-cols-3" : cols === 2 ? "sm:grid-cols-2" : "";
  return (
    <ul className={`mt-8 grid list-none gap-x-10 gap-y-7 p-0 ${grid}`}>
      {items.map((it, i) => (
        <li key={i} className={numbered ? "grid grid-cols-[2rem_1fr] gap-x-3" : ""}>
          {numbered && <span className="fig text-[1.15rem] font-bold text-accent">{i + 1}</span>}
          <div>
            <p className="text-[1.15rem] font-semibold leading-snug text-ink">{it.title}</p>
            <div className="mt-2 leading-relaxed text-ink-mute">{it.body}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
