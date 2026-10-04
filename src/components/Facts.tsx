import type { Confidence, Fact } from "@/lib/content";
import { mission, method } from "@/lib/content";
import { CONFIDENCE, date } from "@/lib/format";

const GLYPH: Record<Confidence, string> = {
  measured: "●",
  derived: "◐",
  estimated: "○",
  model: "◇",
  unknown: "?",
};

/** The confidence word, always as text; the glyph only repeats it. */
export function Badge({ c }: { c: Confidence }) {
  return (
    <span className="badge" data-c={c} title={CONFIDENCE[c].hint}>
      <span aria-hidden>{GLYPH[c]}</span>
      {CONFIDENCE[c].word}
    </span>
  );
}

/** Chips for the missions and methods behind a fact; ids without a record are left out. */
export function Chips({ missionIds = [], methodIds = [] }: { missionIds?: string[]; methodIds?: string[] }) {
  const ms = missionIds.map((id) => mission(id)).filter((m) => !!m);
  const ws = methodIds.map((id) => method(id)).filter((m) => !!m);
  if (!ms.length && !ws.length) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {ms.map((m) => (
        <a key={m.id} href={`/missions/${m.id}/`} className="chip">
          <span aria-hidden className="text-ink-dim">↗</span>
          {m.name}
        </a>
      ))}
      {ws.map((m) => (
        <a key={m.id} href={`/methods/${m.id}/`} className="chip">
          <span aria-hidden className="text-ink-dim">∿</span>
          {m.name}
        </a>
      ))}
    </div>
  );
}

/** One fact: value, badge, how we know, chips, source and the date it was checked. */
export function FactCard({ f, extra }: { f: Fact; extra?: React.ReactNode }) {
  return (
    <article id={f.id.replace(".", "-")} className="panel scroll-mt-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h3 className="text-[1.0625rem] font-medium leading-snug tracking-normal text-ink-mute">{f.label}</h3>
        <Badge c={f.confidence} />
      </div>
      <p className="t-head mt-2">{f.display}</p>
      {extra && <p className="fig mt-2 text-[0.95rem] text-accent">{extra}</p>}
      <div className="mt-5 border-t border-line-soft pt-4">
        <p className="eyebrow !text-ink-dim">Как мы это знаем</p>
        <p className="mt-2 leading-relaxed text-ink-mute">{f.howWeKnow.summary}</p>
        <Chips missionIds={f.howWeKnow.missionIds} methodIds={f.howWeKnow.methodIds} />
      </div>
      <p className="t-small mt-5">
        Источник:{" "}
        <a href={f.source.url} className="prose-link" rel="noopener" target="_blank">
          {f.source.title}
        </a>
        , {f.source.org}
        <br />
        Проверено {date(f.lastVerified)}
        {f.verifiedBy === "agent" && " — сверено агентом по источнику, ждёт проверки человеком"}
      </p>
    </article>
  );
}
