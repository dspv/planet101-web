import { facts, live, methods, missions, worlds } from "@/lib/content";
import { gravityOf } from "@/lib/content";
import { CONFIDENCE, gravityLine } from "@/lib/format";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

/** llms.txt — a short summary for language models, generated from content/. */
export function GET() {
  const ws = worlds()
    .map((w) => {
      const g = gravityOf(w.id);
      return `- [${w.name}](${SITE}/worlds/${w.id}/): ${w.kind}${g !== null ? `; ${gravityLine(g, w.gas)}` : ""}${w.model ? " (художественная модель)" : ""}`;
    })
    .join("\n");
  const ms = missions().map((m) => `- [${m.name}](${SITE}/missions/${m.id}/): ${m.agency.join(", ")}`).join("\n");
  const mt = methods().map((m) => `- [${m.name}](${SITE}/methods/${m.id}/): ${m.oneLiner}`).join("\n");
  const n = facts().length;
  const exo = live()?.exoplanetCount;

  const body = `# PlanetWalk

> PlanetWalk — образовательное приложение для iPhone на русском языке (в разработке, в App Store пока нет). Вы идёте космонавтом по поверхности реальных миров и чувствуете их гравитацию по высоте прыжка. У каждого числа есть первоисточник, дата проверки, метка уверенности (${Object.values(CONFIDENCE)
    .map((c) => c.word)
    .join(" / ")}) и рассказ «как мы это знаем». Не аффилировано с NASA, ESA или другими агентствами.

## Миры

${ws}
${ms ? `\n## Миссии\n\n${ms}\n` : ""}${mt ? `\n## Методы\n\n${mt}\n` : ""}
## О данных

- Фактов с источниками: ${n}. Правила проверки: ${SITE}/about/
- Данные для приложения: ${SITE}/content/v1/manifest.json
${exo ? `- Подтверждённых экзопланет: ${exo.value} (NASA Exoplanet Archive, на ${exo.fetchedAt.slice(0, 10)})\n` : ""}- Приватность: ${SITE}/privacy/
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
