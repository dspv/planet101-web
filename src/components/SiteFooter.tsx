import { Mark } from "./Mark";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="wrap grid gap-8 pb-8 pt-12 sm:grid-cols-[1fr_auto]">
        <div>
          <span className="wordmark flex items-center gap-2">
            <Mark size={20} />
            PlanetWalk
          </span>
          <p className="mt-3 max-w-[38ch] text-[0.95rem] text-ink-mute">
            Приложение для iPhone: прогулка по настоящим мирам и объяснение, откуда известно каждое число.
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-x-10 gap-y-2.5 text-[0.95rem] text-ink-mute">
          <li><a href="/worlds/" className="hover:text-accent">Миры</a></li>
          <li><a href="/about/" className="hover:text-accent">Источники</a></li>
          <li><a href="/missions/" className="hover:text-accent">Миссии</a></li>
          <li><a href="/privacy/" className="hover:text-accent">Приватность</a></li>
          <li><a href="/methods/" className="hover:text-accent">Методы</a></li>
          <li><a href="/llms.txt" className="hover:text-accent">llms.txt</a></li>
        </ul>
      </div>
      <div className="wrap border-t border-line-soft pb-6 pt-5">
        <p className="t-small">Не аффилировано с NASA, ESA или другими агентствами.</p>
      </div>
    </footer>
  );
}
