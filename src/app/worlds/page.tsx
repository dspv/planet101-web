import { Band, Head } from "@/components/Blocks";
import WorldGrid from "@/components/WorldGrid";
import { worlds } from "@/lib/content";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Миры",
  description: `${worlds().map((w) => w.name).join(", ")}: гравитация, температура, сутки и как это измерили.`,
  alternates: { canonical: `${SITE}/worlds/` },
};

export default function Worlds() {
  return (
    <main>
      <Band>
        <Head as="h1" eyebrow="Миры" title="Куда можно сходить" lead="У каждого мира — своё небо, своя гравитация и карточка фактов с источниками." />
        <WorldGrid worlds={worlds()} />
      </Band>
    </main>
  );
}
