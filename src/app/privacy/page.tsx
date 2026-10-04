import { Band, Head } from "@/components/Blocks";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Приватность",
  description: "PlanetWalk не собирает персональные данные: нет аналитики, нет аккаунтов.",
  alternates: { canonical: `${SITE}/privacy/` },
};

export default function Privacy() {
  return (
    <main>
      <Band read>
        <Head as="h1" eyebrow="Приватность" title="Мы ничего о вас не собираем" />
        <div className="mt-8 grid gap-4 leading-relaxed text-ink-mute">
          <p>Приложение PlanetWalk не собирает персональные данные. В нём нет аналитики, рекламы и аккаунтов.</p>
          <p>
            Единственные сетевые запросы приложения идут на <span className="fig text-ink">planetwalk.pages.dev</span>: за обновлениями
            фактов и снимками. Без сети приложение работает на встроенной копии.
          </p>
          <p>Этот сайт тоже без аналитики и без cookie; выбор темы хранится только в вашем браузере. Сайт и файлы для приложения раздаёт Cloudflare Pages — как любой хостинг, он видит технические данные запроса, например IP-адрес.</p>
        </div>
      </Band>
    </main>
  );
}
