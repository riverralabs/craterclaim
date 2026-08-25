# CraterClaim — Cursor Build Guide

**Stack:** Next.js (latest) · Supabase · Vercel · TypeScript · Tailwind · React Three Fiber  
**Last updated:** 25 Aug 2026  
**Source of truth:** `CraterClaim-Final-Build-Spec.md`

This document is written specifically for **Cursor**.  
Paste sections of this file into Cursor Composer / Agent as needed.  
Keep the Final Spec open as secondary context (`@CraterClaim-Final-Build-Spec.md`).

---

## 0. Locked Product Decisions (do not deviate)

| Rule | Value |
|------|-------|
| Product name | **CraterClaim** |
| Tagline | Claim your place on the Moon. |
| Zones | **Standard** `$0.50`/px · **Premium** `$1.00`/px |
| Premium visual | Soft **golden glow** on Premium grids / boundaries |
| Total inventory | **4,000,000 pixels** |
| Minimum plot | **10 × 10** (always snap to multiples of 10) |
| Selection | Drag rectangle (primary) + click-anchor → opposite corner |
| Idle rotation | Stops **permanently** on first interaction / selection start |
| Mobile | **Mobile-first** mandatory (bottom sheets, touch, 2D fallback) |
| Payment | Mock + webhook-ready architecture (provider later) |
| Branding | Domains + logo already exist |

**Positioning rules (non-negotiable):**
- Never position as an advertising network.
- Never promise impressions, clicks, SEO, traffic, leads, or rankings.
- Always make clear this is a **digital lunar plot**, not physical land ownership.
- The Moon itself is the product.

---

## 1. Tech Stack (locked)

```txt
Framework:          Next.js 15 (App Router) + TypeScript
Styling:            Tailwind CSS + shadcn/ui
3D Engine:          Three.js + @react-three/fiber + @react-three/drei
Post-processing:    @react-three/postprocessing (soft bloom for Premium glow only)
Client state:       Zustand
Server state:       TanStack Query
Database + Auth:    Supabase (Postgres + Auth + Storage + RLS)
Validation:         Zod
Forms:              React Hook Form + Zod
Image processing:   Sharp (server-side)
Hosting:            Vercel
```

### Project bootstrap

```bash
npx create-next-app@latest craterclaim \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --turbopack

cd craterclaim

# shadcn
npx shadcn@latest init

# Core dependencies
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
npm install @supabase/supabase-js @supabase/ssr
npm install zustand zod react-hook-form @hookform/resolvers
npm install @tanstack/react-query
npm install sharp clsx tailwind-merge lucide-react class-variance-authority
```

---

## 2. Recommended Folder Structure

```txt
src/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                 # Homepage + hero Moon
│   │   ├── how-it-works/page.tsx
│   │   └── layout.tsx
│   ├── plot/
│   │   └── [plotId]/page.tsx        # SSR public plot page
│   ├── claim/page.tsx               # Claim flow
│   ├── leaderboard/page.tsx
│   ├── recent/page.tsx
│   ├── api/
│   │   ├── plots/
│   │   ├── checkout/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── moon/
│   │   ├── MoonScene.tsx            # <Canvas> root
│   │   ├── MoonSphere.tsx           # Geometry + texture
│   │   ├── OwnershipLayer.tsx       # Dynamic canvas texture / shader
│   │   ├── SelectionController.tsx  # Drag + click selection
│   │   ├── PlotMarkers.tsx
│   │   └── CameraController.tsx
│   ├── selection/
│   │   └── SelectionPanel.tsx       # Mobile = bottom sheet
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── plot/
│   │   └── PlotCard.tsx
│   └── ui/                          # shadcn components
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── moon/
│   │   ├── coordinates.ts           # lat/lng ↔ pixel grid
│   │   ├── pricing.ts               # server-side only
│   │   └── regions.ts
│   ├── store/
│   │   └── moon-store.ts            # Zustand
│   └── utils.ts
├── types/
│   └── index.ts
└── hooks/
    ├── useMoonInteraction.ts
    └── usePlotSelection.ts
```

