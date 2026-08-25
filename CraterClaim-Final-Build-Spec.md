# CraterClaim — Final Build Specification v2.0

**Product:** Persistent interactive 3D Moon map where people claim digital lunar plots.  
**Tagline:** Claim your place on the Moon.  
**Positioning:** A permanent digital map of startups, projects, communities, and people on the Moon.  
**Status:** Final locked decisions for V1 build.  
**Last updated:** 25 Aug 2026  
**Domains:** Claimed  
**Logo:** Built and available

---

## 0. Critical Locked Decisions (from founder)

These override the original draft and are now final:

| Decision | Final Choice |
|---|---|
| Pricing tiers | **Only two:** Standard ($0.50 / px) and Premium ($1.00 / px). No Epic / Legendary / auction tiers. |
| Premium visual | Premium region grids **glow golden**. |
| Total inventory | **4,000,000 pixels** covering the entire Moon. |
| Selection method | **Drag-to-select rectangle** supported (primary). Click-anchor → opposite-corner also allowed. Always snaps to 10×10 minimum blocks. |
| Moon rotation | Idle auto-rotation. **Stops permanently** the moment the user starts selecting or interacting. |
| Moon geometry | Procedural sphere + real high-resolution equirectangular texture (NASA / Solar System Scope). |
| Mobile | **Mobile-first** design is mandatory. Desktop is enhancement. |
| Payment | Provider to be decided later. Build mock + real webhook-ready architecture. |
| Brand assets | Domains claimed. Logo already built. |

---

## 1. Product definition

### 1.1 Core promise
Users claim a **digital lunar plot** and attach an identity to it — a startup, company, project, community, or person.

### 1.2 Core loop
```
See Moon → rotate (idle) → zoom → select plot (drag) → see price → claim → pay
→ fly to landing → public plot page → share
```

### 1.3 Value proposition
Identity + place + scarcity + history + collectibility + shareability.

### 1.4 Positioning constraints (non-negotiable)
- **MUST NOT** be positioned as an advertising network.
- **MUST NOT** promise impressions, clicks, SEO, traffic, leads, conversions, or rankings.
- All UI, copy, database terminology, and checkout flows **MUST** make clear that users are not purchasing physical lunar land.
- The Moon **MUST** remain the visual hero on every screen where it appears.

### 1.5 Canonical vocabulary
| Term | Meaning |
|---|---|
| Plot | The user-facing economic unit. Always rectangular in V1. |
| Pixel | The underlying atomic grid cell. Never used as a standalone product noun in customer copy. |
| Landing | A claimed plot presented as a destination. |
| Claim | The act of acquiring a plot. |
| Region | A named lunar feature area. |
| Zone | Standard or Premium. |
| Owner | The account holding an active plot. |

**Copy rule:** say "a 20×20 plot," not "400 pixels," in marketing surfaces. Pixel counts appear in detail panels and receipts only.

---

## 2. Brand and visual direction

### 2.1 Logo
Already built. Primary mark is a refined geometric lunar emblem.  
Required exports already available or to be generated from the master: header logo, favicon, app icon, plot badge, map marker, social avatar, monochrome.

### 2.2 Palette
| Token | Use |
|---|---|
| `--space` deep black | Page background |
| `--lunar-silver` | Moon surface midtones |
| `--white` / `--electric-white` | Primary text, key highlights |
| `--charcoal` | Panel surfaces |
| `--violet` | Accent, selection, interactive state |
| `--gold` | **Premium only** — grid glow, badges, premium labels |

### 2.3 Style rules
- Glassmorphism used sparingly — panels only.
- Borders thin and low-contrast. Glow soft.
- Large negative space around the Moon.
- Interface **MUST NOT** read as: cheap crypto, generic SaaS, cartoon Moon, excessive neon, rainbow gradients.

**Grid glow rule (final):**  
- Standard grids: thin low-opacity line (≤0.25 alpha) when visible.  
- Premium grids: soft golden glow.  
- Selection / hover / claimed: stronger glow.

---

## 3. 3D Moon

### 3.1 Stack
Three.js · React Three Fiber · Drei · @react-three/postprocessing (soft glow only).

### 3.2 Geometry (locked)
- Procedural `SphereGeometry(1, 128, 128)` (or higher on desktop).
- High-resolution equirectangular Moon texture (recommended sources):
  - NASA SVS CGI Moon Kit (public domain)
  - Solar System Scope 8K Moon texture (CC BY 4.0)
