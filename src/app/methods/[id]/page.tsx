import type { Metadata } from "next";
import { notFound } from "next/navigation";
import KeplerDemo from "@/components/KeplerDemo";
import TransitDemo from "@/components/TransitDemo";
import { facts, method, methods, mission, worlds } from "@/lib/content";
import { SITE } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return methods().map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const m = method(id);
  if (!m) return {};
  return { title: m.name, description: m.oneLiner, alternates: { canonical: `${SITE}/methods/${m.id}/` } };
}

export default async function MethodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = method(id);
  if (!m) notFound();

  const ms = m.missionIds.map((x) => mission(x)).filter((x) => !!x);
  const used = facts().filter((f) => f.howWeKnow.methodIds.includes(m.id));
  const worldName = (wid: string) => worlds().find((w) => w.id === wid)?.name ?? wid;

  return (
    <main>
      <section className="wrap-read pb-12 pt-8 sm:pt-12">
        <p className="eyebrow mb-4">
          <a href="/methods/" className="hover:underline">Методы</a>
        </p>
        <h1 className="t-page">{m.name}</h1>
        <p className="t-lead mt-5">{m.oneLiner}</p>
        <div className="mt-8 grid gap-4 text-[1.0625rem] leading-[1.7] sm:text-[1.125rem]">
          {m.explainer.split(/\n\s*\n/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {m.measures.length > 0 && (
          <>
            <h2 className="t-head mt-10">Что так измеряют</h2>
            <ul className="mt-3 grid list-none gap-2 p-0">
              {m.measures.map((x) => (
                <li key={x} className="grid grid-cols-[1.25rem_1fr] gap-2">
                  <span aria-hidden className="text-accent">—</span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {m.interactive === "transit" && (
          <div className="mt-10">
            <h2 className="t-head mb-4">Попробуйте сами</h2>
            <TransitDemo />
          </div>
        )}
        {m.interactive === "kepler_mass" && (
          <div className="mt-10">
            <h2 className="t-head mb-4">Взвесьте планету сами</h2>
            <KeplerDemo />
          </div>
        )}
        {ms.length > 0 && (
          <>
            <h2 className="t-head mt-10">Миссии</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {ms.map((x) => (
                <a key={x.id} href={`/missions/${x.id}/`} className="chip"><span aria-hidden className="text-ink-dim">↗</span>{x.name}</a>
              ))}
            </div>
          </>
        )}
        {used.length > 0 && (
          <>
            <h2 className="t-head mt-10">Числа в приложении, полученные так</h2>
            <ul className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-2">
              {used.map((f) => (
                <li key={f.id}>
                  <a href={`/worlds/${f.worldId}/#${f.id.replace(".", "-")}`} className="panel block !p-5 transition-colors hover:border-accent">
                    <span className="t-small block">{worldName(f.worldId)} · {f.label}</span>
                    <span className="mt-1 block text-[1.1rem] font-semibold text-ink">{f.display}</span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}
