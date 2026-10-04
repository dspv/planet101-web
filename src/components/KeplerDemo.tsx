"use client";

import { useId, useState } from "react";

/**
 * Weighing a planet by its moon: M = 4π²a³ / (G T²). The sliders set the
 * moon's period and orbit radius; the mass follows from the formula and two
 * defined constants. No real moon's values are typed here.
 */
const G = 6.674e-11; // m³ kg⁻¹ s⁻² (CODATA 2018: 6.67430e-11)
const M_EARTH = 5.972e24; // kg

/** "1,5 массы", "1 масса", "3 массы", "250 масс". */
function massWord(shown: string) {
  if (/,/.test(shown)) return "массы";
  const n = Number(shown.replace(/\D/g, ""));
  const a = n % 100;
  const b = n % 10;
  if (a > 10 && a < 20) return "масс";
  if (b === 1) return "масса";
  if (b > 1 && b < 5) return "массы";
  return "масс";
}

export default function KeplerDemo() {
  const [days, setDays] = useState(10);
  const [kkm, setKkm] = useState(400);
  const id = useId();

  const T = days * 86400;
  const a = kkm * 1e6;
  const M = (4 * Math.PI ** 2 * a ** 3) / (G * T ** 2);
  const earths = M / M_EARTH;
  const fmt = (x: number) =>
    x >= 100 ? Math.round(x).toLocaleString("ru-RU") : x.toLocaleString("ru-RU", { maximumSignificantDigits: 3 });

  // Drawing: the orbit radius scales the ring; the period sets the moon's speed.
  const ring = 20 + (kkm / 2000) * 60;

  return (
    <div className="panel">
      <div className="grid items-center gap-6 md:grid-cols-[1fr_1.2fr]">
        <svg viewBox="-90 -90 180 180" className="w-full max-w-[18rem]" role="img" aria-label="Спутник на орбите вокруг планеты">
          <circle r={ring} fill="none" stroke="var(--line)" strokeWidth="1" strokeDasharray="3 4" />
          <circle r="12" fill="var(--btn)" />
          <g>
            <circle cx={ring} cy="0" r="4" fill="var(--ink)" />
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur={`${Math.max(1, days / 4)}s`} repeatCount="indefinite" />
          </g>
        </svg>
        <div>
          <p className="t-small">Масса планеты</p>
          <p className="t-stat mt-2">{fmt(earths)}</p>
          <p className="mt-2 text-ink">{massWord(fmt(earths))} Земли</p>
          <p className="fig t-small mt-4">M = 4π²a³ / (G·T²)</p>
          <p className="t-small">G = 6,674·10⁻¹¹ м³/(кг·с²), масса Земли = 5,972·10²⁴ кг</p>
        </div>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label htmlFor={`${id}-t`} className="block">
          <span className="text-ink-mute">
            Период спутника T: <span className="fig text-ink">{days.toLocaleString("ru-RU")} сут</span>
          </span>
          <input id={`${id}-t`} type="range" min={0.5} max={100} step={0.5} value={days} onChange={(e) => setDays(Number(e.target.value))} className="range mt-2" />
        </label>
        <label htmlFor={`${id}-a`} className="block">
          <span className="text-ink-mute">
            Радиус орбиты a: <span className="fig text-ink">{kkm.toLocaleString("ru-RU")} тыс. км</span>
          </span>
          <input id={`${id}-a`} type="range" min={10} max={2000} step={10} value={kkm} onChange={(e) => setKkm(Number(e.target.value))} className="range mt-2" />
        </label>
      </div>
      <p className="t-small mt-5">
        Масса спутника тут не нужна — она сокращается, если спутник намного легче планеты. Дальше орбита при том же периоде — тяжелее планета.
      </p>
    </div>
  );
}
