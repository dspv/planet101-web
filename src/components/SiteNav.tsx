import ThemeToggle from "./ThemeToggle";
import { Mark } from "./Mark";
import { NavLink } from "./NavLink";

/** Four sections, short enough to stay one row at 400px; no burger menu. */
export default function SiteNav() {
  return (
    <header className="wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pb-3 pt-4 sm:pt-6">
      <a href="/" className="wordmark flex items-center gap-2">
        <Mark size={20} />
        PlanetWalk
      </a>
      <div className="flex items-center gap-1 sm:gap-4">
        <nav aria-label="Разделы" className="flex items-center gap-4 text-[0.95rem] text-ink-mute sm:gap-7 sm:text-base">
          <NavLink href="/worlds/">Миры</NavLink>
          <NavLink href="/missions/">Миссии</NavLink>
          <NavLink href="/methods/">Методы</NavLink>
          <NavLink href="/about/">О проекте</NavLink>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
