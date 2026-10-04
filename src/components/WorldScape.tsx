import type { World } from "@/lib/content";

/**
 * A still of a world's landscape, drawn from its worlds.json palette with the
 * app's own terrain recipe (planet101 .ai/03-scene.md): value-noise fbm, three
 * parallax layers at base heights 0.38 / 0.28 / 0.16, amplitude amp[i]. It is
 * an illustration and is always captioned as one where it appears.
 */

const W = 640;
const H = 360;
const BASE = [0.38, 0.28, 0.16];
const FREQ = [0.004, 0.007, 0.012];

function fract(x: number) {
  return x - Math.floor(x);
}

function noise(seed: number) {
  const hash = (n: number) => fract(Math.sin(127.1 * n + 311.7 * seed) * 43758.5453);
  const vn = (x: number) => {
    const i = Math.floor(x);
    const f = x - i;
    const s = f * f * (3 - 2 * f);
    return hash(i) * (1 - s) + hash(i + 1) * s;
  };
  return (x: number) => 0.6 * vn(x) + 0.28 * vn(2.3 * x) + 0.12 * vn(5.1 * x);
}

function ridge(i: number, amp: number, fbm: (x: number) => number) {
  const pts: string[] = [];
  for (let x = 0; x <= W; x += 8) {
    // SVG y grows downward; the app's grows up.
    const y = H - (H * BASE[i] + amp * fbm(x * FREQ[i] + 50 * i) * (H / 500));
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return `M0,${H} L${pts.join(" L")} L${W},${H} Z`;
}

function SkyBody({ kind }: { kind: NonNullable<World["skyBody"]> }) {
  const cx = W * 0.28;
  if (kind === "jupiter") {
    const r = H * 0.2;
    const cy = H - H * 0.68;
    return (
      <g>
        <clipPath id="jup">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        <g clipPath="url(#jup)">
          <rect x={cx - r} y={cy - r} width={2 * r} height={2 * r} fill="#d9b98f" />
          {[-0.6, -0.25, 0.1, 0.45].map((k) => (
            <rect key={k} x={cx - r} y={cy + k * r} width={2 * r} height={r * 0.16} fill="#a8805a" opacity="0.7" />
          ))}
          <ellipse cx={cx + r * 0.3} cy={cy + r * 0.3} rx={r * 0.18} ry={r * 0.1} fill="#b5573a" />
          <rect x={cx + r * 0.35} y={cy - r} width={r} height={2 * r} fill="#000" opacity="0.35" />
        </g>
      </g>
    );
  }
  const cy = H - H * 0.8;
  if (kind === "saturn") {
    const r = H * 0.07;
    return (
      <g opacity="0.85">
        <circle cx={cx} cy={cy} r={r} fill="#e6cf9c" />
        <ellipse cx={cx} cy={cy} rx={r * 2.1} ry={r * 0.5} fill="none" stroke="#efdcb3" strokeWidth="2" transform={`rotate(-14 ${cx} ${cy})`} />
      </g>
    );
  }
  const r = H * 0.06;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#2f6fb8" />
      <ellipse cx={cx - r * 0.2} cy={cy - r * 0.1} rx={r * 0.45} ry={r * 0.3} fill="#4d8a4f" />
      <path d={`M${cx + r * 0.2},${cy - r} A${r},${r} 0 0 1 ${cx + r * 0.2},${cy + r} A${r * 0.7},${r} 0 0 0 ${cx + r * 0.2},${cy - r}`} fill="#000" opacity="0.4" />
    </g>
  );
}

export default function WorldScape({ w, index, className = "" }: { w: World; index: number; className?: string }) {
  const fbm = noise(index + 3);
  const starHash = (n: number) => fract(Math.sin(n * 12.9898 + (index + 3) * 78.233) * 43758.5453);
  const stars =
    w.stars > 0
      ? Array.from({ length: 70 }, (_, n) => ({
          x: starHash(n) * W,
          y: starHash(n + 500) * H * 0.7,
          r: 0.4 + starHash(n + 1000) * 0.9,
          a: w.stars * (0.4 + starHash(n + 1500) * 0.5),
        }))
      : [];
  const layerAlpha = w.gas ? [0.6, 0.75, 0.9] : [1, 1, 1];
  const gid = `sky-${w.id}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={`Иллюстрация: пейзаж, ${w.name}`}>
      <defs>
        {/* Sky gradient ends at 75% of the height, as in the scene. */}
        <linearGradient id={gid} x1="0" y1="1" x2="0" y2="0.25">
          <stop offset="0" stopColor={w.sky[1]} />
          <stop offset="1" stopColor={w.sky[0]} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${gid})`} />
      {stars.map((s, n) => (
        <circle key={n} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={s.r.toFixed(2)} fill="#fff" opacity={s.a.toFixed(2)} />
      ))}
      {w.skyBody && <SkyBody kind={w.skyBody} />}
      {w.sun && (
        <g>
          <circle cx={w.sun.x * W} cy={w.sun.y * H} r={Math.max(1.5, (w.sun.r * H) / 500) * 1.8} fill={w.sun.color} opacity="0.18" />
          <circle cx={w.sun.x * W} cy={w.sun.y * H} r={Math.max(1.5, (w.sun.r * H) / 500)} fill={w.sun.color} />
        </g>
      )}
      {w.weather === "haze" && <rect width={W} height={H} fill="#f3cf8a" opacity="0.14" />}
      {[0, 1, 2].map((i) => (
        <path key={i} d={ridge(i, w.amp[i], fbm)} fill={w.ground[i]} opacity={layerAlpha[i]} />
      ))}
      {w.weather === "haze" && <rect width={W} height={H} fill="#f39a3a" opacity="0.12" />}
    </svg>
  );
}
