import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Band } from "@/components/Blocks";
import { facts, mediaFor, methods, mission, missions, worlds } from "@/lib/content";
import { LICENSE, MISSION_TYPE, STATUS, date } from "@/lib/format";
import { SITE } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return missions().map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const m = mission(id);
  if (!m) return {};
  return {
    title: `${m.name}: приборы, открытия, статус`,
    description: m.summary || `${m.name} (${m.nameOriginal}), ${m.agency.join(", ")}: приборы, открытия и миры, которые изучал аппарат.`,
    alternates: { canonical: `${SITE}/missions/${m.id}/` },
  };
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-t border-line-soft py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-ink-dim">{k}</dt>
      <dd className="m-0 text-ink">{v}</dd>
    </div>
  );
}

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = mission(id);
  if (!m) notFound();

  const img = mediaFor(m);
  const parent = m.parentMissionId ? mission(m.parentMissionId) : undefined;
  const children = missions().filter((x) => x.parentMissionId === m.id);
  const ws = worlds().filter((w) => m.worldIds.includes(w.id));
  const usedFacts = facts().filter((f) => f.howWeKnow.missionIds.includes(m.id));
  const usedMethods = methods().filter((x) => x.missionIds.includes(m.id));
  const worldName = (wid: string) => worlds().find((w) => w.id === wid)?.name ?? wid;

  return (
    <main>
      <section className="wrap grid gap-10 pb-12 pt-8 sm:pt-12 lg:grid-cols-[6fr_5fr] lg:gap-14">
        <div>
          <p className="eyebrow mb-4">
            <a href="/missions/" className="hover:underline">Миссии</a> / {MISSION_TYPE[m.type]}
          </p>
          <h1 className="t-page">{m.name}</h1>
          {m.nameOriginal !== m.name && <p className="mt-2 text-[1.1rem] text-ink-mute">{m.nameOriginal}</p>}
          {m.summary && <p className="t-lead measure mt-5">{m.summary}</p>}
          <dl className="mt-8 border-b border-line-soft">
            <Row k="Агентство" v={m.agency.join(", ")} />
            {m.launch && <Row k="Запуск" v={date(m.launch)} />}
            {m.arrival && <Row k="Прибытие" v={date(m.arrival)} />}
            {m.end && <Row k="Окончание" v={date(m.end)} />}
            <Row
              k="Статус"
              v={
                <>
                  {STATUS[m.status]} <span className="t-small">— статус проверен {date(m.statusCheckedAt)}</span>
                </>
              }
            />
            {parent && <Row k="Часть миссии" v={<a className="prose-link" href={`/missions/${parent.id}/`}>{parent.name}</a>} />}
            {ws.length > 0 && (
              <Row
                k="Миры"
                v={
                  <span className="flex flex-wrap gap-2">
                    {ws.map((w) => (
                      <a key={w.id} href={`/worlds/${w.id}/`} className="chip">{w.name}</a>
                    ))}
                  </span>
                }
              />
            )}
          </dl>
        </div>
        {img && (
          <figure className="m-0">
            <img src={`/media/${img.file}`} alt={img.title} className="block w-full rounded-[18px] border border-line" loading="lazy" />
            <figcaption className="t-small mt-3">
              {img.title}
              <br />
              {img.kind === "photo" ? `Снимок: ${m.name}, ${img.credit}` : `Иллюстрация: ${img.credit}`}.{" "}
              <a href={img.sourceUrl} className="prose-link" target="_blank" rel="noopener">Источник</a>, {LICENSE[img.license] ?? img.license}
            </figcaption>
          </figure>
        )}
      </section>

      {m.instruments.length > 0 && (
        <Band soft>
          <h2 className="t-title">Приборы</h2>
          <ul className="mt-8 grid list-none gap-x-10 gap-y-6 p-0 sm:grid-cols-2">
            {m.instruments.map((it) => (
              <li key={it.name}>
                <p className="text-[1.15rem] font-semibold leading-snug">{it.name}</p>
                <p className="mt-1.5 leading-relaxed text-ink-mute">{it.what}</p>
              </li>
            ))}
          </ul>
        </Band>
      )}

      {m.discoveries.length > 0 && (
        <Band>
          <h2 className="t-title">Что открыли</h2>
          <ul className="measure mt-8 grid list-none gap-4 p-0">
            {m.discoveries.map((d, i) => (
              <li key={i} className="grid grid-cols-[1.25rem_1fr] gap-2 leading-relaxed">
                <span aria-hidden className="text-accent">—</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </Band>
      )}

      {(usedFacts.length > 0 || usedMethods.length > 0 || children.length > 0) && (
        <Band soft>
          <h2 className="t-title">Где это в приложении</h2>
          {usedFacts.length > 0 && (
            <ul className="mt-8 grid list-none gap-3 p-0 sm:grid-cols-2">
              {usedFacts.map((f) => (
                <li key={f.id}>
                  <a href={`/worlds/${f.worldId}/#${f.id.replace(".", "-")}`} className="panel block !p-5 transition-colors hover:border-accent">
                    <span className="t-small block">{worldName(f.worldId)} · {f.label}</span>
                    <span className="mt-1 block text-[1.1rem] font-semibold text-ink">{f.display}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {(usedMethods.length > 0 || children.length > 0) && (
            <div className="mt-8 flex flex-wrap gap-2">
              {usedMethods.map((x) => (
                <a key={x.id} href={`/methods/${x.id}/`} className="chip"><span aria-hidden className="text-ink-dim">∿</span>{x.name}</a>
              ))}
              {children.map((x) => (
                <a key={x.id} href={`/missions/${x.id}/`} className="chip"><span aria-hidden className="text-ink-dim">↗</span>{x.name}</a>
              ))}
            </div>
          )}
        </Band>
      )}

      <Band read={false}>
        <h2 className="t-sub">Ссылки</h2>
        <ul className="mt-5 grid list-none gap-2 p-0">
          {m.links.map((l) => (
            <li key={l.url}>
              <a href={l.url} className="prose-link" target="_blank" rel="noopener">{l.title}</a>
            </li>
          ))}
        </ul>
      </Band>
    </main>
  );
}