---

## 3. Environment Variables

`.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Later (payment provider)
# PAYMENT_PROVIDER_API_KEY=
# WEBHOOK_SECRET=
```

Add the same keys in the Vercel project settings.

---

## 4. Supabase Schema (V1)

Run in Supabase SQL Editor (or create a migration).

```sql
-- Profiles
create table public.profiles (
  id uuid references auth.users primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Lunar features (seed later)
create table public.lunar_features (
  id serial primary key,
  name text not null,
  type text, -- mare, crater, etc.
  center_lat float8,
  center_lng float8,
  is_premium boolean default false
);

-- Plots
create table public.plots (
  id text primary key,                    -- e.g. CLM-8847
  owner_id uuid references public.profiles(id),
  x int not null,
  y int not null,
  width int not null,
  height int not null,
  pixel_count int not null,
  center_latitude float8 not null,
  center_longitude float8 not null,
  lunar_feature_id int references public.lunar_features(id),
  zone text not null check (zone in ('standard', 'premium')),
  status text not null default 'available'
    check (status in ('available','reserved','payment_pending','active','suspended','deleted')),
  price_paid numeric(12,2),
  claim_date timestamptz,
  reserved_until timestamptz,
  name text,
  description text,
  website_url text,
  logo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Audit
create table public.plot_events (
  id bigserial primary key,
  plot_id text references public.plots(id),
  event_type text not null,
  actor_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.plots enable row level security;
alter table public.plot_events enable row level security;

create policy "Public active plots are viewable by everyone"
  on public.plots for select using (status = 'active');

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
```

Generate types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

---

## 5. Core Implementation Order (follow this sequence in Cursor)

### Phase 1 — Foundation
1. Bootstrap Next.js + shadcn + dark theme
2. Supabase client helpers (`lib/supabase/`)
3. Layout + Navbar with **CraterClaim** branding + logo
4. Homepage shell with correct hero copy

### Phase 2 — Interactive Moon (highest priority)
1. `MoonScene.tsx` with `<Canvas>`
2. Procedural `SphereGeometry` + high-res equirectangular texture
3. Idle auto-rotation that **stops permanently** on first pointer interaction
4. OrbitControls with damping + zoom limits
5. Full mobile touch support

**Zustand store (required):**

```ts
// lib/store/moon-store.ts
import { create } from 'zustand'

interface MoonState {
  isInteracting: boolean
  hasUserInteracted: boolean
  selectionMode: boolean
  setInteracting: (v: boolean) => void
  markUserInteracted: () => void
  setSelectionMode: (v: boolean) => void
}

export const useMoonStore = create<MoonState>((set) => ({
  isInteracting: false,
  hasUserInteracted: false,
  selectionMode: false,
  setInteracting: (v) => set({ isInteracting: v }),
  markUserInteracted: () => set({ hasUserInteracted: true }),
  setSelectionMode: (v) => set({ selectionMode: v }),
}))
```

**Idle rotation (stops forever after first interaction):**

```tsx
// Inside MoonSphere or CameraController
const hasUserInteracted = useMoonStore((s) => s.hasUserInteracted)
const moonRef = useRef<THREE.Mesh>(null)

useFrame((_, delta) => {
  if (!hasUserInteracted && moonRef.current) {
    moonRef.current.rotation.y += 0.015 * delta // ≤ 0.02 rad/s
  }
})
```

On any pointer down / selection start → call `markUserInteracted()`.

### Phase 3 — Coordinate + Ownership system
1. Equirectangular helpers (`lib/moon/coordinates.ts`)
2. Ownership layer as one dynamic canvas texture or shader (never one mesh per plot)
3. Premium regions get soft golden emissive / bloom
4. LOD: grid density increases on zoom

