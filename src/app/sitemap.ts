import type { MetadataRoute } from "next";
import { facts, methods, missions, worlds } from "@/lib/content";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

/**
 * Dates are when the content last changed, never the build time: a world page
 * carries the newest lastVerified of its facts, a mission its statusCheckedAt.
 * Pages with no dated content carry no lastModified. /content/v1/ and /media/
 * are app data, not pages, and are not listed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const fs = facts();
  const newest = (xs: string[]) => xs.filter(Boolean).sort().at(-1);
  const ms = missions();
  const world = worlds().map((w) => ({
    url: `${SITE}/worlds/${w.id}/`,
    lastModified: newest(fs.filter((f) => f.worldId === w.id).map((f) => f.lastVerified)),
  }));
  const mission = ms.map((m) => ({ url: `${SITE}/missions/${m.id}/`, lastModified: m.statusCheckedAt }));
  const method = methods().map((m) => ({ url: `${SITE}/methods/${m.id}/` }));
  const entries: { url: string; lastModified?: string }[] = [
    { url: `${SITE}/`, lastModified: newest(fs.map((f) => f.lastVerified)) },
    { url: `${SITE}/worlds/` },
    ...world,
    { url: `${SITE}/missions/`, lastModified: newest(ms.map((m) => m.statusCheckedAt)) },
    ...mission,
    { url: `${SITE}/methods/` },
    ...method,
    { url: `${SITE}/about/` },
    { url: `${SITE}/privacy/` },
  ];
  return entries.map((e) => (e.lastModified ? e : { url: e.url }));
}