- Separate normal / displacement maps for terrain relief.
- Dynamic UI, ownership data, logos, flags, labels, and plot boundaries **MUST NOT** be baked into the Moon asset.

### 3.3 Layer architecture
| Layer | Contents | Update frequency |
|---|---|---|
| **A — Moon** | Geometry, terrain, base colour, normal, roughness, lighting | Static |
| **B — Ownership** | Available plots, claimed plots, Premium golden grids, selection, boundaries | On data change |
| **C — Information** | Logos, flags, markers, region labels, activity | On camera / data change |

- Layer B is a single dynamic canvas texture (or shader-driven).  
- One mesh per plot is forbidden.  
- Full UI cards are React/HTML only.

### 3.4 Camera and motion (locked)
- Supported: rotation, drag, zoom, smooth inertia, hover, plot selection, camera fly-to, landmark navigation, selected-plot highlight.
- **Idle drift** at ≤ 0.02 rad/s.
- Drift **stops permanently** on first pointer-down / selection start / any meaningful interaction.
- Zoom clamped to defined near/far bounds.
- Fly-to transitions ease and are interruptible.
- `prefers-reduced-motion`: disable drift, fly-to animation, activity effects.

### 3.5 Level of detail
| Zoom | Visible |
|---|---|
| Far | Moon, sparse activity, major landmarks, Premium regions (golden) |
| Medium | Subtle grid, larger plot boundaries, Premium plots |
| Close | Precise grid, plot boundaries, logos, flags, selection states |

Markers culled by LOD.

### 3.6 Interaction modes
| Mode | Behaviour |
|---|---|
| Explore | Default browsing + idle rotation |
| Select | Rectangular plot selection (drag) |
| Plot Detail | Inspect a claimed plot |
| My Landing | Camera flies to the user's plot |
| Premium | Premium regions highlighted with golden glow |

Toggle controls: Terrain, Ownership, Premium, Labels, Activity, Reset View, My Plot.

---

## 4. Plot system (locked numbers)

### 4.1 Units
- Total inventory: **4,000,000 pixels**
- Minimum plot: **10 × 10 = 100 pixels**
- Supported V1 sizes: 10×10, 20×20, 20×50, 50×100, 100×100 (and any rectangle that is multiple of 10×10)
- Plots **MUST** be rectangular. Arbitrary polygons out of scope for V1.

### 4.2 Pricing (locked)
| Zone | Price per pixel | 10×10 entry |
|---|---|---|
| Standard | **$0.50** | $50 |
| Premium | **$1.00** | $100 |

- Price calculation **MUST** occur server-side. Client-supplied prices rejected.
- Premium regions are defined by real named lunar features and admin-editable.

### 4.3 Premium regions
- V1 defines 20–50 premium regions corresponding to real named lunar features.
- Premium grids render with soft golden glow.
- Tier and price per region admin-editable.

---

## 5. Geographic system

### 5.1 Coordinate model
- Plots store real lunar latitude and longitude.
- Pixel grid maps to equirectangular projection.
- Bidirectional conversion implemented and unit-tested:
  ```
  pixel → lat/lng      lat/lng → pixel
  ```
- Projection assumptions documented in-repo.
- Product **MUST NOT** claim equal physical area per pixel (state this in FAQ).

### 5.2 Named features (minimum V1 set)
Mare Tranquillitatis, Mare Imbrium, Mare Serenitatis, Oceanus Procellarum, Tycho, Copernicus, Aristarchus, South Pole, and others from USGS Planetary Nomenclature.

Every plot resolves to a nearest named feature for display.

---

## 6. Selection UX (locked)

### 6.1 Flow
```
Enter Select Mode → drag rectangle (or click-anchor → opposite corner)
→ highlight area → compute dimensions, pixel count, region, zone, price
→ confirmation panel → Claim this plot
```

- Grid appears only on entering Select Mode.
- Selection snaps to 10×10 minimum blocks.
- Unavailable cells visually distinct and unselectable.
- Rotation stops the moment selection begins.

