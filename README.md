# CraterClaim

Claim your place on the Moon.

A persistent interactive 3D Moon map where people claim digital lunar plots. Explore, select a rectangle, sign in, and pay with Lemon Squeezy. Active plots live in Supabase and show on the public Moon.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- React Three Fiber + Drei
- Supabase (auth, plot inventory, logo storage)
- Lemon Squeezy (checkout + webhooks)
- Vercel

## Locked product rules

- Brand name: **CraterClaim**
- Tagline: **Claim your place on the Moon.**
- Operator: **Riverra Labs LLP** · [hello@craterclaim.com](mailto:hello@craterclaim.com)
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

Supabase keys unlock Google / Apple / X / email sign-in and shared inventory. Without them, mock checkout still writes plots locally (`data/plots.json` in development, plus the browser). With them, sign-in is required to claim, and landings attach to `owner_id`.

Lemon Squeezy keys are required for live checkout. Production blocks mock activation.

Run the V1 schema in the SQL editor (or `supabase db push`) from `supabase/migrations/20260826120000_init.sql`. Add `http://localhost:3000/auth/callback` to Auth redirect URLs.

Moon color map: [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0). Displacement: [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/) (public domain).
