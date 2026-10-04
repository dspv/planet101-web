import { gravityOf, worlds } from "@/lib/content";
import { EARTH_JUMP_M, jump, plain } from "@/lib/format";

/**
 * Jump height per world: 0.5 m / g, with g from each world's gravity fact.
 * True by construction from sourced facts; a world without a gravity fact is
 * left out rather than drawn from a guess. Gas giants have no surface to jump
 * from and get a text row instead of a bar.
 */
export default function JumpBars() {
  const rows = worlds()
    .map((w) => ({ w, g: gravityOf(w.id) }))
    .filter((r): r is { w: (typeof r)["w"]; g: number } => r.g !== null);
  if (!rows.length) return null;
  const solid = rows.filter((r) => !r.w.gas).sort((a, b) => b.g - a.g);
  const gas = rows.filter((r) => r.w.gas);
  const max = Math.max(...solid.map((r) => EARTH_JUMP_M / r.g));

  return (
    <figure className="m-0 mt-10">
      <ul className="m-0 grid list-none gap-3.5 p-0">
        {solid.map(({ w, g }) => {
          const pct = ((EARTH_JUMP_M / g) / max) * 100;
          const earth = g === 1;
          return (
            <li key={w.id} className="grid grid-cols-[6.5rem_1fr_5.5rem] items-center gap-3 sm:grid-cols-[9rem_1fr_7rem] sm:gap-4">
              <a href={`/worlds/${w.id}/`} className="truncate text-[1rem] text-ink hover:text-accent">
                {w.name}
              </a>
              <span className="relative block h-3 rounded-full bg-line-soft">
                <span
                  className={`block h-full rounded-full ${earth ? "bg-ink-dim" : "bg-accent"}`}
                  style={{ width: `${Math.max(pct, 1.5)}%` }}
                />
              </span>
              <span className="fig text-right text-[0.95rem] text-ink">
                {earth ? plain(EARTH_JUMP_M) : jump(g)} м
              </span>
            </li>
          );
        })}
        {gas.map(({ w, g }) => (
          <li key={w.id} className="grid grid-cols-[6.5rem_1fr] items-center gap-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
            <a href={`/worlds/${w.id}/`} className="truncate text-[1rem] text-ink hover:text-accent">
              {w.name}
            </a>
            <span className="text-[0.95rem] text-ink-mute">
              <span className="fig">{plain(g)} g</span> — поверхности нет, вы парите на зонде
            </span>
          </li>
        ))}
      </ul>
      <figcaption className="t-small mt-5">
        Высота прыжка = 0,5 м ÷ g. Значение g для каждого мира — из факта с источником на странице мира. Серая полоса — Земля.
      </figcaption>
    </figure>
  );
}