### 6.2 Selection panel example
```
AREA SELECTION ACTIVE
Pixels selected     400
Size                20 × 20
Zone                Mare Tranquillitatis · Premium
Rate                $1.00 / pixel
─────────────────────────────
Total               $400.00
[ Claim this plot ]
Held for 15:00 while you complete checkout
```

---

## 7. Screens

### 7.1 Navigation
Logo · Explore · How It Works · Leaderboard · Recent Claims · Search · Claim Your Plot · Account

### 7.2 Homepage hero (mobile-first)
- Interactive Moon occupying most of the viewport
- H1: **Claim your place on the Moon.**
- Sub: Claim a digital lunar plot, put your startup, project, community, or name there, and leave your mark on a permanent public Moon map.
- Primary CTA: **Explore the Moon** · Secondary: **Claim Your Plot**

### 7.3 Live statistics
Total Pixels · Claimed Pixels · Available Pixels · Minimum Price · Number of Landings  
(Read from database. At launch = 0. Do not fake.)

### 7.4 Plot card
```
CLAIMED                                    PREMIUM
Plot CLM-8847
RIVERRA LABS
20 × 20 pixels
Mare Tranquillitatis
8.725° N   31.482° E
Claimed Aug 25, 2026
[ View landing ]
```

### 7.5 Public plot page — `/plot/[plot_id]`
Server-rendered. Displays: logo, name, description, website link, plot ID, size, pixel count, lat/long, lunar feature, claim date, price paid, zone, status, transaction history.  
Actions: View on Moon · Visit Landing Site · Share Plot.

### 7.6 Fly-to-landing animation
Post-payment sequence (skippable, preserved on mobile, static under reduced-motion):
1. LANDING CONFIRMED
2. Camera pulls away
3. Moon rotates toward target
4. Camera zooms to region
5. Plot begins glowing
6. Marker appears
7. Plot card appears
8. Welcome to your landing.

### 7.7 Leaderboard
Categories: Largest · Most Invested · Recent · Pioneers.

---

## 8. Outbound links
- `target="_blank" rel="noopener noreferrer nofollow sponsored"`
- Optional referral: `?ref=craterclaim` (owner can opt out)

---

## 9. Data model (priority tables)
`profiles`, `plots`, `plot_cells`, `lunar_features`, `transactions`, `payments`, `media`, `moderation_events`, `plot_events`

Plot record essentials:
```
plot_id · x · y · width · height · pixel_count
center_latitude · center_longitude
lunar_feature · zone (standard|premium)
status · claim_date · price_paid · owner_id
reserved_until
```

- Database is sole source of truth.
- Row-level locking for claims.
- Reservations expire after 15 minutes.

---

## 10. Payment
Provider to be decided later (Dodo Payments / Lemon Squeezy / PayPal / Stripe etc.).  
Architecture must support:
- Server-side price calculation
- 15-min reservation
- Webhook signature verification + idempotency
- Two required checkboxes (novelty acknowledgment + immediate-performance consent)
- Never trust client payment state

---

## 11–16. Media, Moderation, Responsive, Legal, Security, Analytics, Performance
(All original requirements remain in force. Key additions:)

- **Mobile-first** is mandatory. Bottom sheets on mobile, simplified controls, touch rotate + pinch zoom, Moon remains dominant.
- Device capability check → fall back to 2D map when WebGL is weak/unavailable.
- Public plot pages fully usable without WebGL.
- WCAG 2.2 AA contrast.
- Zone conveyed by label + colour (never colour alone).
- Texture compression (KTX2/Basis), LOD, frustum culling, progressive loading.

---

## 17. SEO and social
Every plot page: dynamic title, description, OG tags, Twitter/X card, canonical, social image.  
Paginated server-rendered directory is the primary crawlable surface.  
OG images: pre-rendered moon base + composited plot overlay (recommended).

---

## 18–21. Seed data, Admin, Search, Scope
Unchanged from original except pricing and tier language updated to Standard / Premium only.

**Explicitly out of scope for V1:** Blockchain, NFTs, crypto wallets, mobile native app, social network, chat, randomised mechanics, auctions, secondary market, complex polygons.

---

## 22. Recommended Build Order (updated)

