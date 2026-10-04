import type { World } from "@/lib/content";
import { gravityOf } from "@/lib/content";
import { gravityShort } from "@/lib/format";
import WorldScape from "./WorldScape";

/** The worlds as cards. Landscapes are illustrations; the caption under the grid says so. */
export default function WorldGrid({ worlds }: { worlds: World[] }) {
  return (
    <>
      <ul className="mt-10 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {worlds.map((w, i) => {
          const g = gravityOf(w.id);
          return (
            <li key={w.id}>
              <a href={`/worlds/${w.id}/`} className="group block overflow-hidden rounded-[18px] border border-line bg-card transition-colors hover:border-accent">
                <WorldScape w={w} index={i} className="block aspect-[16/10] w-full" />
                <div className="p-4">
                  <p className="text-[1.15rem] font-semibold leading-snug text-ink group-hover:text-accent">{w.name}</p>
                  <p className="mt-1 text-[0.95rem] leading-snug text-ink-mute">{w.kind}</p>
                  {g !== null && <p className="fig mt-2 text-[0.9rem] text-ink-dim">{gravityShort(g, w.gas)}</p>}
                </div>
              </a>
            </li>
          );
        })}
      </ul>
      <p className="t-small mt-4">Пейзажи — иллюстрации: нарисованы по палитре и рельефу из приложения, это не снимки.</p>
    </>
  );
}
