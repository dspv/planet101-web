import { Band, Head, Items } from "@/components/Blocks";
import { facts, live, media, missions } from "@/lib/content";
import { LICENSE, date, num, plural } from "@/lib/format";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Источники и проверка",
  description: "Откуда берутся числа в PlanetWalk, кто их проверяет, какие лицензии у снимков. Проект не аффилирован с NASA, ESA или другими агентствами.",
  alternates: { canonical: `${SITE}/about/` },
};

export default function About() {
  const fs = facts();
  const ms = missions();
  const md = media();
  const l = live();

  const agentFacts = fs.filter((f) => f.verifiedBy === "agent").length;
  const humanFacts = fs.length - agentFacts;
  const agentMissions = ms.filter((m) => m.verifiedBy === "agent").length;

  const orgs = [...new Map(fs.map((f) => [f.source.org, 0])).keys()].map((org) => ({
    org,
    n: fs.filter((f) => f.source.org === org).length,
  }));
  orgs.sort((a, b) => b.n - a.n || a.org.localeCompare(b.org));

  const licences = [...new Set(md.map((x) => x.license))].map((lic) => ({
    lic,
    n: md.filter((x) => x.license === lic).length,
  }));

  return (
    <main>
      <Band read>
        <Head as="h1" eyebrow="О проекте" title="Откуда числа и кто их проверяет" lead="PlanetWalk — приложение для iPhone, оно в разработке. Этот сайт показывает те же факты, что и приложение, из тех же файлов." />

        <h2 className="t-sub mt-14">Правила</h2>
        <Items
          items={[
            { title: "Нет источника — нет факта", body: "У каждого числа есть ссылка на первоисточник: страницу агентства, научную статью или архив данных. Нейросеть источником не бывает." },
            { title: "Дата проверки на виду", body: "Под каждым фактом написано, когда его последний раз сверяли с источником. Статусы миссий тоже датированы." },
            { title: "Живые данные — с датой", body: "Расстояния до миров берутся из JPL Horizons, число экзопланет — из NASA Exoplanet Archive. Рядом всегда дата, на которую данные получены." },
            { title: "Снимок или иллюстрация", body: "Настоящий снимок подписан миссией и автором. Всё нарисованное помечено «Иллюстрация»; экзопланета — «художественная модель»." },
          ]}
        />

        <h2 className="t-sub mt-14">Кто проверял</h2>
        {fs.length === 0 && ms.length === 0 ? (
          <p className="mt-5 text-ink-mute">Факты ещё собираются. Как только они появятся, здесь будет видно, сколько из них проверил человек.</p>
        ) : (
          <div className="mt-5 grid gap-4 leading-relaxed text-ink-mute">
            {fs.length > 0 && (
              <p>
                <span className="fig text-ink">{num(fs.length)}</span> {plural(fs.length, ["факт", "факта", "фактов"])}. Человек проверил{" "}
                <span className="fig text-ink">{num(humanFacts)}</span>
                {agentFacts > 0 && (
                  <>
                    . Ещё <span className="fig text-ink">{num(agentFacts)}</span> сверил с первоисточником ИИ-агент: он открыл страницу источника и сравнил число. Такие записи помечены и ждут проверки человеком
                  </>
                )}
                .
              </p>
            )}
            {ms.length > 0 && (
              <p>
                <span className="fig text-ink">{num(ms.length)}</span> {plural(ms.length, ["миссия", "миссии", "миссий"])}
                {agentMissions > 0 ? (
                  <>
                    , из них <span className="fig text-ink">{num(agentMissions)}</span> пока сверены только агентом.
                  </>
                ) : (
                  ", все проверены человеком."
                )}
              </p>
            )}
          </div>
        )}

        {orgs.length > 0 && (
          <>
            <h2 className="t-sub mt-14">Источники</h2>
            <ul className="mt-5 grid list-none gap-2 p-0">
              {orgs.map((o) => (
                <li key={o.org} className="flex justify-between gap-4 border-b border-line-soft pb-2">
                  <span>{o.org}</span>
                  <span className="fig text-ink-dim">{num(o.n)}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <h2 className="t-sub mt-14">Снимки и лицензии</h2>
        <p className="mt-5 leading-relaxed text-ink-mute">
          Снимки — с аппаратов и телескопов агентств. У каждого указаны автор, лицензия и ссылка на страницу снимка у агентства. Снимки NASA, как правило, в общественном достоянии; снимки ESA часто под CC BY-SA 3.0 IGO — тогда указываем автора и ту же лицензию.
        </p>
        {licences.length > 0 && (
          <ul className="mt-5 grid list-none gap-2 p-0">
            {licences.map((x) => (
              <li key={x.lic} className="flex justify-between gap-4 border-b border-line-soft pb-2">
                <span>{LICENSE[x.lic] ?? x.lic}</span>
                <span className="fig text-ink-dim">{num(x.n)}</span>
              </li>
            ))}
          </ul>
        )}

        <h2 className="t-sub mt-14">Агентства</h2>
        <p className="mt-5 leading-relaxed text-ink-mute">
          Не аффилировано с NASA, ESA или другими агентствами. Мы пользуемся их открытыми данными и снимками, но они не участвуют в проекте и не одобряли его. Логотипов агентств здесь нет.
        </p>

        {l?.generatedAt && <p className="t-small mt-14">Живые данные обновлены {date(l.generatedAt)}.</p>}
      </Band>
    </main>
  );
}
