# PlanetWalk Web — content pipeline and site.
# Locally the Python tools run through uv; CI sets PY=python3 after pip install.

PY       ?= uv run --quiet --with-requirements tools/requirements.txt python3
SNAPSHOT ?= ../planet101/PlanetWalk/Resources/content.json
MD_FILES  = $(shell find . -name '*.md' -not -path './node_modules/*' -not -path './.next/*' -not -path './out/*' -not -path './.git/*')

.DEFAULT_GOAL := help
.PHONY: help validate links build snapshot live media media-download site deploy docs-fmt docs-check

help: ## List targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

validate: ## Schemas, ids, references, sheet facts, staleness warnings
	$(PY) tools/validate.py

links: ## validate + check every external URL answers 200 (network, slow)
	$(PY) tools/validate.py --links

build: ## validate + write public/content/v1/{content,manifest}.json
	$(PY) tools/build.py

snapshot: ## build + copy content.json into the iOS app bundle (../planet101/PlanetWalk/Resources)
	$(PY) tools/build.py --snapshot $(SNAPSHOT)

live: ## Refresh content/live.json from NASA Exoplanet Archive and JPL Horizons (network)
	$(PY) tools/fetch_live.py

media: ## Refresh content/media_candidates.json from the NASA Image Library (network)
	$(PY) tools/fetch_media.py

media-download: ## Download + resize media.json originals into public/media/ (network)
	$(PY) tools/fetch_media.py --download

site: build ## build + next build -> out/
	npm run build

deploy: site ## site + wrangler pages deploy to Cloudflare Pages project planetwalk
	npx wrangler pages deploy out --project-name planetwalk --branch master

docs-fmt: ## Tight-align all markdown tables
	python3 scripts/align-tables.py $(MD_FILES)

docs-check: ## Fail if any markdown table is unaligned (CI)
	python3 scripts/align-tables.py --check $(MD_FILES)
