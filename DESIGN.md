# DESIGN.md — the reading system

Adapted from caprock.dev. The site is read, not admired: a curious 12-year-old or a parent opens a page in either theme, on a phone, and reads it end to end without leaning in. The site is in Russian, so every choice below has to hold up with long Cyrillic words.

## Colour: paper and graphite, one accent

Two themes, tuned like a printed page. Neither is pure white or pure black. The theme follows the OS until the reader picks one with the toggle (remembered in that browser only); without JavaScript a `prefers-color-scheme` rule still follows the OS. Tokens live in `src/app/globals.css`.

Ratios are WCAG 2 contrast, computed, not eyeballed:

| Token      | Graphite  | Ratio  | Paper     | Ratio  |
| ---------- | --------- | ------ | --------- | ------ |
| `bg`       | `#18191b` | —      | `#f2efe8` | —      |
| `ink`      | `#e9e6df` | 14.1:1 | `#1f1d1a` | 14.6:1 |
| `ink-mute` | `#b8b4ab` | 8.5:1  | `#4a463f` | 8.2:1  |
| `ink-dim`  | `#918d85` | 5.3:1  | `#635e55` | 5.6:1  |
| `accent`   | `#f08c50` | 7.2:1  | `#a8471b` | 5.1:1  |

- `ink-dim` on `card` is 4.9:1 (graphite); `accent` on `bg-soft` is 4.75:1 (paper). Nothing a reader must read goes below 4.5:1; `ink-faint` is decoration only.
- **One accent: Mars dust.** A warm orange, because the app opens on Mars and the colour reads as rock and dust, not neon. `--accent` is for text and marks; `--btn` fills buttons and the star in the transit demo, always with `--btn-ink` on it (6.9:1 / 6.2:1).
- **No space clichés.** No starfield backgrounds, no nebula gradients, no glow. Stars appear only inside a world's landscape, where `worlds.json` says that world's sky has them.

## Type: large and few

- **Onest** (fontsource variable, ships `cyrillic` and `cyrillic-ext`) for everything a person reads. Designed for Russian; Hanken Grotesk has no Cyrillic.
- **JetBrains Mono** (variable, ships Cyrillic) only for what an instrument would print: eyebrows, figures (`.fig`), confidence badges.

| Class       | Use                     | Size (min → max) |
| ----------- | ----------------------- | ---------------- |
| `t-display` | the one landing h1      | 2.3 → 4.25rem    |
| `t-page`    | h1 on an inner page     | 2.2 → 3.5rem     |
| `t-title`   | section h2              | 1.85 → 3rem      |
| `t-sub`     | sub-section, teaser     | 1.6 → 2.4rem     |
| `t-head`    | card title, fact value  | 1.25 → 1.5rem    |
| `t-lead`    | paragraph under a title | 1.125 → 1.375rem |
| `t-stat`    | a big figure            | 2.6 → 4rem       |
| `t-small`   | captions, sources, date | 0.9375rem        |

- The top steps are a notch under caprock's: Russian headings run longer and must break on words, not letters.
- Body text 17px, 18px from 640px, line-height 1.6. Nothing a reader must read is under 0.85rem.

## Layout: two widths

- `.wrap` — 1200px, the grid for bands, nav and footer. 16px side gutter on a phone.
- `.wrap-read` — one centred reading column (about 46rem) for pages read top to bottom: a method, about, privacy.
- `.measure` — 64ch, the longest line of prose inside a `.wrap`.

Do not add a third width.

## Blocks

`src/components/Blocks.tsx`: `Band` (a section; `soft` for the alternate ground; `read` for the reading column), `Head` (eyebrow, title, lead), `Stats`, `Items`. Domain pieces:

- **`FactCard`** — label, value (`display`), confidence badge, «Как мы это знаем», mission and method chips, source link, «Проверено <date>». A record with `verifiedBy: "agent"` says it still awaits a human check.
- **`Badge`** — the confidence **word** (Измерено / Вычислено / Оценка / Модель / Неизвестно) with a glyph that only repeats it. Never colour alone.
- **`WorldScape`** — a world's landscape drawn with the app's own terrain recipe (`.ai/03-scene.md`) from `sky`, `ground`, `amp`, `sun`, `stars`, `skyBody`. Always captioned «Иллюстрация»; TRAPPIST-1e as «художественная модель».
- **`JumpBars`** — jump height 0.5 m ÷ g per world, g from each gravity fact. One series, one hue, values printed beside the bars; Earth in grey as the reference.
- **`TransitDemo`, `KeplerDemo`** — client-side explainers. Their numbers come from the sliders and stated formulas, and each says it is a scheme, not data.

## Numbers: from content, never typed

Every figure on the site is read from `content/*.json` at build time by `src/lib/content.ts`, or is true by construction from such a figure (the jump line, the bar chart). No page types a measured value.

- A missing or partial content file is treated as empty: the page renders with less on it, never with a placeholder number. A dynamic route with no records gets one unlinked placeholder id that renders the 404 (static export refuses an empty route list).
- Live values (`live.json`) are shown only with their `fetchedAt` date.
- Images come from `public/media/` only when the file is actually there. A photo is captioned «Снимок: <mission>, <credit>»; anything drawn says «Иллюстрация».

## Copy: cut to the bone

- One idea per line. A second sentence adds a fact or goes.
- Plain and exact; no «погрузитесь», «уникальный», «невероятный», no exclamation marks.
- The app is in development: say so plainly. No release date, no App Store badge.
- Footer, every page: «Не аффилировано с NASA, ESA или другими агентствами». No agency logos.

## Checklist: a new page or block

1. Build it from the blocks, one of the two widths, the type scale. Tokens only — no hex in components (world palettes from content are the exception: they describe the world).
2. Every figure comes from content; check what the page does when that content is missing.
3. Cut the copy.
4. Add the route to `src/app/sitemap.ts`.
5. `npm run build`, serve `out/`, screenshot in both themes at 1440px and at 400px, and look at the images. Headless Chrome will not go below about 500px wide: load the page in a 400px iframe to see the phone layout.
