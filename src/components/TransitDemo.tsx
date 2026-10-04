"use client";

import { useId, useState } from "react";

/**
 * Transit: a planet crosses a star's disc and the star dims by the share of
 * the disc it covers. Geometry only (uniform disc, no limb darkening); the
 * numbers are produced by the sliders, not taken from any real star.
 */

/** Area of overlap of two circles, radii R and r, centres d apart. */
function overlap(R: number, r: number, d: number) {
  if (d >= R + r) return 0;
  if (d <= Math.abs(R - r)) return Math.PI * Math.min(R, r) ** 2;
  const a = r * r * Math.acos((d * d + r * r - R * R) / (2 * d * r));
  const b = R * R * Math.acos((d * d + R * R - r * r) / (2 * d * R));
  const c = 0.5 * Math.sqrt((-d + r + R) * (d + r - R) * (d - r + R) * (d + r + R));
  return a + b - c;
}

const R = 70; // star radius in drawing units

export default function TransitDemo() {
  const [pos, setPos] = useState(50); // 0..100 across the path
  const [size, setSize] = useState(10); // planet radius as % of star radius
  const id = useId();

  const r = (R * size) / 100;
  const span = R + r + 12;
  const xOf = (p: number) => -span + (2 * span * p) / 100;
  const flux = (p: number) => 1 - overlap(R, r, Math.abs(xOf(p))) / (Math.PI * R * R);
  const depth = 1 - flux(50);
  const now = 1 - flux(pos);

  // Light curve, y scaled so the deepest dip fills most of the panel.
  const W = 300;
  const Hc = 90;
  const scale = depth > 0 ? (Hc - 20) / depth : 1;
  const pts = Array.from({ length: 101 }, (_, p) => `${(p * W) / 100},${(10 + (1 - flux(p)) * scale).toFixed(2)}`).join(" ");

  return (
    <div className="panel">
      <div className="grid items-center gap-6 md:grid-cols-2">
        <svg viewBox="-110 -90 220 180" className="w-full max-w-[22rem]" role="img" aria-label="Планета на фоне диска звезды">
          <circle r={R} fill="var(--btn)" opacity="0.9" />
          <circle cx={xOf(pos)} cy="8" r={r} fill="var(--bg)" stroke="var(--ink-dim)" strokeWidth="1" />
        </svg>
        <div>
          <p className="t-small">Яркость звезды</p>
          <svg viewBox={`0 0 ${W} ${Hc}`} className="mt-2 w-full" role="img" aria-label="Кривая блеска: провал, пока планета на диске">
            <line x1="0" y1="10" x2={W} y2="10" stroke="var(--line)" strokeWidth="1" />
            <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
            <circle cx={(pos * W) / 100} cy={10 + now * scale} r="5" fill="var(--accent)" stroke="var(--card)" strokeWidth="2" />
          </svg>
          <p className="fig mt-3 text-ink">
            Сейчас тусклее на {(now * 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} %
          </p>
          <p className="t-small">Глубина провала ≈ (r / R)² = {(depth * 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} %</p>
        </div>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label htmlFor={`${id}-p`} className="block">
          <span className="text-ink-mute">Положение планеты</span>
          <input id={`${id}-p`} type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="range mt-2" />
        </label>
        <label htmlFor={`${id}-s`} className="block">
          <span className="text-ink-mute">
            Размер планеты: <span className="fig text-ink">{size} %</span> радиуса звезды
          </span>
          <input id={`${id}-s`} type="range" min={2} max={40} value={size} onChange={(e) => setSize(Number(e.target.value))} className="range mt-2" />
        </label>
      </div>
      <p className="t-small mt-5">Схема, а не данные: звезда — ровный диск, числа задают ползунки.</p>
    </div>
  );
}
