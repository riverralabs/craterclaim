# CraterClaim

Claim your place on the Moon.

A persistent interactive 3D Moon map where people claim digital lunar plots. Explore, select a rectangle, sign in, and complete a mocked claim. Real payments and Supabase-backed inventory come next.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- React Three Fiber + Drei
- Supabase (client helpers only in this phase)
- Vercel

## Locked product rules

- Brand name: **CraterClaim**
- Tagline: **Claim your place on the Moon.**
- Zones: Standard **$0.50/px** and Premium **$1.00/px** only
- Premium regions glow gold
- Idle Moon rotation stops permanently on first interaction
- Digital plots only — not physical land, not advertising

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Supabase keys are optional until you want accounts. Without them, mock checkout still writes plots locally (`data/plots.json` in development, plus the browser). With them, magic-link sign-in is required to claim, and landings attach to `owner_id`.

Run the V1 schema in the SQL editor (or `supabase db push`) from `supabase/migrations/20260826120000_init.sql`. Add `http://localhost:3000/auth/callback` to Auth redirect URLs.

Moon color map: [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0). Displacement: [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/) (public domain).
