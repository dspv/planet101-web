import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Band } from "@/components/Blocks";
import { FactCard } from "@/components/Facts";
import WorldScape from "@/components/WorldScape";
import { factsOf, gravityOf, live, missions, staticParams, worlds } from "@/lib/content";
import { STATUS, date, gravityLine, lightTime, num } from "@/lib/format";
import { SITE } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return staticParams(worlds().map((w) => w.id));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const w = worlds().find((x) => x.id === id);
  if (!w) return {};
  return {
    title: `${w.name}: гравитация, температура и как это измерили`,
    description: w.desc,
    alternates: { canonical: `${SITE}/worlds/${w.id}/` },
  };
}

export default async function WorldPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const all = worlds();
  const index = all.findIndex((x) => x.id === id);
  const w = all[index];
  if (!w) notFound();

  const { sheet, other } = factsOf(w.id);
  const g = gravityOf(w.id);
  const dist = live()?.distances?.[w.id];
  const ms = missions().filter((m) => m.worldIds.includes(w.id));
  const prev = all[(index - 1 + all.length) % all.length];
  const next = all[(index + 1) % all.length];

  return (
    <main>
      <section className="wrap grid items-center gap-8 pb-12 pt-8 sm:pt-12 lg:grid-cols-[6fr_5fr] lg:gap-14">
        <div>
          <p className="eyebrow mb-4">
            <a href="/worlds/" className="hover:underline">Миры</a> / {w.kind}
          </p>
          <h1 className="t-display">{w.name}</h1>
          {w.model && (
            <p className="mt-4">
              <span className="badge" data-c="model">◇ художественная модель</span>
            </p>
          )}
          <p className="t-lead measure mt-5">{w.desc}</p>
          {g !== null && <p className="fig mt-6 text-[1.05rem] text-accent">{gravityLine(g, w.gas)}</p>}
          {dist && (
            <p className="mt-4 text-ink-mute">
              Сейчас до Земли <span className="fig whitespace-nowrap text-ink">{num(dist.au, dist.au < 0.1 ? 4 : 2)} а. е.</span>, свет идёт{" "}
              <span className="fig whitespace-nowrap text-ink">{lightTime(dist.lightSeconds)}</span>.
              <span className="t-small block">JPL Horizons, данные на {date(dist.fetchedAt)}</span>
            </p>
          )}
        </div>
        <figure className="m-0">
          <WorldScape w={w} index={index} className="block aspect-[16/10] w-full overflow-hidden rounded-[18px] border border-line" />
          <figcaption className="t-small mt-3">
            {w.model
              ? "Художественная модель: как эта планета выглядит, никто не знает."
              : "Иллюстрация по палитре и рельефу из приложения, не снимок."}
          </figcaption>
        </figure>
      </section>

      {sheet.length > 0 && (
        <Band soft>
          <h2 className="t-title">Карточка мира</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {sheet.map((f) => (
              <FactCard key={f.id} f={f} extra={f.id.endsWith(".gravity") && g !== null ? gravityLine(g, w.gas) : undefined} />
            ))}
          </div>
        </Band>
      )}

      {other.length > 0 && (
        <Band>
          <h2 className="t-title">Ещё о мире</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {other.map((f) => (
              <FactCard key={f.id} f={f} />
            ))}
          </div>
        </Band>
      )}

      {sheet.length === 0 && other.length === 0 && (
        <Band soft read>
          <p className="t-lead">Факты об этом мире ещё сверяются с источниками. Числа появятся здесь, когда у каждого будет ссылка.</p>
        </Band>
      )}

      {ms.length > 0 && (
        <Band id="missions" soft={sheet.length === 0 || other.length > 0}>
          <h2 className="t-title">Кто здесь работал</h2>
          <ul className="mt-8 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {ms.map((m) => (
              <li key={m.id}>
                <a href={`/missions/${m.id}/`} className="panel block !p-5 transition-colors hover:border-accent">
                  <span className="block text-[1.1rem] font-semibold text-ink">{m.name}</span>
                  <span className="t-small block">
                    {m.agency.join(", ")} · {STATUS[m.status]}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Band>
      )}

      <nav aria-label="Другие миры" className="wrap flex justify-between gap-4 border-t border-line py-8 text-[1rem]">
        <a href={`/worlds/${prev.id}/`} className="text-ink-mute hover:text-accent">← {prev.name}</a>
        <a href={`/worlds/${next.id}/`} className="text-right text-ink-mute hover:text-accent">{next.name} →</a>
      </nav>
    </main>
  );
}