### Phase 4 — Selection system
1. Enter Select mode → show grid
2. Drag-to-select rectangle (primary path)
3. Snap to 10×10 blocks
4. Live calculation of size, pixel count, nearest feature, zone, price
5. `SelectionPanel` — desktop = side panel, mobile = bottom sheet

### Phase 5 — Claim flow + Public page
1. `/plot/[plotId]` fully server-rendered
2. Claim form (name, description, website, logo upload)
3. Mock payment + 15-minute reservation
4. Fly-to-landing animation (skippable + respects `prefers-reduced-motion`)
5. Webhook-ready architecture even while mocked

### Phase 6 — Polish
- Mobile-first bottom sheets everywhere
- 2D fallback when WebGL fails
- Leaderboard + Recent Claims
- SEO via `generateMetadata` on plot pages
- `prefers-reduced-motion` support

---

## 6. Pricing (server-side only)

```ts
// lib/moon/pricing.ts
export const PIXEL_PRICE = {
  standard: 0.5,
  premium: 1.0,
} as const

export function calculatePrice(pixelCount: number, zone: 'standard' | 'premium') {
  return Number((pixelCount * PIXEL_PRICE[zone]).toFixed(2))
}
```

**Never trust a price coming from the client.** Always recalculate on the server before creating a reservation or payment intent.

---

## 7. Cursor Workflow Tips

1. **Always keep both docs in context**
   ```
   @CraterClaim-Final-Build-Spec.md
   @CraterClaim-Cursor-Build-Guide.md
   ```

2. **Use Composer for multi-file features**  
   Select the entire `components/moon/` folder + store when implementing interaction.

3. **Work phase-by-phase**  
   Finish Phase 2 completely before starting Phase 3. Do not mix concerns.

4. **Mobile first**  
   Test on real devices via Vercel preview early. Bottom sheets and touch are non-negotiable.

5. **Texture**  
   Place a high-quality equirectangular Moon texture in `/public/textures/moon/`.  
   Recommended: NASA SVS CGI Moon Kit or Solar System Scope 8K.

---

## 8. Vercel Notes

- Set all environment variables in the Vercel dashboard
- Use Supabase connection pooling (or the recommended serverless setup)
- Prefer `next/image` + Sharp for logos
- Public plot pages can use Edge Runtime if beneficial
- Large textures: plan for KTX2 / Basis compression later if needed

---

## 9. Definition of Done — First Prototype

A user on mobile or desktop must be able to:

1. Land on the homepage and see a beautiful rotating Moon
2. Interact → rotation stops permanently
3. Enter Select mode and drag a rectangle
4. See correct Standard / Premium price
5. See an accurate selection panel
6. Complete a mock claim
7. Land on a public `/plot/[id]` page
8. Share the page

---

## 10. Ready-to-paste Cursor Agent Prompt

Copy this into Cursor Agent when you start:

```
Read @CraterClaim-Final-Build-Spec.md and @CraterClaim-Cursor-Build-Guide.md carefully.

We are building CraterClaim with:
- Next.js 15 (App Router) + TypeScript
- Supabase (Auth + Postgres + Storage + RLS)
- Vercel
- Tailwind + shadcn/ui
- React Three Fiber + Drei

Start with Phase 1 + Phase 2 only:

1. Set up the exact folder structure from the Cursor Build Guide.
2. Implement the interactive 3D Moon with idle rotation that permanently stops on first user interaction.
3. Use the locked brand name “CraterClaim” and the tagline “Claim your place on the Moon.”
4. Mobile-first from the first commit.
5. Only two zones: Standard ($0.50/px) and Premium ($1.00/px) with golden glow on Premium.

Do not implement payment, claim flow, or leaderboard yet.
Do not invent extra pricing tiers.
```

---

**This file + the Final Spec are the only two documents you need in Cursor.**  
Everything else should be generated from them.
