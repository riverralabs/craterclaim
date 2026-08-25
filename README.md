# CraterClaim

**Claim your place on the Moon.**

CraterClaim sells digital lunar plots on a 4,000,000-pixel Moon — not ads, not traffic, not physical land. The Moon itself is the product.

This repo holds the brand assets and Cursor build guide so implementation can continue from a single GitHub source of truth.

## What’s in this repo

| Path | Purpose |
| --- | --- |
| [`docs/CraterClaim-Cursor-Build-Guide.md`](docs/CraterClaim-Cursor-Build-Guide.md) | Locked product rules, stack, schema, and Phase 1–6 implementation order |
| [`public/brand/`](public/brand/) | Logo (navbar, favicon, OG) |
| [`public/images/`](public/images/) | Moon still / marketing render |
| [`public/textures/moon/`](public/textures/moon/) | Equirectangular Moon texture for the 3D scene |

The Cursor guide also references `CraterClaim-Final-Build-Spec.md`. That file is not in the repo yet — add it under `docs/` when available.

## Locked product decisions

| Rule | Value |
| --- | --- |
| Zones | Standard `$0.50`/px · Premium `$1.00`/px |
| Premium visual | Soft golden glow on Premium grids / boundaries |
| Inventory | 4,000,000 pixels |
| Minimum plot | 10 × 10 (snap to multiples of 10) |
| Idle rotation | Stops permanently on first interaction |
| Mobile | Mobile-first (bottom sheets, touch, 2D fallback) |
| Payment | Mock + webhook-ready (provider later) |

Never position this as an advertising network. Never promise impressions, clicks, SEO, traffic, leads, or rankings. Always make clear a plot is a **digital lunar plot**, not physical land.

## Stack (locked)

Next.js 15 (App Router) · TypeScript · Tailwind · shadcn/ui · React Three Fiber · Supabase · Vercel · Zustand · TanStack Query · Zod

Bootstrap and folder layout are in the [Cursor Build Guide](docs/CraterClaim-Cursor-Build-Guide.md). Start with **Phase 1 + Phase 2 only**.

## Brand assets

Drop the original files here (keep these names so the app can reference them later):

- `public/brand/craterclaim-logo.png` — 3D chrome crescent, cratered lunar surface, flag, four-point star, electric-blue neon edge on black
- `public/images/moon-render.png` — photorealistic full Moon, centered on black (hero / marketing still)
- `public/textures/moon/` — high-res equirectangular texture (NASA SVS CGI Moon Kit or Solar System Scope 8K)

Palette: black void, polished silver/chrome, electric blue accent. Premium plots use a soft golden glow — not a third color in the logo.

## Environment

Copy [`.env.example`](.env.example) to `.env.local`. Set the same keys in the Vercel project when you deploy.

```bash
cp .env.example .env.local
```

## First prototype (definition of done)

A user on mobile or desktop can: see a rotating Moon → interact (rotation stops forever) → select a rectangle → see Standard/Premium price → complete a mock claim → land on a public `/plot/[id]` page and share it.

Work phase-by-phase. Finish Phase 2 before Phase 3.
