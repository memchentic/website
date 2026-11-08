# memchentic website

Public product pitch site for [memchentic](https://github.com/memchentic/memchentic).

Live: [https://memchentic.github.io/website/](https://memchentic.github.io/website/)

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

Vite `base` is `/website/` for GitHub Pages project hosting. Push to `main` deploys via `.github/workflows/pages.yml`.

## Nested checkout

This repo is meant to live as a nested git tree under a memchentic monorepo checkout at `website/` (same pattern as `docs/`). The parent ignores `website/`; commit and push here.
