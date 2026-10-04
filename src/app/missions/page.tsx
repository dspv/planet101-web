import { Band, Head } from "@/components/Blocks";
import { missions, worlds } from "@/lib/content";
import type { Mission, MissionStatus } from "@/lib/content";
import { MISSION_TYPE, STATUS_GROUP, date } from "@/lib/format";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Миссии",
  description: "Аппараты и телескопы, которые измерили то, что показывает PlanetWalk: приборы, открытия, статус.",
  alternates: { canonical: `${SITE}/missions/` },
};

const ORDER: MissionStatus[] = ["active", "en_route", "completed", "planned"];

function years(m: Mission) {
  const a = m.launch?.slice(0, 4);
  const b = m.end?.slice(0, 4);
  if (a && b) return a === b ? a : `${a}–${b}`;
  if (a) return m.status === "planned" ? `запуск ${a}` : `с ${a}`;
  return "";
}

export default function Missions() {
  const ms = missions();
  const ws = worlds();
  const name = (id: string) => ws.find((w) => w.id === id)?.name;
  const used = ws.filter((w) => ms.some((m) => m.worldIds.includes(w.id)));

  return (
    <main>
      <Band>
        <Head as="h1" eyebrow="Миссии" title="Кто туда летал и что увидел" lead="Аппараты и телескопы, чьи измерения стоят за числами в приложении." />
        {used.length > 0 && (
          <div className="mt-8">
            <p className="t-small mb-3">Миссии конкретного мира — на его странице:</p>
            <div className="flex flex-wrap gap-2">
              {used.map((w) => (
                <a key={w.id} href={`/worlds/${w.id}/#missions`} className="chip">{w.name}</a>
              ))}
            </div>
          </div>
        )}
        {ms.length === 0 && <p className="t-lead mt-10">Список миссий ещё собирается и сверяется с источниками.</p>}
      </Band>

      {ORDER.map((st, i) => {
        const group = ms.filter((m) => m.status === st);
        if (!group.length) return null;
        return (
          <Band key={st} id={st} soft={i % 2 === 0}>
            <h2 className="t-title">{STATUS_GROUP[st]}</h2>
            <ul className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((m) => (
                <li key={m.id}>
                  <a href={`/missions/${m.id}/`} className="panel block h-full transition-colors hover:border-accent">
                    <span className="block t-head">{m.name}</span>
                    <span className="t-small block mt-1">
                      {MISSION_TYPE[m.type]} · {m.agency.join(", ")}
                      {years(m) && ` · ${years(m)}`}
                    </span>
                    {m.worldIds.length > 0 && (
                      <span className="mt-3 block text-[0.95rem] text-ink-mute">
                        {m.worldIds.map(name).filter(Boolean).join(", ")}
                      </span>
                    )}
                    <span className="t-small mt-3 block">Статус проверен {date(m.statusCheckedAt)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Band>
        );
      })}
    </main>
  );
}
