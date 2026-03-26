# Agent Guide (ruina.team wiki)

This repo is a Nuxt 3 static site (GitHub Pages) with markdown content via `@nuxt/content`, plus a small “chat tiers” UI that can read prefetched JSON caches.

## Quick commands

- Install: `bun install`
- Dev server: `bun run dev`
- Lint: `bun run lint` (oxlint)
- Typecheck: `bun run typecheck`
- Prefetch public data into `public/api-cache/`: `bun run fetch:data`
- Static build (what CI/GitHub Pages uses): `bun run build`
- Preview static output: `bun run preview`

## Project structure (high-signal)

- `content/` — markdown pages rendered by `@nuxt/content`
  - Guides live in `content/guides/*.md` and are rendered by `pages/guides/[...slug].vue`
  - Use frontmatter like: `title`, `author`, `description`, `image_url`, `created_at`, `updated_at`, `tags`
- `pages/` — Nuxt routes (static generation + content routes)
- `components/` — Vue UI pieces (notably `components/chat-tiers/*`)
- `lib/` — API/Supabase helpers and scoring logic
- `scripts/`
  - `scripts/fetch-data.ts` writes JSON caches used by the site (`public/api-cache/{tiers,roles}`)
  - `scripts/scan-roles.ts` is a debugging utility for roles
- `server/api/roles.get.ts` — server route proxy to `tools.2807.eu` (dev/runtime convenience)

## Data fetching + caching rules

- `public/api-cache/` is intentionally gitignored; CI runs `bun run fetch:data` before `bun run generate` so the generated site includes the cache without committing it.
- Do not add secrets to the repo. Use environment variables (see `.env` locally; GitHub Actions uses repo secrets).
- External APIs used:
  - Roles/VIPs: `https://tools.2807.eu/api/getmods/:channel` and `.../getvips/:channel`
  - Tiers snapshots: Supabase table `tiers_snapshots` (public anon key only)

## Conventions to follow when editing

- Keep changes small and consistent with existing style (SFCs, TypeScript, minimal abstractions).
- Avoid touching `node_modules/`, `.nuxt/`, `.output/`, `public/api-cache/` (generated/ignored).
- Prefer adding/adjusting content in `content/` over hardcoding UI strings in components/pages.
- If you add a new route/content folder, ensure it is prerendered (see `nuxt.config.ts` prerender routes logic).

## CI / deployment notes

- Deployment is via `.github/workflows/deploy.yml` to GitHub Pages using `nitro.preset = 'github-pages'`.
- If a change affects build output, validate locally with `bun run build` (and ideally `bun run typecheck`).
