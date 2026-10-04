import { Band, Head } from "@/components/Blocks";
import { methods } from "@/lib/content";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Методы",
  description: "Как взвешивают планеты, меряют температуру с орбиты и находят экзопланеты — коротко и с интерактивными схемами.",
  alternates: { canonical: `${SITE}/methods/` },
};

export default function Methods() {
  const ms = methods();
  return (
    <main>
      <Band>
        <Head as="h1" eyebrow="Методы" title="Как это узнали, если туда не долететь" lead="Почти всё в карточках миров измерено издалека. Вот как." />
        {ms.length === 0 ? (
          <p className="t-lead mt-10">Описания методов ещё пишутся и сверяются с источниками.</p>
        ) : (
          <ul className="mt-10 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {ms.map((m) => (
              <li key={m.id}>
                <a href={`/methods/${m.id}/`} className="panel block h-full transition-colors hover:border-accent">
                  <span className="t-head block">{m.name}</span>
                  <span className="mt-2 block leading-relaxed text-ink-mute">{m.oneLiner}</span>
                  {m.interactive && <span className="eyebrow mt-4 block">Есть интерактивная схема</span>}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Band>
    </main>
  );
}