| Phase | Deliverable |
|---|---|
| **0** | Teaser + waitlist (optional but recommended) |
| 1 | Design system, layout, navigation, mobile-first shell |
| 2 | Interactive Moon (procedural + real texture) + idle rotation that stops on interaction |
| 3 | Coordinate system + 4M pixel grid |
| 4 | Plot selection (drag rectangle + snap) |
| 5 | Claimed plot rendering + Premium golden glow |
| 6 | Plot detail card |
| 7 | Public plot page (SSR) |
| 8 | Authentication |
| 9 | Supabase database + RLS |
| 10 | Logo upload + moderation pipeline |
| 11 | Payment checkout (mock first, real later) |
| 12 | Verified webhook activation |
| 13 | Admin + moderation |
| 14 | Leaderboard + recent activity |
| 15 | SEO + social sharing |
| 16 | Performance optimisation + mobile polish |

---

## 23. First build milestone (prototype)
Homepage · interactive real Moon · camera controls · idle rotation that stops on interaction · zoom · grid · drag selection · price calculation (Standard/Premium) · selection panel · demo claimed plots with golden Premium glow · fly-to animation · public plot page · fully responsive mobile-first UI.

---

## 24. Definition of done
A user can complete the entire core loop on both mobile and desktop, payment is server-verified, ownership is database-driven, and the public plot page is shareable and crawlable.

---

## 25. Step-by-step prompt for building this (copy-paste ready)

Use the following prompt sequence (or feed the entire Final Spec) when building with Lovable, Cursor, v0, or any AI coding agent:

### Prompt 1 — Project foundation
```
Build a production-quality Next.js 14+ (App Router) + TypeScript + Tailwind + shadcn/ui application called CraterClaim.

Core product: persistent interactive 3D Moon map where people claim digital lunar plots.

Key locked decisions:
- Only two zones: Standard ($0.50/px) and Premium ($1.00/px). Premium grids glow soft golden.
- Total inventory: 4,000,000 pixels.
- Minimum plot 10×10. Rectangular only.
- Idle Moon rotation that permanently stops on first user interaction / selection.
- Drag-to-select rectangle for plots (also support click-anchor → opposite corner).
- Mobile-first design is mandatory.
- Procedural sphere + real equirectangular Moon texture (NASA SVS or Solar System Scope).
- Three.js + React Three Fiber + Drei.
- Never position as advertising. Always clarify digital plots only.

Start with the design system, dark space palette, glass panels, navigation, and a full-viewport interactive Moon that auto-rotates slowly and stops on pointer interaction. Mobile-first layout with bottom sheets ready.
```

### Prompt 2 — Moon + camera
```
Implement the full 3D Moon layer:
- SphereGeometry + high-res equirectangular texture + normal map.
- Idle drift ≤0.02 rad/s, cancelled permanently on first interaction.
- Smooth OrbitControls with inertia, zoom limits, fly-to utility.
- LOD system for grid density.
- Layer separation: Moon / Ownership canvas texture / Information markers.
- prefers-reduced-motion support.
```

### Prompt 3 — Grid + selection
```
Add the ownership grid and selection system:
- 4,000,000 pixel equirectangular grid.
- Enter Select Mode → show grid.
- Drag rectangle (or click two corners) that snaps to 10×10 blocks.
- Live calculation of size, pixel count, nearest lunar feature, Standard/Premium zone, price.
- Selection panel with “Claim this plot” and 15-minute hold timer.
- Premium regions render with soft golden glow.
```

### Prompt 4 — Claim flow + public page
```
Implement claim flow (mock payment for now), logo upload, listing details, public SSR plot page at /plot/[id], fly-to-landing animation sequence (skippable), leaderboard skeleton, and recent claims.
All copy must reinforce that these are digital plots only.
```

### Prompt 5 — Polish & mobile
```
Make the entire experience mobile-first:
- Touch rotate + pinch zoom.
- Bottom sheets for selection panel and plot cards.
- Moon remains the hero.
- Fallback 2D map when WebGL is unavailable.
- Performance: texture compression, LOD, culling, skeleton states.
```

---

## 26. Notes
- Logo and domains already exist — use them.
- Payment provider decision deferred.
- Lovable preview at the provided URL currently requires authentication / is behind Cloudflare; the visual direction described by the founder (“close to perfect with brand design”) is the target reference.
- Legal, tax, and consumer-law review still required before public launch.
- Revenue expectations for this category remain modest; keep scope disciplined.

---

**This document is the single source of truth for V1.**  
All previous open decisions are now closed according to founder direction.
