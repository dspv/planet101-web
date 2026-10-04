import { Band, Head, Items } from "@/components/Blocks";
import { Badge } from "@/components/Facts";
import JumpBars from "@/components/JumpBars";
import WorldGrid from "@/components/WorldGrid";
import WorldScape from "@/components/WorldScape";
import { facts, live, methods, missions, worlds } from "@/lib/content";
import { date, num, plural } from "@/lib/format";
import { SITE } from "@/lib/site";

export const metadata = { alternates: { canonical: `${SITE}/` } };

const CONF = ["measured", "derived", "estimated", "model", "unknown"] as const;

export default function Home() {
  const ws = worlds();
  const n = ws.length;
  const heroIndex = Math.max(0, ws.findIndex((w) => w.id === "mars"));
  const hero = ws[heroIndex];
  const ms = missions();
  const mt = methods();
  const fs = facts();
  const exo = live()?.exoplanetCount ?? null;

  return (
    <main>
      {/* First screen: what it is, one picture, the honest status. */}
      <section className="wrap grid items-center gap-10 pb-14 pt-8 sm:pt-14 lg:grid-cols-[6fr_5fr] lg:gap-14 lg:pb-20">
        <div>
          <h1>
            <span className="eyebrow mb-5 block">Приложение для iPhone о космосе</span>
            <span className="t-display block">Пройдитесь по Марсу. Подпрыгните на Плутоне.</span>
          </h1>
          <p className="t-lead measure mt-6">
            В PlanetWalk вы идёте космонавтом по {n > 0 ? `${n} ${plural(n, ["настоящему миру", "настоящим мирам", "настоящим мирам"])}` : "настоящим мирам"}, и
            гравитацию каждого видно по прыжку. Любое число открывается: каким аппаратом его измерили и насколько
            мы в нём уверены.
          </p>
          <p className="mt-8 inline-flex items-center gap-3 rounded-[10px] border border-line px-4 py-3 text-[1rem] text-ink">
            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-accent" />
            Приложение для iPhone в разработке. В App Store его пока нет.
          </p>
        </div>
        {hero && (
          <figure className="m-0">
            <WorldScape w={hero} index={heroIndex} className="block aspect-[16/10] w-full overflow-hidden rounded-[18px] border border-line" />
            <figcaption className="t-small mt-3">Иллюстрация: {hero.name}, нарисован по палитре и рельефу из приложения.</figcaption>
          </figure>
        )}
      </section>

      <Band soft>
        <Head
          eyebrow="Гравитация"
          title="Один и тот же прыжок"
          lead="На Земле космонавт подпрыгивает на полметра. Слабее тяготение — выше прыжок: высота растёт как 1/g. На Плутоне он улетает за край экрана и возвращается через несколько секунд."
        />
        <JumpBars />
      </Band>

      <Band>
        <Head eyebrow="Как это устроено" title="Идёте, прыгаете, спрашиваете «откуда известно»" />
        <Items
          cols={3}
          numbered
          items={[
            { title: "Выбираете мир", body: "Своё небо, рельеф и погода: пыль на Марсе, метановый дождь на Титане, Юпитер над горизонтом Европы." },
            { title: "Прыгаете", body: "Высота и длительность прыжка — по гравитации мира. На Юпитере встать не на что: вы парите на аэростатном зонде." },
            { title: "Открываете карточку", body: "Температура, сутки, атмосфера, давление. Под каждым числом — миссия, прибор, метод и ссылка на первоисточник." },
          ]}
        />
      </Band>

      <Band soft id="worlds">
        <Head eyebrow="Миры" title={n > 0 ? `${n} ${plural(n, ["мир", "мира", "миров"])} в приложении` : "Миры в приложении"} />
        <WorldGrid worlds={ws} />
      </Band>

      <Band>
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <Head eyebrow="Доверие" title="Каждое число отвечает за себя" lead="Приложение не справочник. Оно показывает, откуда взялась цифра, — и честно говорит, где наука пока не знает." />
          </div>
          <div>
            <Items
              items={[
                {
                  title: "У каждого факта есть источник",
                  body: "Ссылка на первоисточник — агентство, статью, архив данных — и дата последней проверки. Без источника число не попадает ни в приложение, ни на сайт.",
                },
                {
                  title: "Уверенность — словом, а не цветом",
                  body: (
                    <>
                      <span className="mb-3 flex flex-wrap gap-2">
                        {CONF.map((c) => (
                          <Badge key={c} c={c} />
                        ))}
                      </span>
                      Измерено прибором, вычислено из измерений, оценено, получено моделью или пока неизвестно.
                    </>
                  ),
                },
                {
                  title: "Снимок или иллюстрация",
                  body: "Настоящие снимки подписаны миссией и автором. Рисунки и сцены прогулки помечены «Иллюстрация», а TRAPPIST-1e — «художественная модель»: как она выглядит, не видел никто.",
                },
                {
                  title: "Где ответа нет, так и написано",
                  body: "Атмосфера далёкой экзопланеты — «Неизвестно», а не правдоподобная выдумка.",
                },
              ]}
            />
          </div>
        </div>
      </Band>

      <Band soft>
        <div className="grid gap-4 md:grid-cols-2">
          <a href="/missions/" className="panel block transition-colors hover:border-accent">
            <p className="eyebrow">Миссии</p>
            <p className="t-sub mt-3">Кто туда летал</p>
            <p className="mt-3 leading-relaxed text-ink-mute">
              {ms.length > 0
                ? `${ms.length} ${plural(ms.length, ["аппарат", "аппарата", "аппаратов"])} и телескопов: приборы, открытия, статус. Например, ${ms
                    .slice(0, 3)
                    .map((m) => m.name)
                    .join(", ")}.`
                : "Аппараты и телескопы, которые измерили то, что показывает приложение: приборы, открытия, статус."}
            </p>
            <p className="mt-5 font-semibold text-accent">Все миссии →</p>
          </a>
          <a href="/methods/" className="panel block transition-colors hover:border-accent">
            <p className="eyebrow">Методы</p>
            <p className="t-sub mt-3">Как это измерили</p>
            <p className="mt-3 leading-relaxed text-ink-mute">
              {mt.length > 0
                ? `${mt.length} ${plural(mt.length, ["способ", "способа", "способов"])} узнать то, до чего не дотянуться: ${mt
                    .slice(0, 3)
                    .map((m) => m.name.toLowerCase())
                    .join(", ")}${mt.length > 3 ? " и другие" : ""}.`
                : "Как узнают массу, температуру и состав мира, до которого не дотянуться."}
            </p>
            <p className="mt-5 font-semibold text-accent">Все методы →</p>
          </a>
        </div>
        {(exo || fs.length > 0) && (
          <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {exo && (
              <div className="border-t border-line pt-5">
                <p className="t-stat">{num(exo.value)}</p>
                <p className="mt-3 text-[1.0625rem] text-ink">подтверждённых экзопланет известно сейчас</p>
                <p className="t-small mt-1.5">NASA Exoplanet Archive, данные на {date(exo.fetchedAt)}</p>
              </div>
            )}
            {fs.length > 0 && (
              <div className="border-t border-line pt-5">
                <p className="t-stat">{num(fs.length)}</p>
                <p className="mt-3 text-[1.0625rem] text-ink">{plural(fs.length, ["факт", "факта", "фактов"])} с источником и рассказом «как мы это знаем»</p>
                <p className="t-small mt-1.5">
                  <a href="/about/" className="prose-link">Как мы их проверяем</a>
                </p>
              </div>
            )}
          </div>
        )}
      </Band>
    </main>
  );
}
