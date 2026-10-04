/**
 * Build-time content loader. Reads content/*.json from the repo root with fs,
 * so every figure on the site comes from the same files the app ships.
 *
 * A missing or unreadable file is treated as empty: content is written by
 * other people and pipelines, and a page must render (with less on it) rather
 * than crash or fall back to a made-up value. Types mirror content/schemas/.
 */
import fs from "node:fs";
import path from "node:path";

export type Hex = string;
export type Confidence = "measured" | "derived" | "estimated" | "model" | "unknown";
export type VerifiedBy = "human" | "agent";
export type Link = { title: string; url: string };

export type World = {
  id: string;
  name: string;
  kind: string;
  temp: string;
  g: number;
  day: string;
  air: string;
  pressure: string;
  desc: string;
  sky: [Hex, Hex];
  ground: [Hex, Hex, Hex];
  amp: [number, number, number];
  sun?: { r: number; color: Hex; x: number; y: number };
  stars: number;
  weather: "none" | "dust" | "rain" | "snow" | "haze" | "clouds";
  skyBody?: "saturn" | "jupiter" | "earth";
  gas?: boolean;
  model?: boolean;
  video?: { file?: string; url?: string; caption?: string };
};

export type Fact = {
  id: string;
  worldId: string;
  label: string;
  display: string;
  value: number | null;
  unit: string | null;
  uncertainty: number | null;
  confidence: Confidence;
  howWeKnow: { summary: string; missionIds: string[]; methodIds: string[]; year: number | null };
  source: { title: string; org: string; url: string };
  lastVerified: string;
  verifiedBy: VerifiedBy;
};

export type MissionStatus = "planned" | "en_route" | "active" | "completed";
export type Mission = {
  id: string;
  name: string;
  nameOriginal: string;
  agency: string[];
  parentMissionId?: string;
  type: "flyby" | "orbiter" | "lander" | "rover" | "probe" | "telescope" | "crewed";
  launch: string | null;
  arrival?: string | null;
  end?: string | null;
  status: MissionStatus;
  statusCheckedAt: string;
  verifiedBy: VerifiedBy;
  summary?: string;
  worldIds: string[];
  instruments: { name: string; what: string }[];
  discoveries: string[];
  mediaIds: string[];
  links: Link[];
};

export type Method = {
  id: string;
  name: string;
  oneLiner: string;
  explainer: string;
  measures: string[];
  interactive: "transit" | "kepler_mass" | null;
  missionIds: string[];
};

export type Media = {
  id: string;
  kind: "photo" | "illustration";
  missionId: string | null;
  worldIds: string[];
  title: string;
  credit: string;
  license: "public_domain" | "cc_by_sa_3_igo" | "cc_by_4" | "cc_by_sa_4" | "other";
  licenseNote?: string;
  sourceUrl: string;
  originalUrl: string;
  file: string;
};

export type Live = {
  generatedAt: string;
  exoplanetCount: { value: number; fetchedAt: string } | null;
  distances: Record<string, { au: number; lightSeconds: number; fetchedAt: string }>;
  trappist1e: {
    radiusEarth: number | null;
    massEarth: number | null;
    eqTempK: number | null;
    periodDays: number | null;
    fetchedAt: string;
  } | null;
};

const ROOT = process.cwd();

function read<T>(file: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(path.join(ROOT, "content", file), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Arrays of records: anything that is not an object with an id is dropped. */
function list<T extends { id: string }>(file: string): T[] {
  const data = read<unknown>(file, []);
  if (!Array.isArray(data)) return [];
  return data.filter((x): x is T => !!x && typeof x === "object" && typeof (x as T).id === "string");
}

export const worlds = (): World[] => list<World>("worlds.json");
export const facts = (): Fact[] =>
  list<Fact>("facts.json").filter((f) => typeof f.display === "string" && f.source && f.howWeKnow);
export const missions = (): Mission[] => list<Mission>("missions.json");
export const methods = (): Method[] => list<Method>("methods.json");
export const media = (): Media[] => list<Media>("media.json");

export function live(): Live | null {
  const l = read<Live | null>("live.json", null);
  if (!l || typeof l !== "object") return null;
  return { ...l, distances: l.distances ?? {}, exoplanetCount: l.exoplanetCount ?? null, trappist1e: l.trappist1e ?? null };
}

export const world = (id: string) => worlds().find((w) => w.id === id);
export const mission = (id: string) => missions().find((m) => m.id === id);
export const method = (id: string) => methods().find((m) => m.id === id);
export const fact = (id: string) => facts().find((f) => f.id === id);

/** The five rows of a world's sheet, in the app's order. */
export const SHEET = ["surface_temp", "gravity", "day", "atmosphere", "pressure"] as const;

export function factsOf(worldId: string) {
  const all = facts().filter((f) => f.worldId === worldId);
  const sheet = SHEET.map((k) => all.find((f) => f.id === `${worldId}.${k}`)).filter((f): f is Fact => !!f);
  const sheetIds = new Set(sheet.map((f) => f.id));
  const other = all.filter((f) => !sheetIds.has(f.id));
  return { sheet, other, all };
}

/** Gravity in units of Earth's g, from the gravity fact only. */
export function gravityOf(worldId: string): number | null {
  const f = fact(`${worldId}.gravity`);
  if (!f || typeof f.value !== "number" || f.value <= 0) return null;
  const u = (f.unit ?? "g").replace(/\s/g, "").toLowerCase();
  if (u === "g") return f.value;
  if (u === "m/s2" || u === "m/s²" || u === "м/с2" || u === "м/с²") return f.value / 9.80665; // standard gravity, exact by definition
  return null;
}

/** A media file is shown only when the pipeline has actually put it in public/media. */
export function mediaFileExists(file: string): boolean {
  try {
    return fs.statSync(path.join(ROOT, "public", "media", file)).isFile();
  } catch {
    return false;
  }
}

export function mediaFor(m: Mission): Media | undefined {
  const all = media();
  const ids = [...m.mediaIds, ...all.filter((x) => x.missionId === m.id).map((x) => x.id)];
  for (const id of ids) {
    const item = all.find((x) => x.id === id);
    if (item && mediaFileExists(item.file)) return item;
  }
  return undefined;
}
