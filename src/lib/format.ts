/** Russian formatting for figures that come from content. Nothing here invents a value. */
import type { Confidence, Mission, MissionStatus } from "./content";

/** Fixed decimals, Russian decimal comma, thin no-break space for thousands. */
export function num(x: number, decimals = 0): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(x);
}

/** As many decimals as the source number has, Russian comma. */
export function plain(x: number): string {
  return String(x).replace(".", ",");
}

const MONTHS_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const MONTHS_NOM = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

/** "2026-10-04" or an ISO datetime → "4 октября 2026". "2004" → "2004", "2004-03" → "март 2004". */
export function date(s: string | null | undefined): string {
  if (!s) return "";
  const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec(s);
  if (!m) return s;
  const [, y, mo, d] = m;
  if (!mo) return y;
  if (!d) return `${MONTHS_NOM[Number(mo) - 1]} ${y}`;
  return `${Number(d)} ${MONTHS_GEN[Number(mo) - 1]} ${y}`;
}

/** Russian plural: plural(5, ["мир", "мира", "миров"]). */
export function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

/** The app's reference jump on Earth, metres — a constant of the scene (03-scene.md). */
export const EARTH_JUMP_M = 0.5;

/** Jump height in metres for gravity `g` (in Earth g): 0.5 / g. */
export function jump(g: number): string {
  const h = EARTH_JUMP_M / g;
  return num(h, g < 0.2 ? 1 : 2);
}

/** "0,38 g — прыжок на 1,32 м вместо 0,5"; gas giants: just "2,53 g". */
export function gravityLine(g: number, gas?: boolean): string {
  const gs = `${plain(g)} g`;
  if (gas) return gs;
  if (g === 1) return `${gs} — прыжок на ${plain(EARTH_JUMP_M)} м, точка отсчёта`;
  return `${gs} — прыжок на ${jump(g)} м вместо ${plain(EARTH_JUMP_M)}`;
}

/** Light travel time: "1,2 с", "13 мин 39 с", "4 ч 53 мин". */
export function lightTime(seconds: number): string {
  if (seconds < 60) return `${num(seconds, 1)} с`;
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h} ч ${m} мин`;
  return `${m} мин ${r} с`;
}

export const CONFIDENCE: Record<Confidence, { word: string; hint: string }> = {
  measured: { word: "Измерено", hint: "прибор получил это число напрямую" },
  derived: { word: "Вычислено", hint: "посчитано из измеренных величин" },
  estimated: { word: "Оценка", hint: "приблизительно, с заметной погрешностью" },
  model: { word: "Модель", hint: "так получается по расчётам, проверить пока нечем" },
  unknown: { word: "Неизвестно", hint: "наука пока не знает ответа" },
};

export const STATUS: Record<MissionStatus, string> = {
  active: "Работает",
  en_route: "В пути",
  completed: "Завершена",
  planned: "Готовится",
};

export const STATUS_GROUP: Record<MissionStatus, string> = {
  active: "Работают сейчас",
  en_route: "В пути",
  completed: "Завершены",
  planned: "Готовятся",
};

export const MISSION_TYPE: Record<Mission["type"], string> = {
  flyby: "Пролётный аппарат",
  orbiter: "Орбитальный аппарат",
  lander: "Посадочный аппарат",
  rover: "Ровер",
  probe: "Зонд",
  telescope: "Телескоп",
  crewed: "Пилотируемая миссия",
};

export const LICENSE: Record<string, string> = {
  public_domain: "Общественное достояние",
  cc_by_sa_3_igo: "CC BY-SA 3.0 IGO",
  cc_by_4: "CC BY 4.0",
  cc_by_sa_4: "CC BY-SA 4.0",
  other: "Другая лицензия",
};

/** Card-sized: "0,38 g · прыжок 1,32 м"; gas giants: "2,53 g". */
export function gravityShort(g: number, gas?: boolean): string {
  const gs = `${plain(g)} g`;
  if (gas) return `${gs} · встать не на что`;
  return `${gs} · прыжок ${g === 1 ? plain(EARTH_JUMP_M) : jump(g)} м`;
}
