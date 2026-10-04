# CLAUDE.md — PlanetWalk Web

## What this repo is

The public half of **PlanetWalk**, an educational iOS app where you walk as an astronaut across real worlds and feel their gravity in every jump. The app itself lives in the private repo `dspv/planet101`; its `.ai/` corpus is canonical for everything about the product (read `~/dev/planet101/.ai/00-index.md` if you have it locally).

This repo holds three things:

1. **`content/`** — the app's content: worlds, facts with sources and "How we know", missions, methods, media, live data. JSON, validated by JSON Schema in `content/schemas/`. **This is the one home of all content**; the app bundles a snapshot of the build output and updates from the hosted copy.
2. **`tools/`** — the Python data pipeline: `fetch_live.py`, `fetch_media.py`, `validate.py`, `build.py`.
3. **The website** — Next.js static export (root of the repo: `src/`, `public/`), deployed to Cloudflare Pages project `planetwalk` → https://planetwalk.pages.dev/. It presents the app and renders the same content as readable pages. The build output of `tools/build.py` is served at `/content/v1/manifest.json` and `/content/v1/content.json`; selected images at `/media/<file>.jpg`.

## Non-negotiable rules

1. **No source, no fact.** Every figure and claim in `content/` and on the site traces to a `facts.json` record with `source.url`, `lastVerified` and `verifiedBy`. AI is never a source. A record checked by an agent against the fetched primary source gets `verifiedBy: "agent"`; only a human sets `"human"`. When unsure, leave it out.
2. **No invented numbers** anywhere — not on the site, not in examples, not in placeholders. A figure you do not have is not shown.
3. **The app never calls agency APIs.** Only `tools/` talks to NASA/JPL/ESA; the app reads our hosted files. Never put an API key in content or the site.
4. **Photo vs illustration.** Real images carry mission and credit; renders and AI video are labelled «Иллюстрация». Exoplanet visuals are «художественная модель».
5. **Not affiliated.** The site never implies NASA/ESA endorsement; agency logos are not used. The footer says «Не аффилировано с NASA, ESA или другими агентствами».
6. **Language.** Code, comments, docs, commits: English. Product content (`content/*.json` texts, site copy) is Russian — the audience is Russian-speaking, 12+, curious, no special training. Tone: lively, plain, scientifically exact.
7. **`content/live.json` is written only by `tools/fetch_live.py`.** Never by hand.
8. **$0 budget.** Static export, free hosting.

## Commands

```bash
make validate   # schemas, referential integrity, staleness warnings
make build      # validate + write public/content/v1/{content,manifest}.json
make live       # refresh content/live.json from NASA/JPL (network)
make media      # refresh content/media_candidates.json (network)
make site       # build + next build → out/
make deploy     # site + wrangler pages deploy out --project-name planetwalk
make docs-fmt   # align markdown tables
```

## Design

The site follows the reading system in [`DESIGN.md`](DESIGN.md), adapted from caprock.dev.
