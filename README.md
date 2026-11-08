# memchentic website

Public product pitch site for [memchentic](https://github.com/memchentic/memchentic).

Live (homelab): [https://memchentic.nodadyoushutup.com/](https://memchentic.nodadyoushutup.com/)

GitHub Pages mirror: [https://memchentic.github.io/website/](https://memchentic.github.io/website/)

## Local

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

Vite `base` defaults to `/website/` for GitHub Pages. Homelab/container builds set `VITE_BASE=/` (see `docker/Dockerfile`). Push to `main` deploys Pages via `.github/workflows/pages.yml`.

Homelab Swarm image: workflow_dispatch **Publish Website Image** → `ghcr.io/memchentic/website:<semver>` (multi-arch). Pin that tag in `homelab` `terraform/swarm/memchentic/website/main.tf`.

## Nested checkout

This repo is meant to live as a nested git tree under a memchentic monorepo checkout at `website/` (same pattern as `docs/`). The parent ignores `website/`; commit and push here.

## Demo screenshots

Product shots under `public/screenshots/` were captured from a local Compose GUI with seeded Northline demo data:

```bash
# requires docker/.env ADMIN_* and a running stack on :18080/:18081
python3 -m venv /tmp/memchentic-shots-venv
/tmp/memchentic-shots-venv/bin/pip install playwright
/tmp/memchentic-shots-venv/bin/playwright install chromium
/tmp/memchentic-shots-venv/bin/python scripts/seed_demo_and_shots.py
```
