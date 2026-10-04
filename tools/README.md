# tools/ — PlanetWalk content pipeline

Python 3.11+, dependencies `requests` and `jsonschema` only (`requirements.txt`). Run through `make`; locally the Makefile uses `uv run --with-requirements tools/requirements.txt python3`, CI passes `PY=python3` after `pip install`.

- **`fetch_live.py`** (`make live`) writes `content/live.json`: the confirmed exoplanet count and TRAPPIST-1 e parameters from the NASA Exoplanet Archive TAP, and the distance from Earth to eight bodies from JPL Horizons (observer range `delta`, light time = AU × 499.005 s). Every value carries its own `fetchedAt`. If a source fails, the previous value and its old date are kept; the run still exits 0 with a warning.
- **`fetch_media.py`** (`make media`) searches the NASA Image and Video Library for every mission (`nameOriginal`) and world, and writes `content/media_candidates.json` (gitignored) for a human to pick from into `media.json`. `--download` (`make media-download`) fetches each `media.json` `originalUrl` once into `public/media/<file>`, resized with macOS `sips` to at most 1600 px on the long side as JPEG quality 80.
- **`validate.py`** (`make validate`) checks schemas, unique ids, references, the five sheet facts per world, gravity fact vs. `worlds.json` `g`, the optional `worlds.json` `survival` section (every fact id resolves; every number in `helmetOff.text` appears in the `display` of one of its `factIds`), sources, and staleness. Errors exit 1; warnings do not. `--links` (`make links`, weekly CI) also checks every external URL.
- **`build.py`** (`make build`) validates, then writes `public/content/v1/content.json` and `manifest.json`. `version` bumps only when the content bytes change, so a no-op build is a no-op. When no local manifest exists (a fresh CI checkout), it reads the deployed one from `$SITE_URL`. `--snapshot <path>` (`make snapshot`) also copies `content.json` into the iOS app bundle.

`SITE_URL` (default `https://planetwalk.pages.dev`) is the base for media URLs in the built content.

No API keys are used anywhere. Re-check the endpoint formats quarterly; the formats each parser expects are in the module docstrings.
